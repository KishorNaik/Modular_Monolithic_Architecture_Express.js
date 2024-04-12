import { authenticateJwt } from '@/middlewares/auth.middleware';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import { GetUsersFilterRequestDTO, GetUsersFilterResponseDTO } from '@/modules/users/contracts/features/getUsersFilter.Contracts';
import mediatR from '@/shared/medaitR/mediatR';
import { DataResponse, DataResponseFactory, PaginationDataResponseModel } from '@/shared/models/response/data.Response';
import { Response } from 'express';
import { request } from 'http';
import { StatusCodes } from 'http-status-codes';
import { IRequest, IRequestHandler, requestHandler } from 'mediatr-ts';
import { Get, HttpCode, JsonController, OnUndefined, QueryParam, QueryParams, Res, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import Container from 'typedi';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import UserDataSource from '../../../infrastructure/user.DataStore';
import { HttpException, QueryException } from '@/shared/utils/httpException';
import { IUserSharedRepository, UserSharedRepository } from '../../../shared/repository/user.repository';
import { UserEntity } from '../../../infrastructure/Entity/user.Entity';
import { Err, Ok, Result } from 'neverthrow';
import Enumerable from 'linq';
import { PagedList } from '@/shared/utils/pageList';

// region Controller Service
@JsonController('/api/v1/users')
@OpenAPI({ tags: ['users'] })
export class GetUsersController {
  @Get()
  @HttpCode(StatusCodes.OK)
  @OnUndefined(StatusCodes.BAD_REQUEST)
  @OpenAPI({ summary: 'Return a users', tags: ['users'], security: [{ BearerAuth: [] }] })
  @UseBefore(ValidationMiddleware(GetUsersFilterRequestDTO), authenticateJwt)
  public async getUserAsync(@QueryParams() getUsersFilterRequestDTO: GetUsersFilterRequestDTO, @Res() res: Response) {
    const response = await mediatR.send<DataResponse<GetUsersFilterResponseDTO>>(new GetUserQuery(getUsersFilterRequestDTO));

    return res.status(response.StatusCode).json(response);
  }
}
//endregion

// region Query Service

class GetUserQuery implements IRequest<DataResponse<GetUsersFilterResponseDTO[]>> {
  public constructor(request: GetUsersFilterRequestDTO) {
    this._request = request;
  }

  private _request: GetUsersFilterRequestDTO;
  public get request(): GetUsersFilterRequestDTO {
    return this._request;
  }
}

@requestHandler(GetUserQuery)
class GetUserQueryHandler implements IRequestHandler<GetUserQuery, DataResponse<GetUsersFilterResponseDTO[]>> {
  private readonly userSharedRepository: IUserSharedRepository;

  public constructor() {
    this.userSharedRepository = Container.get(UserSharedRepository);
  }

  private fullNameFilter(
    fullName: string,
    selectQueryBuilder: SelectQueryBuilder<UserEntity>,
  ): Result<SelectQueryBuilder<UserEntity>, HttpException> {
    try {
      if (fullName !== undefined) {
        return new Ok(selectQueryBuilder.where('fullName like :fullName', { fullName: `%${fullName}%` }));
      }

      return new Ok(selectQueryBuilder);
    } catch (ex) {
      return new Err(new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, ex.message));
    }
  }

  private emailIdFilter(emailId: string, selectQueryBuilder: SelectQueryBuilder<UserEntity>): Result<SelectQueryBuilder<UserEntity>, HttpException> {
    try {
      if (emailId !== undefined) {
        return new Ok(selectQueryBuilder.where('emailId like :emailId', { emailId: `%${emailId}%` }));
      }

      return new Ok(selectQueryBuilder);
    } catch (ex) {
      return new Err(new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, ex.message));
    }
  }

  private toListAsync(selectQueryBuilder: SelectQueryBuilder<UserEntity>): Promise<Array<UserEntity>> {
    return selectQueryBuilder.getMany();
  }

  private map(users: Array<UserEntity>): GetUsersFilterResponseDTO[] {
    return Enumerable.from(users)
      .select<GetUsersFilterResponseDTO>(x => ({
        id: x.id,
        email: x.emailId,
        fullName: x.fullName,
      }))
      .toArray();
  }

  private response(users: GetUsersFilterResponseDTO[], pageList: PagedList<UserEntity>): DataResponse<GetUsersFilterResponseDTO[]> {
    if (users.length === 0) return DataResponseFactory.Response<GetUsersFilterResponseDTO[]>(false, StatusCodes.NOT_FOUND, users, 'Users not found');

    const paginationModel = new PaginationDataResponseModel();
    paginationModel.totalCount = pageList.totalCount;
    paginationModel.pageSize = pageList.pageSize;
    paginationModel.totalPages = pageList.totalPages;
    paginationModel.hasPrevious = pageList.hasPrevious;
    paginationModel.hasNext = pageList.hasNext;
    paginationModel.currentPage = pageList.currentPage;

    return DataResponseFactory.Response<GetUsersFilterResponseDTO[]>(true, StatusCodes.OK, users, 'Users found successfully', paginationModel);
  }

  public async handle(value: GetUserQuery): Promise<DataResponse<GetUsersFilterResponseDTO[]>> {
    try {
      if (!value) return QueryException.queryError('request is empty', StatusCodes.BAD_REQUEST);

      let selectQueryBuilderResult = this.userSharedRepository.getUsers();
      if (selectQueryBuilderResult.isErr())
        return QueryException.queryError(selectQueryBuilderResult.error.message, selectQueryBuilderResult.error.status);

      let selectQueryBuilder = selectQueryBuilderResult.value;

      // Filter full Name
      selectQueryBuilderResult = this.fullNameFilter(value.request.fullName, selectQueryBuilder);
      if (selectQueryBuilderResult.isErr())
        return QueryException.queryError(selectQueryBuilderResult.error.message, selectQueryBuilderResult.error.status);

      selectQueryBuilder = selectQueryBuilderResult.value;

      // Filter emailId
      selectQueryBuilderResult = this.emailIdFilter(value.request.emailId, selectQueryBuilder);
      if (selectQueryBuilderResult.isErr())
        return QueryException.queryError(selectQueryBuilderResult.error.message, selectQueryBuilderResult.error.status);

      selectQueryBuilder = selectQueryBuilderResult.value;

      // Filter with Pagination
      const pageList = await PagedList.toPagedListAsync(selectQueryBuilder, value.request.pageNumber, value.request.pageSize);

      // To List
      const users: Array<UserEntity> = await this.toListAsync(pageList.selectQueryBuilder);

      // map
      const mapUsers = this.map(users);

      // Response
      return this.response(mapUsers, pageList);
    } catch (ex) {
      return QueryException.queryError(ex.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}
// endregion
