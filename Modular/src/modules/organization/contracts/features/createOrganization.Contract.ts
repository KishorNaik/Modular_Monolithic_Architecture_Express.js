import { Type } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

// #region Request
export interface ICreateOrganizationRequestDTO {
	name?: string;
	location?: string;
}

export class CreateOrganizationRequestDTO implements ICreateOrganizationRequestDTO {
	@IsNotEmpty()
	@IsString()
	@Type(() => String)
	name?: string;

	@IsNotEmpty()
	@IsString()
	@Type(() => String)
	location?: string;
}
//endregion

// #region Response
export interface ICreateOrganizationResponseDTO {
	id: number;
}

export class CreateOrganizationResponseDTO implements ICreateOrganizationResponseDTO {
	id: number;
}
