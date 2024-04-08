import { DataResponse, DataResponseFactory } from "@/shared/models/response/data.Response";
import { IRequest, IRequestHandler, requestHandler } from "mediatr-ts";
import { Get, HttpCode, JsonController, OnUndefined, Param, Res } from "routing-controllers";
import { OpenAPI } from "routing-controllers-openapi";
import Container from "typedi";
import { DataSource } from "typeorm";
import { IOrgSharedRepository, OrgSharedRepository } from "../../../shared/repository/org.repository";
import { QueryException } from "@/shared/utils/httpException";
import { StatusCodes } from "http-status-codes";
import { OrgEntity } from "../../../Infrastructure/Entity/org.Entity";
import { Response, query } from "express";
import mediatR from "@/shared/medaitR/mediatR";
import { GetOrgByIdRequestDTO, GetOrgByIdResponseDTO } from "@/modules/organization/contracts/features/getOrgById.Contracts";

@JsonController("/v1/organizations")
@OpenAPI({tags:["organizations"]})
export class GetOrgByIdController{

    @Get('/:id')
    @HttpCode(StatusCodes.OK)
    @OnUndefined(StatusCodes.BAD_REQUEST)
    @OpenAPI({ summary: 'Return find a org', tags: ['organizations'] })
    public async getUserByIdAsync( @Param('id') userId: number,@Res() res: Response) {
      const request = new GetOrgByIdRequestDTO();
      request.id = userId;
    
      const response=await mediatR.send<DataResponse<GetOrgByIdResponseDTO>>(new GetOrgByIdQuery(request));
      return res.status(response.StatusCode).json(response);
    }
}

// region Query Service

class GetOrgByIdQuery implements IRequest<DataResponse<GetOrgByIdResponseDTO>>{
    
    constructor(request: GetOrgByIdRequestDTO) {
        this._request = request;
      }
    
      private _request: GetOrgByIdRequestDTO;
      public get request(): GetOrgByIdRequestDTO {
        return this._request;
      }
}

@requestHandler(GetOrgByIdQuery)
class GetOrgByIdQeryHandler implements IRequestHandler<GetOrgByIdQuery, DataResponse<GetOrgByIdResponseDTO>>{
    
    private readonly orgSharedRepository:IOrgSharedRepository;

    constructor() {
        this.orgSharedRepository = Container.get(OrgSharedRepository);
    }

    private map(orgEntity:OrgEntity):GetOrgByIdResponseDTO{
        const orgResponseDTO:GetOrgByIdResponseDTO=new GetOrgByIdResponseDTO();
        orgResponseDTO.id=orgEntity.id;
        orgResponseDTO.name=orgEntity.name;
        orgResponseDTO.location=orgEntity.location;
        
        return orgResponseDTO;
    }

    private response(getOrgByIdResponseDTO:GetOrgByIdResponseDTO):DataResponse<GetOrgByIdResponseDTO>{
        return DataResponseFactory.Response<GetOrgByIdResponseDTO>(true, StatusCodes.OK, getOrgByIdResponseDTO,"Org found successfully");
    }

    public async handle(value: GetOrgByIdQuery): Promise<DataResponse<GetOrgByIdResponseDTO>> {
       try
       {
            // check argument is empty or not
           if(!value)
            return QueryException.queryError("Invalid request", StatusCodes.BAD_REQUEST);
           
           // get org By Id
           var getOrgByIdResult=await this.orgSharedRepository.getOrgByIdAsync(value.request.id);

           if(getOrgByIdResult.isErr())
            return QueryException.queryError(getOrgByIdResult.error.message, getOrgByIdResult.error.status);

           const orgEntity:OrgEntity=getOrgByIdResult.value;

           // map
           const getOrgByIdResponse: GetOrgByIdResponseDTO=this.map(orgEntity);

           // response
           return this.response(getOrgByIdResponse);
       }
       catch(ex){
            return QueryException.queryError(ex.message,StatusCodes.INTERNAL_SERVER_ERROR);
       }
    }

}

// endregion

// region Integration Service
export class GetOrgByIdIntegrationService implements IRequest<DataResponse<GetOrgByIdResponseDTO>>{

    constructor(id:number){
        this._id=id;
    }

    private _id:number;
    public get id(): number {
        return this._id;
    }
}

@requestHandler(GetOrgByIdIntegrationService)
export class GetOrgByIdIntegrationServiceHandler implements IRequestHandler<GetOrgByIdIntegrationService, DataResponse<GetOrgByIdResponseDTO>>{
    
    public async handle(value: GetOrgByIdIntegrationService): Promise<DataResponse<GetOrgByIdResponseDTO>> {
        const request = new GetOrgByIdRequestDTO();
        request.id = value.id;
      
        const response=await mediatR.send<DataResponse<GetOrgByIdResponseDTO>>(new GetOrgByIdQuery(request));

        return response;
    }

}

//endregion 