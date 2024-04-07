import {
	ReasonPhrases,
	StatusCodes,
	getReasonPhrase,
	getStatusCode,
} from 'http-status-codes';

export class DataResponse<TData> {
    Success?: boolean;
    StatusCode?: StatusCodes;
    Data?: TData;
    Message?: string;
}

export class DataResponseFactory {
    static Response<TData>(success?: boolean, statusCode?: StatusCodes, data?: TData, message?: string): DataResponse<TData> {
        return { Success: success, StatusCode: statusCode, Data: data, Message: message };
    }
}