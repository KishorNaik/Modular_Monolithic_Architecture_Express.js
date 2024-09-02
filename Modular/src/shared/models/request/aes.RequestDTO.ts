import { Type } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class AESRequestDTO {
	@IsNotEmpty()
	@IsString()
	@Type(() => String)
	body?: string;
}
