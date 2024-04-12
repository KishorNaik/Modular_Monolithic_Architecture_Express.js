import { saltRounds } from '@/shared/models/constant/constantValue';
import { HttpException } from '@/shared/utils/httpException';
import * as bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { Err, Ok, Result } from 'neverthrow';
import { Service } from 'typedi';

export interface IHashPasswordService {
  hashPasswordAsync(password: string): Promise<Result<string, HttpException>>;
  comparePasswordAsync(password: string, hashedPassword: string): Promise<Result<boolean, HttpException>>;
}

@Service()
export class HashPasswordService implements IHashPasswordService {
  public async hashPasswordAsync(password: string): Promise<Result<string, HttpException>> {
    try {
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      if (!hashedPassword) return new Err(new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'Error while hashing password'));

      return new Ok(hashedPassword); // hashedPassword;
    } catch (ex) {
      return new Err(new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, ex.message));
    }
  }

  public async comparePasswordAsync(password: string, hashedPassword: string): Promise<Result<boolean, HttpException>> {
    try {
      const match = await bcrypt.compare(password, hashedPassword);

      if (!match) return new Err(new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'Error while comparing password'));

      return new Ok(match); // match;
    } catch (ex) {
      return new Err(new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, ex.message));
    }
  }
}
