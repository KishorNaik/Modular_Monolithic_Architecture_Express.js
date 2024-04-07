import { HttpError } from 'routing-controllers';
import { DataResponse, DataResponseFactory } from '../models/response/data.Response';
import { StatusCodes } from 'http-status-codes';

export class HttpException extends HttpError {
  public status: number;
  public message: string;

  constructor(status: number, message: string) {
    super(status, message);
    this.status = status;
    this.message = message;
  }
}

export class QueryException {

  public static queryError<TResult>(errorMessage:string, statusCode: StatusCodes): DataResponse<TResult>{
      return DataResponseFactory.Response<TResult>(false, statusCode, undefined, errorMessage);
  }
      
}

export class CommandException {

  public static commandError<TResult>(errorMessage:string, statusCode: StatusCodes): DataResponse<TResult>{
      return DataResponseFactory.Response<TResult>(false, statusCode, undefined, errorMessage);
  }
      
}