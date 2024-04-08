import { DB_DATABASE, DB_HOST, DB_PASSWORD, DB_PORT, DB_USERNAME } from "@/config";
import {DataSource} from "typeorm";
import { UserEntity } from "./Entity/user.Entity";

//console.log(`DB_HOST: ${DB_HOST} - DB_PORT: ${DB_PORT} - DB_USERNAME: ${DB_USERNAME} - DB_PASSWORD: ${DB_PASSWORD} - DB_DATABASE: ${DB_DATABASE}`);

const UserDataSource = new DataSource({
  type: 'mysql',
  host: DB_HOST,
  port: parseInt(DB_PORT),
  username: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  synchronize: true,
  logging: true,
  entities: [UserEntity],
  subscribers: [],
  migrations: [],
});

UserDataSource.initialize();

export default UserDataSource;