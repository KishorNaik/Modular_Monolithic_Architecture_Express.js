import { DataSource, QueryRunner, SelectQueryBuilder } from 'typeorm';
import UserDataSource from '../../infrastructure/user.DataStore';
import { UserEntity } from '../../infrastructure/Entity/user.Entity';
import { Service } from 'typedi';
import { Err, Ok, Result } from 'neverthrow';
import { HttpException } from '@/shared/utils/httpException';
import { StatusCodes } from 'http-status-codes';

export interface IUserSharedRepository {
  getUserByEmailAsync(email: string, queryRunner?: QueryRunner): Promise<Result<UserEntity, HttpException>>;
  getUserByIdAsync(id: number, queryRunner?: QueryRunner): Promise<Result<UserEntity, HttpException>>;
  getUserWithPasswordByEmailAsync(email: string, queryRunner?: QueryRunner): Promise<Result<UserEntity, HttpException>>;
  updateRefreshTokenAsync(id: number, refreshToken: string, queryRunner?: QueryRunner): Promise<Result<boolean, HttpException>>;
  getUsers(queryRunner?: QueryRunner): Result<SelectQueryBuilder<UserEntity>, HttpException>;
}

@Service()
export class UserSharedRepository implements IUserSharedRepository {
  private readonly appDataSource: DataSource = null;

  constructor() {
    this.appDataSource = UserDataSource;
  }

  public async getUserByEmailAsync(email: string, queryRunner?: QueryRunner): Promise<Result<UserEntity, HttpException>> {
    try {
      const result = await this.appDataSource
        .createQueryBuilder(queryRunner)
        .select('u')
        .addSelect('u.id')
        .addSelect('u.emailId')
        .addSelect('u.fullName')
        .addSelect('u.orgId')
        .from(UserEntity, 'u')
        .where('u.emailId = :email', { email: email })
        .getRawOne<UserEntity>();

      if (!result) return new Err(new HttpException(StatusCodes.NOT_FOUND, 'User not found'));

      return new Ok(result);
    } catch (ex) {
      return new Err(new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, ex.message));
    }
  }
  public async getUserByIdAsync(id: number, queryRunner?: QueryRunner): Promise<Result<UserEntity, HttpException>> {
    try {
      const result = await this.appDataSource
        .createQueryBuilder(queryRunner)
        .select('u')
        .addSelect('u.id')
        .addSelect('u.emailId')
        .addSelect('u.fullName')
        .addSelect('u.orgId')
        .addSelect('u.refreshToken')
        .from(UserEntity, 'u')
        .where('u.id = :id', { id: id })
        .getRawOne<UserEntity>();

      if (!result) return new Err(new HttpException(StatusCodes.NOT_FOUND, 'User not found'));

      return new Ok(result);
    } catch (ex) {
      return new Err(new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, ex.message));
    }
  }

  public async getUserWithPasswordByEmailAsync(email: string, queryRunner?: QueryRunner): Promise<Result<UserEntity, HttpException>> {
    try {
      const result = await this.appDataSource
        .createQueryBuilder(queryRunner)
        .select('u')
        .addSelect('u.id')
        .addSelect('u.emailId')
        .addSelect('u.fullName')
        .addSelect('u.orgId')
        .addSelect('u.password')
        .from(UserEntity, 'u')
        .where('u.emailId = :email', { email: email })
        .getRawOne<UserEntity>();

      if (!result) return new Err(new HttpException(StatusCodes.NOT_FOUND, 'User not found'));

      return new Ok(result);
    } catch (ex) {
      return new Err(new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, ex.message));
    }
  }

  public async updateRefreshTokenAsync(id: number, refreshToken: string, queryRunner?: QueryRunner): Promise<Result<boolean, HttpException>> {
    try {
      if (!id) return new Err(new HttpException(StatusCodes.BAD_REQUEST, 'id is null'));

      if (!refreshToken) return new Err(new HttpException(StatusCodes.BAD_REQUEST, 'refreshToken is null'));

      const result = await this.appDataSource
        .createQueryBuilder(queryRunner)
        .update(UserEntity)
        .set({ refreshToken: refreshToken })
        .where('id = :id', { id: id })
        .execute();

      if (!result.affected) return new Err(new HttpException(StatusCodes.NOT_FOUND, 'User not found'));

      return new Ok(true);
    } catch (ex) {
      return new Err(new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, ex.message));
    }
  }

  public getUsers(queryRunner?: QueryRunner): Result<SelectQueryBuilder<UserEntity>, HttpException> {
    try {
      const result = this.appDataSource
        .createQueryBuilder(queryRunner)
        .select('u')
        .addSelect('u.id')
        .addSelect('u.emailId')
        .addSelect('u.fullName')
        .addSelect('u.orgId')
        .from(UserEntity, 'u');

      if (!result) return new Err(new HttpException(StatusCodes.NOT_FOUND, 'User not found'));

      return new Ok(result);
    } catch (ex) {
      return new Err(new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, ex.message));
    }
  }
}
