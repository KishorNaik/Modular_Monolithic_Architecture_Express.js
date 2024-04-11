import { StatusEnum } from "@/shared/models/enums/status.enum";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name:"userentity"})
export class UserEntity{

    @PrimaryGeneratedColumn()
    id:number;

    @Column("varchar",{length:100})
    fullName:string;

    @Column("varchar",{length:100})
    emailId:string;

    @Column("varchar",{length:100})
    password:string;

    @Column("int")
    orgId:number;

    @Column("longtext",{nullable:true})
    refreshToken:string;

    @Column("enum",{enum:StatusEnum, default:StatusEnum.INACTIVE})
    status: StatusEnum
}