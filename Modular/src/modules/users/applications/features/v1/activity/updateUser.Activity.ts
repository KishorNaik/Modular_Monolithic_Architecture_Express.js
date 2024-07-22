import { authenticateJwt } from '@/middlewares/auth.middleware';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import { UpdateUserRequestDTO, UpdateUserResponseDTO } from '@/modules/users/contracts/features/updateUser.Contract';
import mediatR from '@/shared/medaitR/mediatR';
import { DataResponse, DataResponseFactory } from '@/shared/models/response/data.Response';
import { IUserTokenProviderService, UserTokenProviderService } from '@/shared/services/users/userTokenProvider.service';
import { CommandException, HttpException } from '@/shared/utils/httpException';
import { Response } from 'express';
import { Request } from 'express-jwt';
import { StatusCodes } from 'http-status-codes';
import { IRequest, IRequestHandler, requestHandler } from 'mediatr-ts';
import { Err, Ok, Result } from 'neverthrow';
import { Body, HttpCode, JsonController, OnUndefined, Put, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import Container from 'typedi';
import { DataSource } from 'typeorm';
import { UserEntity } from '../../../infrastructure/Entity/user.Entity';

// Region Controller
@JsonController('/api/v1/users')
@OpenAPI({ tags: ['users'] })
export class UpdateUserController {
    private readonly userProvider: IUserTokenProviderService;

    public constructor() {
        this.userProvider = Container.get(UserTokenProviderService);
    }

    @Put()
    @OpenAPI({ summary: 'Update new user', tags: ['users'] })
    @HttpCode(StatusCodes.CREATED)
    @OnUndefined(StatusCodes.BAD_REQUEST)
    @UseBefore(ValidationMiddleware(UpdateUserRequestDTO), authenticateJwt)
    public async updateUserAsync(@Body() request: UpdateUserRequestDTO, @Req() req: Request, @Res() res: Response) {
        request.id = parseInt(this.userProvider.getUserId(req));

        const response = await mediatR.send<DataResponse<UpdateUserRequestDTO>>(new UpdateUserCommand(request));
        return res.status(response.StatusCode).json(response);
    }
}

//endregion

// #region Command Service
export class UpdateUserCommand implements IRequest<DataResponse<UpdateUserResponseDTO>> {
    public constructor(request: UpdateUserRequestDTO) {
        this._request = request;
    }

    private _request: UpdateUserRequestDTO;
    public get request(): UpdateUserRequestDTO {
        return this._request;
    }
}

@requestHandler(UpdateUserCommand)
class UpdateUserCommandHandler implements IRequestHandler<UpdateUserCommand, DataResponse<UpdateUserResponseDTO>> {
    private readonly appDataSource: DataSource;

    public constructor() {
        this.appDataSource = this.appDataSource;
    }

    private async updateAsync(value: UpdateUserCommand): Promise<Result<boolean, HttpException>> {
        try {
            const result = await this.appDataSource.manager
                .createQueryBuilder()
                .update(UserEntity)
                .set({
                    fullName: value.request.fullName,
                    emailId: value.request.email,
                })
                .where('id = :id', { id: value.request.id })
                .execute();

            if (result.affected === 0) return new Err(new HttpException(StatusCodes.BAD_REQUEST, 'User not found'));

            return new Ok(true);
        } catch (ex) {
            return new Err(new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, ex.message));
        }
    }

    private response(): DataResponse<UpdateUserResponseDTO> {
        const response = new UpdateUserResponseDTO();
        response.updateDateTime = new Date();

        return DataResponseFactory.Response(true, StatusCodes.OK, response, 'User updated successfully');
    }
    public async handle(value: UpdateUserCommand): Promise<DataResponse<UpdateUserResponseDTO>> {
        try {
            // Check argument is empty or not
            if (!value || !value.request) return CommandException.commandError('UpdateUserCommand is required', StatusCodes.BAD_REQUEST);

            // Update Users
            const updateResult = await this.updateAsync(value);
            if (updateResult.isErr()) return CommandException.commandError(updateResult.error.message, updateResult.error.status);

            return this.response();
        } catch (ex) {
            return CommandException.commandError(ex.message, StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}
// endregion
