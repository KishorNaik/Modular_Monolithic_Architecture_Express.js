import { DataSource, QueryRunner } from "typeorm";
import UserDataSource  from "../../infrastructure/user.DataStore";
import { UserEntity } from "../../infrastructure/Entity/user.Entity";
import { Service } from "typedi";
import { Err, Ok, Result } from "neverthrow";
import { HttpException } from "@/shared/utils/httpException";
import { StatusCodes } from "http-status-codes";

export interface IUserSharedRepository{
    getUserByEmailAsync(email:string, queryRunner?:QueryRunner):Promise<Result<UserEntity,HttpException>>;
    getUserByIdAsync(id:number, queryRunner?:QueryRunner):Promise<Result<UserEntity,HttpException>>;
}

@Service()
export class UserSharedRepository implements IUserSharedRepository{

    private readonly appDataSource:DataSource = null;

    constructor(){
        this.appDataSource=UserDataSource;
    }

    public async getUserByEmailAsync(email: string, queryRunner?: QueryRunner): Promise<Result<UserEntity,HttpException>> {
        try
        {
            var result=await this.appDataSource.createQueryBuilder(queryRunner)
                            .select("u")
                            .addSelect("u.id")
                            .addSelect("u.emailId")
                            .addSelect("u.fullName")
                            .addSelect("u.orgId")
                            .from(UserEntity, "u")
                            .where("u.emailId = :email", { email: email })
                            .getRawOne<UserEntity>();

            if(!result)
                return new Err(new HttpException(StatusCodes.NOT_FOUND,"User not found"));

            return new Ok(result);
        }
        catch(ex){
            return new Err(new HttpException(StatusCodes.INTERNAL_SERVER_ERROR,ex.message));
        }
        
    }
    public async getUserByIdAsync(id: number,queryRunner?: QueryRunner): Promise<Result<UserEntity,HttpException>> {

        try
        {
            var result=await this.appDataSource.createQueryBuilder(queryRunner)
                        .select("u")
                        .addSelect("u.id")
                        .addSelect("u.emailId")
                        .addSelect("u.fullName")
                        .addSelect("u.orgId")
                        .from(UserEntity, "u")
                        .where("u.id = :id", { id: id })
                        .getRawOne<UserEntity>();

            if(!result)
                return new Err(new HttpException(StatusCodes.NOT_FOUND,"User not found"));

            return new Ok(result);
        }
        catch(ex){
            return new Err(new HttpException(StatusCodes.INTERNAL_SERVER_ERROR,ex.message));
        }
        
    }

}