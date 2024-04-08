import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, IsNumber } from 'class-validator';
import { Guid } from 'guid-typescript';

// #region Request
export interface ICreateUserRequestDTO{
    fullName? : string;
    email?:string;
    password?:string;
    orgId?:number;
}

export class CreateUserRequestDTO implements ICreateUserRequestDTO{
    @IsNotEmpty()
    @IsString()
    fullName? : string;
    
    @IsEmail()
    email?:string;

    @IsString()
    @IsNotEmpty()
    @MinLength(9)
    @MaxLength(32)
    password?:string;

    @IsNotEmpty()
    @IsNumber()
    orgId?:number;
}

// #endregion

// #region Response
export class CreateUserResponseDTO {
   id:number;
}

// #endregion