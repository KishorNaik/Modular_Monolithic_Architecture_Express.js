import { HttpException } from '@/shared/utils/httpException';
import { Err, Ok, Result } from 'neverthrow';
import { OrgEntity } from '../../Infrastructure/Entity/org.Entity';
import { Service } from 'typedi';
import { DataSource, QueryRunner } from 'typeorm';
import { StatusCodes } from 'http-status-codes';
import OrgDataSource from '../../Infrastructure/org.DataSource';
import { StatusEnum } from '@/shared/models/enums/status.enum';

export interface IOrgSharedRepository {
  getOrgByIdAsync(id: number, queryRunner?: QueryRunner): Promise<Result<OrgEntity, HttpException>>;
}

@Service()
export class OrgSharedRepository implements IOrgSharedRepository {
  private readonly appDataSource: DataSource = null;

  constructor() {
    this.appDataSource = OrgDataSource;
  }
  public async getOrgByIdAsync(id: number, queryRunner?: QueryRunner): Promise<Result<OrgEntity, HttpException>> {
    try {
      if (!id) return new Err(new HttpException(StatusCodes.BAD_REQUEST, 'id is required'));

      const result = await this.appDataSource
        .createQueryBuilder(queryRunner)
        .select('o')
        .addSelect('o.id')
        .addSelect('o.name')
        .addSelect('o.location')
        .from(OrgEntity, 'o')
        .where('o.id = :id', { id: id })
        //.andWhere('o.status = :status', { status: StatusEnum.ACTIVE })
        .getRawOne<OrgEntity>();

      if (!result) return new Err(new HttpException(StatusCodes.NOT_FOUND, 'org not found'));

      return new Ok(result);
    } catch (ex) {
      return new Err(new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, ex.message));
    }
  }
}
