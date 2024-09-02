import { Exclude, Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// #region Request
export interface IUpdateUserRequestDTO {
	id?: number;
	fullName?: string;
	email?: string;
}

export class UpdateUserRequestDTO implements IUpdateUserRequestDTO {
	@IsNotEmpty()
	@IsString()
	@Type(() => String)
	fullName?: string;

	@IsEmail()
	@Type(() => String)
	email?: string;

	@Exclude()
	id?: number;
}
// #endregion

// #region Response
export class UpdateUserResponseDTO {
	updateDateTime: Date;
}
// #endregion
