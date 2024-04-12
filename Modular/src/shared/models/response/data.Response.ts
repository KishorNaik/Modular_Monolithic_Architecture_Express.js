import { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } from 'http-status-codes';

export class PaginationDataResponseModel {
  public currentPage: number;
  public totalPages: number;
  public pageSize: number;
  public totalCount: number;

  public hasPrevious: boolean;
  public hasNext: boolean;
}

export class DataResponse<TData> {
  Success?: boolean;
  StatusCode?: StatusCodes;
  Data?: TData;
  Message?: string;
  Pagination?: PaginationDataResponseModel;
}

export class DataResponseFactory {
  static Response<TData>(
    success?: boolean,
    statusCode?: StatusCodes,
    data?: TData,
    message?: string,
    pagination?: PaginationDataResponseModel,
  ): DataResponse<TData> {
    return { Success: success, StatusCode: statusCode, Data: data, Message: message, Pagination: pagination };
  }
}
