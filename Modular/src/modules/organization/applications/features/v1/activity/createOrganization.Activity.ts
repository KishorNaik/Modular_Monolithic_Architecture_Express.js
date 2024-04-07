import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import { CreateOrganizationRequestDTO, CreateOrganizationResponseDTO } from '@/modules/organization/contracts/features/organizzation.contract';
import mediatR from '@/shared/medaitR/mediatR';
import { DataResponse, DataResponseFactory } from '@/shared/models/response/data.Response';
import { Response } from 'express';
import { Guid } from 'guid-typescript';
import { StatusCodes } from 'http-status-codes';
import { INotification, IRequest, IRequestHandler, requestHandler } from 'mediatr-ts';
import 'reflect-metadata';
import { Body, HttpCode, JsonController, OnUndefined, Post, Res, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

// region Controller Service

@JsonController("/v1/organizations")
@OpenAPI({tags:["organizations"]})
export class CreateOrganizationController{

    @Post()
    @OpenAPI({ summary: 'Create a new organization', tags: ['organizations']})
    @HttpCode(StatusCodes.CREATED)
    @OnUndefined(StatusCodes.BAD_REQUEST)
    @UseBefore(ValidationMiddleware(CreateOrganizationRequestDTO))
    public async createOrganizationAsync(@Body() createOrganizationRequestDTO:CreateOrganizationRequestDTO,@Res() res: Response) {
        var response=await mediatR.send<DataResponse<CreateOrganizationResponseDTO>>(new CreateOrganizationCommand(createOrganizationRequestDTO));
        return res.status(response.StatusCode).json(response);
    }
}

// endregion

// region Command Service

class CreateOrganizationCommand implements IRequest<DataResponse<CreateOrganizationResponseDTO>>{

    constructor(createOrganizationRequestDTO:CreateOrganizationRequestDTO) {
        this._createOrganizationRequestDTO = createOrganizationRequestDTO
    }

    private _createOrganizationRequestDTO: CreateOrganizationRequestDTO;
    public get createOrganizationRequestDTO(): CreateOrganizationRequestDTO {
        return this._createOrganizationRequestDTO;
    }
}

@requestHandler(CreateOrganizationCommand)
class CreateOrganizationCommandHandler implements IRequestHandler<CreateOrganizationCommand,DataResponse<CreateOrganizationResponseDTO>>{
    
    public async  handle(value: CreateOrganizationCommand): Promise<DataResponse<CreateOrganizationResponseDTO>> {
       
        // Business Logic Here
        const createOrganizationResponseDTO = new CreateOrganizationResponseDTO();
        createOrganizationResponseDTO.id =Guid.create().toString();
       
        return DataResponseFactory.Response(true,StatusCodes.CREATED,createOrganizationResponseDTO,'Organization created successfully');
    }
}


// endregion
