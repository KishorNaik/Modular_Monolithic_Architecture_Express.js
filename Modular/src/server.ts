import { App } from '@/app';
import { ValidateEnv } from '@/shared/utils/validateEnv';
import { userModules } from '@/modules/users';
import { organizationModules } from './modules/organization';

ValidateEnv();

const app = new App([...userModules, ...organizationModules]);
app.listen();
