import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name:"orgentity"})
export class OrgEntity{

    @PrimaryGeneratedColumn()
    id:number;

    @Column("varchar",{length:100})
    name:string;

    @Column("varchar",{length:100})
    location:string;
}