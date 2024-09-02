import 'reflect-metadata';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import {
	Body,
	HttpCode,
	JsonController,
	OnUndefined,
	Post,
	Res,
	UseBefore,
} from 'routing-controllers';
import {
	CreateUserRequestDTO,
	CreateUserResponseDTO,
	ICreateUserRequestDTO,
} from '@/modules/users/contracts/features/createUser.Contract';
import { Response } from 'express';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import {
	INotification,
	INotificationHandler,
	IRequest,
	IRequestHandler,
	notificationHandler,
	requestHandler,
} from 'mediatr-ts';
import { DataResponse, DataResponseFactory } from '@/shared/models/response/data.Response';
import { Guid } from 'guid-typescript';
import { StatusCodes } from 'http-status-codes';
import mediatR from '@/shared/medaitR/index';
import { Job } from '@/shared/utils/job';
import { delay } from '@/shared/utils/delay';
import { WelcomeEmailIntegrationEvent } from '@/modules/notification/applications/features/v1/activity/welcomeEmail.activity';
import {
	HashPasswordService,
	IHashPasswordService,
} from '../../../shared/services/hashPassword.service.';
import Container from 'typedi';
import { CommandException, HttpException } from '@/shared/utils/httpException';
import { Err, Ok, Result } from 'neverthrow';
import { UserEntity } from '../../../infrastructure/Entity/user.Entity';
import UserDataSource from '../../../infrastructure/user.DataStore';
import { DataSource } from 'typeorm';
import { GetOrgByIdIntegrationService } from '@/modules/organization/applications/features/v1/activity/getOrgById.Activity';
import { get } from 'http';
import { GetOrgByIdResponseDTO } from '@/modules/organization/contracts/features/getOrgById.Contracts';

// #region Controller Service
@JsonController('/api/v1/users')
@OpenAPI({ tags: ['users'] })
export class CreateUserController {
	@Post()
	@OpenAPI({ summary: 'Create a new user', tags: ['users'] })
	@HttpCode(StatusCodes.CREATED)
	@OnUndefined(StatusCodes.BAD_REQUEST)
	@UseBefore(ValidationMiddleware(CreateUserRequestDTO))
	public async addUserAsync(
		@Body() createUserRequestDTO: CreateUserRequestDTO,
		@Res() res: Response
	) {
		const response = await mediatR.send<DataResponse<CreateUserResponseDTO>>(
			new CreateUserCommand(createUserRequestDTO)
		);
		return res.status(response.StatusCode).json(response);
	}
}

// #endregion

// #region Command Service

class CreateUserCommand implements IRequest<DataResponse<CreateUserResponseDTO>> {
	constructor(createUserRequestDTO: CreateUserRequestDTO) {
		this._createUserRequestDTO = createUserRequestDTO;
	}

	private _createUserRequestDTO: CreateUserRequestDTO;
	public get createUserRequestDTO(): CreateUserRequestDTO {
		return this._createUserRequestDTO;
	}
}

