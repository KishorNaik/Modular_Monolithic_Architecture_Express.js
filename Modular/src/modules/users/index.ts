import { CreateUserController } from "./applications/features/v1/activity/createUser.Activity";
import { GetUserByIdController } from "./applications/features/v1/activity/getUserById.Activity";

// Module Registration
export const userModules:Function[]=[CreateUserController,GetUserByIdController];