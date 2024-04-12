import { authenticateJwt } from '@/middlewares/auth.middleware';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import { RemoveUserRequestDTO, RemoveUserResponseDTO } from '@/modules/users/contracts/features/removeUser.Contracts';
import { DataResponse, DataResponseFactory } from '@/shared/models/response/data.Response';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { IRequest, IRequestHandler, requestHandler } from 'mediatr-ts';
import { Delete, HttpCode, JsonController, OnUndefined, Param, Post, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import Container from 'typedi';
import { DataSource, QueryResult, QueryRunner } from 'typeorm';
import UserDataSource from '../../../infrastructure/user.DataStore';
import { CommandException, HttpException } from '@/shared/utils/httpException';
import { UserEntity } from '../../../infrastructure/Entity/user.Entity';
import { IUserSharedRepository, UserSharedRepository } from '../../../shared/repository/user.repository';
import mediatR from '@/shared/medaitR/mediatR';
import {
  RemoveOrganizationIntegrationService,
  RemoveOrganizationRollbackIntegrationService,
} from '@/modules/organization/applications/features/v1/activity/removeOrganization.Activity';
import { RemoveOrganizationResponseDTO } from '@/modules/organization/contracts/features/removeOrganization.Contracts';
import { Err, Ok, Result } from 'neverthrow';
import { StatusEnum } from '@/shared/models/enums/status.enum';
import Enumerable from 'linq';
import { IUserProviderService, UserProviderService } from '@/shared/services/users/userProvider.service';
import { SagaBuilder, SagaResult } from '@/shared/utils/saga.Builder';

// #region Controller Service
@JsonController('/api/v1/users')
@OpenAPI({ tags: ['users'] })
export class RemoveUserController {
  private readonly userProvider: IUserProviderService;

  public constructor() {
    this.userProvider = Container.get(UserProviderService);
  }

  @Delete()
  @OpenAPI({ summary: 'Remove User', tags: ['users'] })
  @HttpCode(StatusCodes.OK)
  @OnUndefined(StatusCodes.BAD_REQUEST)
  @UseBefore(authenticateJwt)
  public async removeAsync(@Req() req: Request, @Res() res: Response) {
    const id = parseInt(this.userProvider.getUserId(req));

    const request = new RemoveUserRequestDTO();
    request.id = id;

    const response = await mediatR.send<DataResponse<RemoveUserResponseDTO>>(new RemoveUserCommand(request));
    return res.status(response.StatusCode).json(response);
  }
}

//endregion

//#region Command Service

class RemoveUserCommand implements IRequest<DataResponse<RemoveUserResponseDTO>> {
  public constructor(request: RemoveUserRequestDTO) {
    this._request = request;
  }

  private _request: RemoveUserRequestDTO;
  public get request(): RemoveUserRequestDTO {
    return this._request;
  }
}

@requestHandler(RemoveUserCommand)
class RemoveUserCommandHandler implements IRequestHandler<RemoveUserCommand, DataResponse<RemoveUserResponseDTO>> {
  private readonly appDataSource: DataSource = null;
  private readonly userSharedRepository: IUserSharedRepository;

  public constructor() {
    this.appDataSource = UserDataSource;
    this.userSharedRepository = Container.get(UserSharedRepository);
  }

  private response(): DataResponse<RemoveUserResponseDTO> {
    const removeUserResponseDTO: RemoveUserResponseDTO = new RemoveUserResponseDTO();
    removeUserResponseDTO.updatedDateTime = new Date();

    return DataResponseFactory.Response(true, StatusCodes.OK, removeUserResponseDTO, 'User removed successfully');
  }

  public async handle(value: RemoveUserCommand): Promise<DataResponse<RemoveUserResponseDTO>> {
    let queryRunner: QueryRunner = null;
    try {
      // Check if request is empty
      if (!value) return CommandException.commandError('Invalid request', StatusCodes.BAD_REQUEST);

      // create Query runner instance
      queryRunner = await this.appDataSource.createQueryRunner();
      queryRunner.connect();

      // Get user data by Id
      const userEntityResult = await this.userSharedRepository.getUserByIdAsync(value.request.id, queryRunner);
      if (userEntityResult.isErr()) return CommandException.commandError('User not found', StatusCodes.NOT_FOUND);

      // Map user entity
      const userEntity: UserEntity = userEntityResult.value;

      // Start Transaction
      await queryRunner.startTransaction();

      // Run Remove User Saga Orchestrator
      const removeSagaOrchestrator: boolean = await mediatR.send<boolean>(new RemoveUserSagaOrchestrator(userEntity, queryRunner));
      if (removeSagaOrchestrator === false) return CommandException.commandError('Remove user failed', StatusCodes.INTERNAL_SERVER_ERROR);

      // Commit Transaction
      await queryRunner.commitTransaction();

      // Response
      return this.response();
    } catch (ex) {
      if (queryRunner) await queryRunner.rollbackTransaction();

      return CommandException.commandError(ex.message, StatusCodes.INTERNAL_SERVER_ERROR);
    } finally {
      if (queryRunner) await queryRunner.release();
    }
  }
}
//endregion

// #region Saga Orchestrator
class RemoveUserSagaResult {
  public constructor(removeOrgResult: Result<boolean, HttpException>, removeUserResult: Result<boolean, HttpException>, queryRunner: QueryRunner) {
    this._removeOrgResult = removeOrgResult;
    this._removeUserResult = removeUserResult;
    this._queryRunner = queryRunner;
  }

  private _removeOrgResult: Result<boolean, HttpException>;
  public get removeOrgResult(): Result<boolean, HttpException> {
    return this._removeOrgResult;
  }

  private _removeUserResult: Result<boolean, HttpException>;
  public get removeUserResult(): Result<boolean, HttpException> {
    return this._removeUserResult;
  }

  private _queryRunner: QueryRunner;
  public get queryRunner(): QueryRunner {
    return this._queryRunner;
  }
}

class RemoveUserSagaOrchestrator implements IRequest<boolean> {
  public constructor(userEntity: UserEntity, queryRunner: QueryRunner) {
    this._userEntity = userEntity;
    this._queryRunner = queryRunner;
  }

  private _queryRunner: QueryRunner;
  public get queryRunner(): QueryRunner {
    return this._queryRunner;
  }

  private _userEntity: UserEntity;
  public get userEntity(): UserEntity {
    return this._userEntity;
  }
}

@requestHandler(RemoveUserSagaOrchestrator)
class RemoveUserSagaOrchestratorHandler implements IRequestHandler<RemoveUserSagaOrchestrator, boolean> {
  private readonly appDataSource: DataSource = null;

  public constructor() {
    this.appDataSource = UserDataSource;
  }

  private async removeOrgAsync(orgId: number): Promise<Result<boolean, HttpException>> {
    const removeOrgResult = await mediatR.send<DataResponse<RemoveOrganizationResponseDTO>>(new RemoveOrganizationIntegrationService(orgId));
    if (removeOrgResult.Success === false) return new Err(new HttpException(removeOrgResult.StatusCode, removeOrgResult.Message));

    return new Ok(true);
  }

  private async removeUserAsync(userId: number, queryRunner: QueryRunner): Promise<Result<boolean, HttpException>> {
    try {
      const result = await this.appDataSource.manager
        .createQueryBuilder(queryRunner)
        .update(UserEntity)
        .set({
          status: StatusEnum.INACTIVE,
        })
        .where('id=:id', { id: userId })
        .execute();

      if (result.affected == 0) return new Err(new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'User not found'));

      return new Ok(true);
    } catch (ex) {
      return new Err(new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, ex.message));
    }
  }

  public async handle(value: RemoveUserSagaOrchestrator): Promise<boolean> {
    try {
      const sagaBuilder: SagaBuilder<RemoveUserSagaResult> = new SagaBuilder('Remove-User-Saga-Orchestrator');

      sagaBuilder
        .activity('Remove-Activity', async () => {
          // Remove Organization
          const removeOrgResult = await this.removeOrgAsync(value.userEntity.orgId);

          // Remove User
          const removeUserResult = await this.removeUserAsync(value.userEntity.id, value.queryRunner);

          // Store Both result in SagaResult Object
          return new SagaResult(true, new RemoveUserSagaResult(removeOrgResult, removeUserResult, value.queryRunner));
        })
        .compensationActivity('Remove-Activity', 'Remove-User-RollBack', async sagaResult => {
          // Revert Remove Organization
          if (sagaResult.Results.removeUserResult.isErr()) {
            await mediatR.send<DataResponse<RemoveOrganizationResponseDTO>>(new RemoveOrganizationRollbackIntegrationService(value.userEntity.orgId));
            sagaResult.IsSuccess = false;
          }
        })
        .compensationActivity('Remove-Activity', 'Remove-Org-RollBack', async sagaResult => {
          // Revert Remove User
          if (sagaResult.Results.removeOrgResult.isErr()) {
            await sagaResult.Results.queryRunner.rollbackTransaction();
            sagaResult.IsSuccess = false;
          }
        });

      // Execute Saga
      await sagaBuilder.executeAsync();

      // Check if Saga Completed Successfully
      const sagaActivityResult = Enumerable.from(sagaBuilder.activityResults).firstOrDefault(x => x.activityName === 'Remove-Activity');
      if (sagaActivityResult.sagaResult.IsSuccess === false) return false;

      return true;
    } catch (ex) {
      return false;
    }
  }
}

// #endregion