@requestHandler(CreateUserCommand)
class CreateUserCommandHandler
	implements IRequestHandler<CreateUserCommand, DataResponse<CreateUserResponseDTO>>
{
	private readonly hashPasswordService: IHashPasswordService;
	private readonly appDataSource: DataSource;

	constructor() {
		this.appDataSource = UserDataSource;
		this.hashPasswordService = Container.get(HashPasswordService);
	}

	private async isOrgExistsAsync(id: number): Promise<Result<boolean, HttpException>> {
		try {
			if (!id) return new Err(new HttpException(StatusCodes.BAD_REQUEST, 'id is null'));

			// check if org exists
			const getOrgExistsIntegrationServiceResult: DataResponse<GetOrgByIdResponseDTO> =
				await mediatR.send<DataResponse<GetOrgByIdResponseDTO>>(
					new GetOrgByIdIntegrationService(id)
				);

			if (getOrgExistsIntegrationServiceResult.Success === false)
				return new Err(
					new HttpException(
						getOrgExistsIntegrationServiceResult.StatusCode,
						getOrgExistsIntegrationServiceResult.Message
					)
				);

			return new Ok(true);
		} catch (ex) {
			return new Err(new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, ex.message));
		}
	}

	private map(value: CreateUserRequestDTO): UserEntity {
		const userEntity: UserEntity = new UserEntity();
		userEntity.fullName = value.fullName;
		userEntity.emailId = value.email;
		userEntity.password = value.password;
		userEntity.orgId = value.orgId;
		return userEntity;
	}

	private async addAsync(userEntity: UserEntity): Promise<Result<number, HttpException>> {
		try {
			if (!userEntity)
				return new Err(new HttpException(StatusCodes.BAD_REQUEST, 'userEntity is null'));

			const result = await this.appDataSource.manager
				.createQueryBuilder()
				.insert()
				.into(UserEntity)
				.values(userEntity)
				.execute();

			if (!result.identifiers[0].id)
				return new Err(
					new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'userEntity is null')
				);

			return new Ok(result.identifiers[0].id);
		} catch (ex) {
			return new Err(new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, ex.message));
		}
	}

	private response(id: number): DataResponse<CreateUserResponseDTO> {
		const createResponseDTO: CreateUserResponseDTO = new CreateUserResponseDTO();
		createResponseDTO.id = id;

		return DataResponseFactory.Response(
			true,
			StatusCodes.CREATED,
			createResponseDTO,
			'User created successfully'
		);
	}

	public async handle(value: CreateUserCommand): Promise<DataResponse<CreateUserResponseDTO>> {
		if (!value)
			return CommandException.commandError('argument is null', StatusCodes.BAD_REQUEST);

		// Is Org Exists
		const isOrgExistsResult = await this.isOrgExistsAsync(value.createUserRequestDTO.orgId);

		if (isOrgExistsResult.isErr())
			return CommandException.commandError(
				isOrgExistsResult.error.message,
				isOrgExistsResult.error.status
			);

		// Generate Hash Password.
		const hashedPassword = await this.hashPasswordService.hashPasswordAsync(
			value.createUserRequestDTO.password
		);
		if (hashedPassword.isErr())
			return CommandException.commandError(
				hashedPassword.error.message,
				hashedPassword.error.status
			);

		// Map
		value.createUserRequestDTO.password = hashedPassword.value; // Replace With Hash Password
		const userEntity: UserEntity = this.map(value.createUserRequestDTO);
		// Save User
		const addUserResult = await this.addAsync(userEntity);

		if (addUserResult.isErr())
			return CommandException.commandError(
				addUserResult.error.message,
				addUserResult.error.status
			);

		const id: number = addUserResult.value;

		//Call Domain Event
		Job(() =>
			mediatR.publish(
				new UserCreatedDomainEvent(
					id,
					value.createUserRequestDTO.fullName,
					value.createUserRequestDTO.email
				)
			)
		);

		//Response
		return this.response(id);
	}
}

// #endregion

// region Domain Event Handler

class UserCreatedDomainEvent implements INotification {
	constructor(id: number, fullName: string, emailId: string) {
		this._id = id;
		this._fullName = fullName;
		this._emailId = emailId;
	}

	private _id: number;
	public get id(): number {
		return this._id;
	}

	private _fullName: string;
	public get fullName(): string {
		return this._fullName;
	}

	private _emailId: string;
	public get emailId(): string {
		return this._emailId;
	}
}

@notificationHandler(UserCreatedDomainEvent)
class UserCreatedDomainEventHandler implements INotificationHandler<UserCreatedDomainEvent> {
	public async handle(notification: UserCreatedDomainEvent): Promise<void> {
		await delay(10000);
		console.log(`User with id ${notification.id} has been created`);

		// Cache Event
		// ....Pending

		// Send Welcome Event
		await mediatR.publish(
			new WelcomeEmailIntegrationEvent({
				emailId: notification.emailId,
				fullName: notification.fullName,
			})
		);
	}
}

//endregion
