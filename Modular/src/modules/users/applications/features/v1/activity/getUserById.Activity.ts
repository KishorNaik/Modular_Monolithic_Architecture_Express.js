import 'reflect-metadata';
import { OpenAPI } from 'routing-controllers-openapi';
import { Body, Get, HttpCode, JsonController, OnUndefined, Param, Post, Res } from 'routing-controllers';
import { CreateUserRequestDTO } from '@/modules/users/contracts/features/createUser.Contract';
import { Response } from 'express';
import { HttpException } from '@/shared/utils/httpException';
import { StatusCodes } from 'http-status-codes';


@JsonController("/v1/users")
@OpenAPI({tags:["users"]})
export class GetUserByIdController{

    @Get('/:id')
    @HttpCode(StatusCodes.CREATED)
    @OnUndefined(StatusCodes.BAD_REQUEST)
    @OpenAPI({ summary: 'Return find a user', tags: ['users'] })
    public getUserByIdAsync( @Param('id') userId: number,@Res() res: Response) {
       return res.status(401).json({
            id:userId
        })
    }
}