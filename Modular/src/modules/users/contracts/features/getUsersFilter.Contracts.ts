import { PaginationQueryStringParametersModel } from '@/shared/models/request/paginationQueryString.request';
import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';

// region Request
export interface IGetUsersFilterRequestDTO {
	fullName?: string;
	emailId?: string;
}

export class GetUsersFilterRequestDTO
	extends PaginationQueryStringParametersModel
	implements IGetUsersFilterRequestDTO
{
	@IsOptional()
	@Type(() => String)
	public fullName?: string;

	@IsOptional()
	@Type(() => String)
	public emailId?: string;
}
// endregion

// region Response
export class GetUsersFilterResponseDTO {
	id: number;
	fullName: string;
	email: string;
}
// endregion
