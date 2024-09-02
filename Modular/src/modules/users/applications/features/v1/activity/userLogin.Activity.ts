import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import {
	JwtTokenResponseDTO,
	UserLoginRequestDTO,
	UserLoginResponseDTO,
	UserResponseDTO,
} from '@/modules/users/contracts/features/userLogin.Contracts';
import mediatR from '@/shared/medaitR/index';
import { DataResponse, DataResponseFactory } from '@/shared/models/response/data.Response';
import { CommandException, HttpException } from '@/shared/utils/httpException';
import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { IRequest, IRequestHandler, requestHandler } from 'mediatr-ts';
import {
	Body,
	HttpCode,
	JsonController,
	OnUndefined,
	Post,
	Res,
	UseBefore,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import {
	IUserSharedRepository,
	UserSharedRepository,
} from '../../../shared/repository/user.repository';
import Container from 'typedi';
import {
	HashPasswordService,
	IHashPasswordService,
} from '../../../shared/services/hashPassword.service.';
import {
	IJwtExtendedService,
	IJwtService,
	JwtExtendedService,
	JwtService,
	tokenTuples,
} from '../../../shared/services/jwt.service';
import { Err, Ok, Result } from 'neverthrow';
import { UserEntity } from '../../../infrastructure/Entity/user.Entity';

// #region Controller Service
@JsonController('/api/v1/users')
@OpenAPI({ tags: ['users'] })
export class UserLoginController {
	@Post('/login')
	@OpenAPI({ summary: 'User Login', tags: ['users'] })
	@HttpCode(StatusCodes.OK)
	@OnUndefined(StatusCodes.BAD_REQUEST)
	@UseBefore(ValidationMiddleware(UserLoginRequestDTO))
	public async loginAsync(
		@Body() userLoginRequestDTO: UserLoginRequestDTO,
		@Res() res: Response
	) {
		const response = await mediatR.send<DataResponse<UserLoginResponseDTO>>(
			new UserLoginCommand(userLoginRequestDTO)
		);
		return res.status(response.StatusCode).json(response);
	}
}
//endregion

// region Command Service
class UserLoginCommand implements IRequest<DataResponse<UserLoginResponseDTO>> {
	constructor(userLoginRequestDTO: UserLoginRequestDTO) {
		this._request = userLoginRequestDTO;
	}

	private _request: UserLoginRequestDTO;
	public get request(): UserLoginRequestDTO {
		return this._request;
	}
}

@requestHandler(UserLoginCommand)
export class UserLoginCommandHandler
	implements IRequestHandler<UserLoginCommand, DataResponse<UserLoginResponseDTO>>
{
	private readonly userSharedRepository: IUserSharedRepository;
	private readonly hashPasswordService: IHashPasswordService;
	private readonly jwtExtendedService: IJwtExtendedService;

	constructor() {
		this.userSharedRepository = Container.get(UserSharedRepository);
		this.hashPasswordService = Container.get(HashPasswordService);
		this.jwtExtendedService = Container.get(JwtExtendedService);
	}

	private response(
		userEntity: UserEntity,
		tokenTuples: tokenTuples
	): DataResponse<UserLoginResponseDTO> {
		const userLoginResponseDTO: UserLoginResponseDTO = new UserLoginResponseDTO();

		userLoginResponseDTO.user = new UserResponseDTO();
		userLoginResponseDTO.user.id = userEntity.id;
		userLoginResponseDTO.user.emailId = userEntity.emailId;
		userLoginResponseDTO.user.fullName = userEntity.fullName;

		userLoginResponseDTO.jwt = new JwtTokenResponseDTO();
		userLoginResponseDTO.jwt.accessToken = tokenTuples[0];
		userLoginResponseDTO.jwt.refreshToken = tokenTuples[1];

		return DataResponseFactory.Response<UserLoginResponseDTO>(
			true,
			StatusCodes.OK,
			userLoginResponseDTO,
			'User login successfully'
		);
	}

	public async handle(value: UserLoginCommand): Promise<DataResponse<UserLoginResponseDTO>> {
		try {
			// Check argument
			if (!value)
				return CommandException.commandError(
					'UserLoginCommand is required',
					StatusCodes.BAD_REQUEST
				);

			// Get User By Email Id
			const getUserByEmailIdResult =
				await this.userSharedRepository.getUserWithPasswordByEmailAsync(
					value.request.emailId
				);

			if (getUserByEmailIdResult.isErr())
				return CommandException.commandError(
					getUserByEmailIdResult.error.message,
					getUserByEmailIdResult.error.status
				);

			// Get User Entity
			const userEntity: UserEntity = getUserByEmailIdResult.value;

			// Validate Password
			const isValidPasswordResult = await this.hashPasswordService.comparePasswordAsync(
				value.request.password,
				userEntity.password
			);

			if (isValidPasswordResult.isErr())
				return CommandException.commandError(
					'Invalid User Name & Password',
					StatusCodes.FORBIDDEN
				);

			// Get JWT Tokens
			const generateJwtTokenResult = await this.jwtExtendedService.generateJwtTokenAsync({
				id: userEntity.id.toString(),
			});

			if (generateJwtTokenResult.isErr())
				return CommandException.commandError(
					generateJwtTokenResult.error.message,
					generateJwtTokenResult.error.status
				);

			const tokensValue: tokenTuples = generateJwtTokenResult.value;

			// Update Refresh Token
			const updateRefreshTokenResult =
				await this.userSharedRepository.updateRefreshTokenAsync(
					userEntity.id,
					tokensValue[1]
				);

			if (updateRefreshTokenResult.isErr())
				return CommandException.commandError(
					updateRefreshTokenResult.error.message,
					updateRefreshTokenResult.error.status
				);

			// Response
			return this.response(userEntity, tokensValue);
		} catch (ex) {
			return CommandException.commandError(ex.message, StatusCodes.INTERNAL_SERVER_ERROR);
		}
	}
}
// endregion
