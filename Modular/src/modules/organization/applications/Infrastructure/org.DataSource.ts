import { DB_DATABASE, DB_HOST, DB_PASSWORD, DB_PORT, DB_USERNAME } from '@/config';
import { DataSource } from 'typeorm';
import { OrgEntity } from './Entity/org.Entity';

//console.log(`DB_HOST: ${DB_HOST} - DB_PORT: ${DB_PORT} - DB_USERNAME: ${DB_USERNAME} - DB_PASSWORD: ${DB_PASSWORD} - DB_DATABASE: ${DB_DATABASE}`);

const OrgDataSource = new DataSource({
	type: 'mysql',
	host: DB_HOST,
	port: parseInt(DB_PORT),
	username: DB_USERNAME,
	password: DB_PASSWORD,
	database: DB_DATABASE,
	synchronize: true,
	logging: true,
	entities: [OrgEntity],
	subscribers: [],
	migrations: [],
});

OrgDataSource.initialize();

export default OrgDataSource;
