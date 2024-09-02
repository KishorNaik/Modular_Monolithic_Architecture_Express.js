import { Type } from 'class-transformer';
import {
	IsEmail,
	IsString,
	IsNotEmpty,
	MinLength,
	MaxLength,
	IsNumber,
	IsPositive,
} from 'class-validator';
import { Guid } from 'guid-typescript';

// #region Request
export interface ICreateUserRequestDTO {
	fullName?: string;
	email?: string;
	password?: string;
	orgId?: number;
}

export class CreateUserRequestDTO implements ICreateUserRequestDTO {
	@IsNotEmpty()
	@IsString()
	@Type(() => String)
	fullName?: string;

	@IsEmail()
	@Type(() => String)
	email?: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(9)
	@MaxLength(32)
	@Type(() => String)
	password?: string;

	@IsNumber()
	@IsPositive()
	@Type(() => Number)
	orgId?: number;
}

// #endregion

// #region Response
export class CreateUserResponseDTO {
	id: number;
}

// #endregion
