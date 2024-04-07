import 'reflect-metadata';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { Body, HttpCode, JsonController, OnUndefined, Post, Res, UseBefore } from 'routing-controllers';
import { CreateUserRequestDTO, CreateUserResponseDTO, ICreateUserRequestDTO } from '@/modules/users/contracts/features/createUser.Contract';
import { Response } from 'express';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import { INotification, INotificationHandler, IRequest, IRequestHandler, notificationHandler, requestHandler } from 'mediatr-ts';
import { DataResponse, DataResponseFactory } from '@/shared/models/response/data.Response';
import { Guid } from 'guid-typescript';
import { StatusCodes } from 'http-status-codes';
import mediatR from '@/shared/medaitR/mediatR';
import { Job } from '@/shared/utils/job';
import { delay } from '@/shared/utils/delay';
import { WelcomeEmailIntegrationEvent } from '@/modules/notification/applications/features/v1/activity/welcomeEmail.activity';
import { HashPasswordService, IHashPasswordService } from '../../../shared/services/hashPassword';
import Container from 'typedi';


// #region Controller Service
@JsonController("/v1/users")
@OpenAPI({tags:["users"]})
export class CreateUserController{

    @Post()
    @OpenAPI({ summary: 'Create a new user', tags: ['users']})
    @HttpCode(StatusCodes.CREATED)
    @OnUndefined(StatusCodes.BAD_REQUEST)
    @UseBefore(ValidationMiddleware(CreateUserRequestDTO))
    public async addUserAsync(@Body() createUserRequestDTO:CreateUserRequestDTO,@Res() res: Response) {

        let response=await mediatR.send<DataResponse<CreateUserResponseDTO>>(new CreateUserCommand(createUserRequestDTO));
        return res.status(response.StatusCode).json(response);
    }
}

// #endregion

// #region Command Service

class CreateUserCommand implements IRequest<DataResponse<CreateUserResponseDTO>>{

    constructor(createUserRequestDTO:CreateUserRequestDTO) {
        this._createUserRequestDTO = createUserRequestDTO
    }

    private _createUserRequestDTO: CreateUserRequestDTO;
    public get createUserRequestDTO(): CreateUserRequestDTO {
        return this._createUserRequestDTO;
    }
}

@requestHandler(CreateUserCommand)
class CreateUserCommandHandler implements IRequestHandler<CreateUserCommand,DataResponse<CreateUserResponseDTO>>{
    
    private readonly hashPasswordService:IHashPasswordService;

    constructor() {
        this.hashPasswordService = Container.get(HashPasswordService);
    }

    public async  handle(value: CreateUserCommand): Promise<DataResponse<CreateUserResponseDTO>> {
       
        // Business Logic Here
        const createUserResponseDTO = new CreateUserResponseDTO();
        createUserResponseDTO.id =Guid.create().toString();

        // Generate Hash Password.
        let hashedPassword =await this.hashPasswordService.hashPasswordAsync(value.createUserRequestDTO.password);
        console.log(`Hash Password : ${hashedPassword}`);
       
        // Call Domain Event
        Job(()=> mediatR.publish(new UserCreatedDomainEvent(createUserResponseDTO.id,value.createUserRequestDTO.fullName,value.createUserRequestDTO.email)));

        return DataResponseFactory.Response(true,StatusCodes.CREATED,createUserResponseDTO,'User created successfully');
    }

}

// #endregion

// region Domain Event Handler

class UserCreatedDomainEvent implements INotification{

    
    constructor(id:string,fullName:string,emailId:string) {
        this._id = id;
        this._fullName = fullName;
        this._emailId = emailId;
    }

    private _id: string;
    public get id(): string {
        return this._id;
    }

    private _fullName:string;
    public get fullName(): string {
        return this._fullName;
    }

    private _emailId:string;
    public get emailId(): string {
        return this._emailId;
    }
}

@notificationHandler(UserCreatedDomainEvent)
class UserCreatedDomainEventHandler implements INotificationHandler<UserCreatedDomainEvent>{
    public async handle(notification: UserCreatedDomainEvent): Promise<void> {
        await delay(10000);
        console.log(`User with id ${notification.id} has been created`);

        // Cache Event
        // ....Pending

        // Send Welcome Event
        await mediatR.publish(new WelcomeEmailIntegrationEvent({
            emailId:notification.emailId,
            fullName:notification.fullName
        }));
    }

}

//endregion