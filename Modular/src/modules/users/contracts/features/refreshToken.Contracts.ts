import { IsNotEmpty, IsString } from 'class-validator';
import { IJwtTokenDTO } from '../shared/jwtToken.dto';
import { Type } from 'class-transformer';

// region Request
export interface IRefreshTokenRequestDTO {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenRequestDTO implements IRefreshTokenRequestDTO {
  @IsNotEmpty()
  @IsString()
  @Type(() => String)
  public accessToken: string;

  @IsNotEmpty()
  @IsString()
  @Type(() => String)
  public refreshToken: string;
}
// endregion

// region Response

export class RefreshTokenResponseDTO implements IJwtTokenDTO {
  public accessToken: string;
  public refreshToken: string;
}

// endregion
