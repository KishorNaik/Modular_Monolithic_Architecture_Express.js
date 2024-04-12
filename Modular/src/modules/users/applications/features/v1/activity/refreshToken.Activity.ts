import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import {
  JwtTokenResponseDTO,
  UserLoginRequestDTO,
  UserLoginResponseDTO,
  UserResponseDTO,
} from '@/modules/users/contracts/features/userLogin.Contracts';
import mediatR from '@/shared/medaitR/mediatR';
import { DataResponse, DataResponseFactory } from '@/shared/models/response/data.Response';
import { CommandException, HttpException } from '@/shared/utils/httpException';
import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { IRequest, IRequestHandler, requestHandler } from 'mediatr-ts';
import { Body, HttpCode, JsonController, OnUndefined, Post, Res, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IUserSharedRepository, UserSharedRepository } from '../../../shared/repository/user.repository';
import Container from 'typedi';
import { HashPasswordService, IHashPasswordService } from '../../../shared/services/hashPassword.service.';
import { IClaims, IJwtExtendedService, IJwtService, JwtExtendedService, JwtService, tokenTuples } from '../../../shared/services/jwt.service';
import { Err, Ok, Result } from 'neverthrow';
import { UserEntity } from '../../../infrastructure/Entity/user.Entity';
import { RefreshTokenRequestDTO, RefreshTokenResponseDTO } from '@/modules/users/contracts/features/refreshToken.Contracts';

// #region Controller Service
@JsonController('/api/v1/users')
@OpenAPI({ tags: ['users'] })
export class RefreshTokenController {
  @Post('/refreshToken')
  @OpenAPI({ summary: 'Refresh Token', tags: ['users'] })
  @HttpCode(StatusCodes.OK)
  @OnUndefined(StatusCodes.BAD_REQUEST)
  @UseBefore(ValidationMiddleware(RefreshTokenRequestDTO))
  public async refreshTokenAsync(@Body() refreshTokenRequestDTO: RefreshTokenRequestDTO, @Res() res: Response) {
    const response = await mediatR.send<DataResponse<RefreshTokenResponseDTO>>(new RefreshTokenCommand(refreshTokenRequestDTO));
    return res.status(response.StatusCode).json(response);
  }
}
// #endregion

// region Command Service
class RefreshTokenCommand implements IRequest<DataResponse<RefreshTokenResponseDTO>> {
  constructor(refreshTokenRequestDTO: RefreshTokenRequestDTO) {
    this._request = refreshTokenRequestDTO;
  }

  private _request: RefreshTokenRequestDTO;
  public get request(): RefreshTokenRequestDTO {
    return this._request;
  }
}

@requestHandler(RefreshTokenCommand)
class RefreshTokenCommandHandler implements IRequestHandler<RefreshTokenCommand, DataResponse<RefreshTokenResponseDTO>> {
  private readonly jwtTokenService: IJwtService;
  private readonly userSharedRepository: IUserSharedRepository;
  private readonly jwtExtendedService: IJwtExtendedService;

  public constructor() {
    this.jwtTokenService = Container.get(JwtService);
    this.userSharedRepository = Container.get(UserSharedRepository);
    this.jwtExtendedService = Container.get(JwtExtendedService);
  }

  private async validateTokenAsync(refreshTokenRequestDTO: RefreshTokenRequestDTO): Promise<Result<string, HttpException>> {
    const getClaimsFromRefreshTokenPromise: Promise<IClaims> = this.jwtTokenService.getClaimsFromRefreshTokenAsync(
      refreshTokenRequestDTO.refreshToken,
    );
    const getClaimsFromAccessTokenPromise: Promise<IClaims> = this.jwtTokenService.getClaimsFromAccessTokenAsync(refreshTokenRequestDTO.accessToken);

    const [getClaimsFromRefreshTokenResult, getClaimsFromAccessTokenResult] = await Promise.all([
      getClaimsFromRefreshTokenPromise,
      getClaimsFromAccessTokenPromise,
    ]);

    if (!getClaimsFromAccessTokenResult) return new Err(new HttpException(StatusCodes.UNAUTHORIZED, 'Invalid Access Token'));

    if (!getClaimsFromRefreshTokenResult) return new Err(new HttpException(StatusCodes.UNAUTHORIZED, 'Invalid Refresh Token'));

    if (getClaimsFromAccessTokenResult.id !== getClaimsFromRefreshTokenResult.id)
      return new Err(new HttpException(StatusCodes.UNAUTHORIZED, 'Invalid Token'));

    return new Ok(getClaimsFromRefreshTokenResult.id);
  }

  private verifyRefreshToken(refreshToken: string, refreshTokenDB: string): Result<boolean, HttpException> {
    if (refreshToken != refreshTokenDB) return new Err(new HttpException(StatusCodes.UNAUTHORIZED, 'Invalid Refresh Token'));

    return new Ok(true);
  }

  private response(tokensValue: tokenTuples): DataResponse<RefreshTokenResponseDTO> {
    const refreshTokenResponseDTO: RefreshTokenResponseDTO = new RefreshTokenResponseDTO();
    refreshTokenResponseDTO.accessToken = tokensValue[0];
    refreshTokenResponseDTO.refreshToken = tokensValue[1];

    return DataResponseFactory.Response(true, StatusCodes.OK, refreshTokenResponseDTO, 'Refresh Token successfully');
  }

  public async handle(value: RefreshTokenCommand): Promise<DataResponse<RefreshTokenResponseDTO>> {
    try {
      // argument is empty or not
      if (!value) return CommandException.commandError('Invalid Request', StatusCodes.BAD_REQUEST);

      // Get Claims from the refresh Token
      const getUserIdResult = await this.validateTokenAsync(value.request);

      if (getUserIdResult.isErr()) return CommandException.commandError(getUserIdResult.error.message, getUserIdResult.error.status);

      // Get User By Id
      const getUserByIdResult = await this.userSharedRepository.getUserByIdAsync(parseInt(getUserIdResult.value));

      if (getUserByIdResult.isErr()) return CommandException.commandError('Invalid User', StatusCodes.UNAUTHORIZED);

      const userEntity: UserEntity = getUserByIdResult.value;

      // Verify Refresh Token
      const verifyRefreshTokenResult = this.verifyRefreshToken(value.request.refreshToken, userEntity.refreshToken);
      if (verifyRefreshTokenResult.isErr())
        return CommandException.commandError(verifyRefreshTokenResult.error.message, verifyRefreshTokenResult.error.status);

      // Generate Access Token
      const generateJwtTokenResult = await this.jwtExtendedService.generateJwtTokenAsync({
        id: userEntity.id.toString(),
      });

      if (generateJwtTokenResult.isErr())
        return CommandException.commandError(generateJwtTokenResult.error.message, generateJwtTokenResult.error.status);

      const tokensValue: tokenTuples = generateJwtTokenResult.value;

      // Update Refresh Token
      const updateRefreshTokenResult = await this.userSharedRepository.updateRefreshTokenAsync(userEntity.id, tokensValue[1]);

      if (updateRefreshTokenResult.isErr())
        return CommandException.commandError(updateRefreshTokenResult.error.message, updateRefreshTokenResult.error.status);

      // Response
      return this.response(tokensValue);
    } catch (ex) {
      const error: Error = <Error>ex;
      return CommandException.commandError(error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}
// endregion
