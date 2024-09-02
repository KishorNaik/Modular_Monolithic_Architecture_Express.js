import { authenticateJwt } from '@/middlewares/auth.middleware';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import {
	RemoveOrganizationRequestDTO,
	RemoveOrganizationResponseDTO,
} from '@/modules/organization/contracts/features/removeOrganization.Contracts';
import { DataResponse, DataResponseFactory } from '@/shared/models/response/data.Response';
import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { IRequest, IRequestHandler, requestHandler } from 'mediatr-ts';
import {
	Delete,
	HttpCode,
	JsonController,
	OnUndefined,
	Param,
	Res,
	UseBefore,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import Container from 'typedi';
import { DataSource } from 'typeorm';
import OrgDataSource from '../../../Infrastructure/org.DataSource';
import { CommandException, HttpException } from '@/shared/utils/httpException';
import { OrgEntity } from '../../../Infrastructure/Entity/org.Entity';
import { StatusEnum } from '@/shared/models/enums/status.enum';
import { Err, Ok, Result } from 'neverthrow';
import mediatR from '@/shared/medaitR/index';

// region Controller Service
@JsonController('/api/v1/organizations')
@OpenAPI({ tags: ['organizations'] })
export class RemoveOrganizationController {
	@Delete('/:id')
	@HttpCode(StatusCodes.OK)
	@OnUndefined(StatusCodes.BAD_REQUEST)
	@OpenAPI({
		summary: 'Remove an organization',
		tags: ['organizations'],
		security: [{ bearerAuth: [] }],
	})
	@UseBefore(authenticateJwt)
	public async removeAsync(@Param('id') id: number, @Res() res: Response) {
		const request = new RemoveOrganizationRequestDTO();
		request.id = id;

		const response = await mediatR.send<DataResponse<RemoveOrganizationResponseDTO>>(
			new RemoveOrganizationCommand(request)
		);

		return res.status(response.StatusCode).json(response);
	}
}
//endregion

// region Command Service
class RemoveOrganizationCommand implements IRequest<DataResponse<RemoveOrganizationResponseDTO>> {
	public constructor(request: RemoveOrganizationRequestDTO) {
		this._request = request;
	}

	private _request: RemoveOrganizationRequestDTO;
	public get request(): RemoveOrganizationRequestDTO {
		return this._request;
	}
}

@requestHandler(RemoveOrganizationCommand)
class RemoveOrganizationCommandHandler
	implements
		IRequestHandler<RemoveOrganizationCommand, DataResponse<RemoveOrganizationResponseDTO>>
{
	private readonly appDataSource: DataSource = null;

	public constructor() {
		this.appDataSource = OrgDataSource;
	}

	private async removeAsync(
		removeOrganizationRequestDTO: RemoveOrganizationRequestDTO
	): Promise<Result<boolean, HttpException>> {
		try {
			const result = await this.appDataSource.manager
				.createQueryBuilder()
				.update(OrgEntity)
				.set({
					status: StatusEnum.INACTIVE,
				})
				.where('id=:id', { id: removeOrganizationRequestDTO.id })
				.execute();

			if (result.affected == 0)
				return new Err(
					new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'Organization not found')
				);

			return new Ok(true);
		} catch (ex) {
			return new Err(new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, ex.message));
		}
	}

	private response() {
		const removeOrganizationResponseDTO = new RemoveOrganizationResponseDTO();
		removeOrganizationResponseDTO.updatedDateTime = new Date();

		return DataResponseFactory.Response<RemoveOrganizationResponseDTO>(
			true,
			StatusCodes.OK,
			removeOrganizationResponseDTO,
			'Organization removed successfully'
		);
	}

	public async handle(
		value: RemoveOrganizationCommand
	): Promise<DataResponse<RemoveOrganizationResponseDTO>> {
		try {
			// check request is empty or not
			if (!value)
				return CommandException.commandError('Invalid request', StatusCodes.BAD_REQUEST);

			// Remove Org
			const removeOrgResult = await this.removeAsync(value.request);
			if (removeOrgResult.isErr())
				return CommandException.commandError(
					removeOrgResult.error.message,
					removeOrgResult.error.status
				);

			// Response
			return this.response();
		} catch (ex) {
			return CommandException.commandError(ex.message, StatusCodes.INTERNAL_SERVER_ERROR);
		}
	}
}
// endregion

// region Integration Service

export class RemoveOrganizationIntegrationService
	implements IRequest<DataResponse<RemoveOrganizationResponseDTO>>
{
	constructor(id: number) {
		this._id = id;
	}

	private _id: number;
	public get id(): number {
		return this._id;
	}
}

@requestHandler(RemoveOrganizationIntegrationService)
export class RemoveOrganizationIntegrationServiceHandler
	implements
		IRequestHandler<
			RemoveOrganizationIntegrationService,
			DataResponse<RemoveOrganizationResponseDTO>
		>
{
	public async handle(
		value: RemoveOrganizationIntegrationService
	): Promise<DataResponse<RemoveOrganizationResponseDTO>> {
		const request = new RemoveOrganizationRequestDTO();
		request.id = value.id;

		const response = await mediatR.send<DataResponse<RemoveOrganizationResponseDTO>>(
			new RemoveOrganizationCommand(request)
		);

		return response;
	}
}

export class RemoveOrganizationRollbackIntegrationService
	implements IRequest<DataResponse<RemoveOrganizationResponseDTO>>
{
	constructor(id: number) {
		this._id = id;
	}

	private _id: number;
	public get id(): number {
		return this._id;
	}
}

@requestHandler(RemoveOrganizationRollbackIntegrationService)
export class RemoveOrganizationRollbackIntegrationServiceHandler
	implements
		IRequestHandler<
			RemoveOrganizationRollbackIntegrationService,
			DataResponse<RemoveOrganizationResponseDTO>
		>
{
	private readonly appDataSource: DataSource = null;

	public constructor() {
		this.appDataSource = OrgDataSource;
	}

	private async removeAsync(id: number): Promise<Result<boolean, HttpException>> {
		try {
			const result = await this.appDataSource.manager
				.createQueryBuilder()
				.update(OrgEntity)
				.set({
					status: StatusEnum.ACTIVE,
				})
				.where('id=:id', { id: id })
				.execute();

			if (result.affected == 0)
				return new Err(
					new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'Organization not found')
				);

			return new Ok(true);
		} catch (ex) {
			return new Err(new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, ex.message));
		}
	}

	private response() {
		const removeOrganizationResponseDTO = new RemoveOrganizationResponseDTO();
		removeOrganizationResponseDTO.updatedDateTime = new Date();

		return DataResponseFactory.Response<RemoveOrganizationResponseDTO>(
			true,
			StatusCodes.OK,
			removeOrganizationResponseDTO,
			'Organization removed successfully'
		);
	}
	public async handle(
		value: RemoveOrganizationRollbackIntegrationService
	): Promise<DataResponse<RemoveOrganizationResponseDTO>> {
		try {
			// check request is empty or not
			if (!value)
				return CommandException.commandError('Invalid request', StatusCodes.BAD_REQUEST);

			// RollBack
			const removeOrgResult = await this.removeAsync(value.id);
			if (removeOrgResult.isErr())
				return CommandException.commandError(
					removeOrgResult.error.message,
					removeOrgResult.error.status
				);

			// Response
			return this.response();
		} catch (ex) {
			return CommandException.commandError(ex.message, StatusCodes.INTERNAL_SERVER_ERROR);
		}
	}
}
// endregion
