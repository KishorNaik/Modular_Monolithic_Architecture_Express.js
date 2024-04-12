import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { IJwtTokenDTO } from '../shared/jwtToken.dto';
import { Type } from 'class-transformer';

// region Request
export interface IUserLoginRequestDTO {
  emailId: string;
  password: string;
}

export class UserLoginRequestDTO implements IUserLoginRequestDTO {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @Type(() => String)
  public emailId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(9)
  @MaxLength(32)
  @Type(() => String)
  public password: string;
}
// endregion

// region Response
export class JwtTokenResponseDTO implements IJwtTokenDTO {
  public accessToken: string;
  public refreshToken: string;
}

export class UserResponseDTO {
  public id: number;
  public fullName: string;
  public emailId: string;
}

export class UserLoginResponseDTO {
  user: UserResponseDTO;
  jwt: JwtTokenResponseDTO;
}
// endregion
