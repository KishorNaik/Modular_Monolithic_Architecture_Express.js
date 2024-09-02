import { validateOrReject, ValidationError } from 'class-validator';
import { StatusCodes } from 'http-status-codes';
import { Err, Ok, Result } from 'neverthrow';
import { HttpException } from './httpException';
import { plainToInstance } from 'class-transformer';

// export async function validateOrRejectAsync<TDto>(input:TDto) : Promise<Result<unknown,HttpException>> {
//     try {
//       await validateOrReject(input as object, { skipMissingProperties: true });

//       return new Ok("ok");
//     } catch (errors) {
//         const errorsArray = errors as ValidationError[];
//         const message = errorsArray.map((error: ValidationError) => Object.values(error.constraints!)).join(', ');
//         return new Err(new HttpException(StatusCodes.BAD_REQUEST,message));
//     }
// }

export async function validateOrRejectAsync<TDto>(
	input: object,
	dtoClass: new () => TDto
): Promise<Result<unknown, HttpException>> {
	try {
		// Convert plain object to class instance
		const instance = plainToInstance(dtoClass, input);

		// Validate the instance
		await validateOrReject(instance as object, { skipMissingProperties: true });

		return new Ok('ok');
	} catch (errors) {
		const errorsArray = errors as ValidationError[];
		const message = errorsArray
			.map((error: ValidationError) => Object.values(error.constraints!).join(', '))
			.join(', ');
		return new Err(new HttpException(StatusCodes.BAD_REQUEST, message));
	}
}
