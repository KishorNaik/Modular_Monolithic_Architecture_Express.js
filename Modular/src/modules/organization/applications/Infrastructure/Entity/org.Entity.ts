import { StatusEnum } from "@/shared/models/enums/status.enum";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name:"orgentity"})
export class OrgEntity{

    @PrimaryGeneratedColumn()
    id:number;

    @Column("varchar",{length:100})
    name:string;

    @Column("varchar",{length:100})
    location:string;

    @Column("enum",{enum:StatusEnum, default:StatusEnum.INACTIVE})
    status: StatusEnum
}