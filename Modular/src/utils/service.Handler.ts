export interface IServiceHandlerAsync<TParams, TResults> {
	handleAsync(params: TParams): Promise<TResults>;
}

export interface IServiceHandler<TParams, TResults> {
	handle(params: TParams): TResults;
}
