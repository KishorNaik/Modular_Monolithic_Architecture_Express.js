import { IsNumber, IsOptional } from "class-validator";

export class PaginationQueryStringParametersModel {
    private static readonly maxPageSize = 50;

    @IsNumber()
    public pageNumber: number = 1;
    private _pageSize: number = 10;

    @IsNumber()
    public get pageSize(): number {
        return this._pageSize;
    }

    public set pageSize(value: number) {
        this._pageSize = (value > PaginationQueryStringParametersModel.maxPageSize) ? PaginationQueryStringParametersModel.maxPageSize : value;
    }
}