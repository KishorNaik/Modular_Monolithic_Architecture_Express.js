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
}