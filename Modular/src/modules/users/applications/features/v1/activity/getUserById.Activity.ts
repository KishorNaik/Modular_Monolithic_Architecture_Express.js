import 'reflect-metadata';
import { OpenAPI } from 'routing-controllers-openapi';
import { Body, Get, HttpCode, JsonController, OnUndefined, Param, Post, Res } from 'routing-controllers';
import { Response } from 'express';
import { HttpException, QueryException } from '@/shared/utils/httpException';
import { StatusCodes } from 'http-status-codes';
import { IRequest, IRequestHandler, requestHandler } from 'mediatr-ts';
import { DataResponse, DataResponseFactory } from '@/shared/models/response/data.Response';
import { GetUserByIdRequestDTO, GetUserByIdResponseDTO } from '@/modules/users/contracts/features/getUserById.Contracts';
import { IUserSharedRepository, UserSharedRepository } from '../../../shared/repository/user.repository';
import Container from 'typedi';
import { UserEntity } from '../../../infrastructure/Entity/user.Entity';
import mediatR from '@/shared/medaitR/mediatR';

// #region Controller
@JsonController("/v1/users")
@OpenAPI({tags:["users"]})
export class GetUserByIdController{

    @Get('/:id')
    @HttpCode(StatusCodes.CREATED)
    @OnUndefined(StatusCodes.BAD_REQUEST)
    @OpenAPI({ summary: 'Return find a user', tags: ['users'] })
    public async getUserByIdAsync( @Param('id') userId: number,@Res() res: Response) {
      const request = new GetUserByIdRequestDTO();
      request.id = userId;
    
      const response=await mediatR.send<DataResponse<GetUserByIdResponseDTO>>(new GetUserByIdQuery(request));
      return res.status(response.StatusCode).json(response);
    }
}
// #endregion


// #region Query Handler
class GetUserByIdQuery implements IRequest<DataResponse<GetUserByIdResponseDTO>>{

  constructor(request: GetUserByIdRequestDTO) {
    this._request = request;
  }

  private _request: GetUserByIdRequestDTO;
  public get request(): GetUserByIdRequestDTO {
    return this._request;
  }
}

@requestHandler(GetUserByIdQuery)
class GetUserByIdQueryHandler implements IRequestHandler<GetUserByIdQuery, DataResponse<GetUserByIdResponseDTO>> {

    private readonly userSharedRepository: IUserSharedRepository;

    constructor() {
        this.userSharedRepository = Container.get(UserSharedRepository);
    }

    private map(userEntity:UserEntity):GetUserByIdResponseDTO{
        const getUserByIdResponseDTO=new GetUserByIdResponseDTO();
        getUserByIdResponseDTO.id=userEntity.id;
        getUserByIdResponseDTO.fullName=userEntity.fullName;
        getUserByIdResponseDTO.email=userEntity.emailId;
        return getUserByIdResponseDTO;
    }

    private response(getUserByIdResponseDTO:GetUserByIdResponseDTO):DataResponse<GetUserByIdResponseDTO>{
        return DataResponseFactory.Response<GetUserByIdResponseDTO>(true, StatusCodes.OK, getUserByIdResponseDTO,"User found successfully");
    }

    public async handle(value: GetUserByIdQuery): Promise<DataResponse<GetUserByIdResponseDTO>> {
       try
       {
           // check argument is empty or not
           if(!value)
            return QueryException.queryError("Invalid request", StatusCodes.BAD_REQUEST);
           
           // get user by id
           var getUserByIdResult=await this.userSharedRepository.getUserByIdAsync(value.request.id);

           if(getUserByIdResult.isErr())
            return QueryException.queryError(getUserByIdResult.error.message, getUserByIdResult.error.status);

           const userEntity:UserEntity=getUserByIdResult.value;

           // Map
           const getUserByIdResponseDTO=this.map(userEntity);

           // Response
           return this.response(getUserByIdResponseDTO);
       }
       catch(ex){
            return QueryException.queryError(ex.message, StatusCodes.INTERNAL_SERVER_ERROR);
       }
    }

}
//endregion 