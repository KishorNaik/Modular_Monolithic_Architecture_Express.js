import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import { CreateOrganizationRequestDTO, CreateOrganizationResponseDTO } from '@/modules/organization/contracts/features/createOrganization.Contract';
import mediatR from '@/shared/medaitR/mediatR';
import { DataResponse, DataResponseFactory } from '@/shared/models/response/data.Response';
import { Response } from 'express';
import { Guid } from 'guid-typescript';
import { StatusCodes } from 'http-status-codes';
import { INotification, INotificationHandler, IRequest, IRequestHandler, requestHandler } from 'mediatr-ts';
import 'reflect-metadata';
import { Body, HttpCode, JsonController, OnUndefined, Post, Res, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import OrgDataSource from '../../../Infrastructure/org.DataSource';
import { DataSource } from 'typeorm';
import { CommandException, HttpException } from '@/shared/utils/httpException';
import { OrgEntity } from '../../../Infrastructure/Entity/org.Entity';
import { Err, Ok, Result } from 'neverthrow';
import { Job } from '@/shared/utils/job';
// region Controller Service

@JsonController('/api/v1/organizations')
@OpenAPI({ tags: ['organizations'] })
export class CreateOrganizationController {
  @Post()
  @OpenAPI({ summary: 'Create a new organization', tags: ['organizations'] })
  @HttpCode(StatusCodes.CREATED)
  @OnUndefined(StatusCodes.BAD_REQUEST)
  @UseBefore(ValidationMiddleware(CreateOrganizationRequestDTO))
  public async createOrganizationAsync(@Body() createOrganizationRequestDTO: CreateOrganizationRequestDTO, @Res() res: Response) {
    const response = await mediatR.send<DataResponse<CreateOrganizationResponseDTO>>(new CreateOrganizationCommand(createOrganizationRequestDTO));
    return res.status(response.StatusCode).json(response);
  }
}

// endregion

// region Command Service

class CreateOrganizationCommand implements IRequest<DataResponse<CreateOrganizationResponseDTO>> {
  constructor(createOrganizationRequestDTO: CreateOrganizationRequestDTO) {
    this._createOrganizationRequestDTO = createOrganizationRequestDTO;
  }

  private _createOrganizationRequestDTO: CreateOrganizationRequestDTO;
  public get createOrganizationRequestDTO(): CreateOrganizationRequestDTO {
    return this._createOrganizationRequestDTO;
  }
}

@requestHandler(CreateOrganizationCommand)
class CreateOrganizationCommandHandler implements IRequestHandler<CreateOrganizationCommand, DataResponse<CreateOrganizationResponseDTO>> {
  private readonly appDataSource: DataSource;

  constructor() {
    this.appDataSource = OrgDataSource;
  }

  private map(createOrganizationRequestDTO: CreateOrganizationRequestDTO): OrgEntity {
    const orgEntity = new OrgEntity();
    orgEntity.name = createOrganizationRequestDTO.name;
    orgEntity.location = createOrganizationRequestDTO.location;

    return orgEntity;
  }

  private async addAsync(orgEntity: OrgEntity): Promise<Result<number, HttpException>> {
    try {
      if (!orgEntity) return new Err(new HttpException(StatusCodes.BAD_REQUEST, 'orgEntity is null'));

      const result = await this.appDataSource.manager.save(orgEntity);

      if (!result) return new Err(new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'result is null'));

      return new Ok(result.id);
    } catch (ex) {
      return new Err(new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, ex.message));
    }
  }

  private response(id: number): DataResponse<CreateOrganizationResponseDTO> {
    const createOrganizationResponseDTO: CreateOrganizationResponseDTO = new CreateOrganizationResponseDTO();
    createOrganizationResponseDTO.id = id;

    return DataResponseFactory.Response<CreateOrganizationResponseDTO>(
      true,
      StatusCodes.CREATED,
      createOrganizationResponseDTO,
      'Organization created successfully',
    );
  }
  public async handle(value: CreateOrganizationCommand): Promise<DataResponse<CreateOrganizationResponseDTO>> {
    // Check argument
    if (!value) return CommandException.commandError('argument is null', StatusCodes.BAD_REQUEST);

    // Map
    const orgEntity: OrgEntity = this.map(value.createOrganizationRequestDTO);
    if (!orgEntity) return CommandException.commandError('map error', StatusCodes.BAD_REQUEST);

    // Save
    const addOrgResult = await this.addAsync(orgEntity);
    if (addOrgResult.isErr()) return CommandException.commandError(addOrgResult.error.message, addOrgResult.error.status);

    // Call Domain Entity
    Job(() => mediatR.publish(new OrganizationCreatedDomainEvent(addOrgResult.value)));

    // Response
    return this.response(addOrgResult.value);
  }
}

// endregion

// region Domain Event
class OrganizationCreatedDomainEvent implements INotification {
  constructor(id: number) {
    this._id = id;
  }

  private _id: number;
  public get id(): number {
    return this._id;
  }
}

class OrganizationCreatedDomainEventHandler implements INotificationHandler<OrganizationCreatedDomainEvent> {
  public handle(notification: OrganizationCreatedDomainEvent): Promise<void> {
    console.log(`OrganizationCreatedDomainEventHandler: ${JSON.stringify(notification)}`);
    return Promise.resolve();
  }
}
// endregion
