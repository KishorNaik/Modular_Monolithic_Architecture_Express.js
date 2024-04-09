import { CreateUserController } from "./applications/features/v1/activity/createUser.Activity";
import { GetUserByIdController } from "./applications/features/v1/activity/getUserById.Activity";
import { RefreshTokenController } from "./applications/features/v1/activity/refreshToken.Activity";
import { UserLoginController } from "./applications/features/v1/activity/userLogin.Activity";

// Module Registration
export const userModules:Function[]=[CreateUserController,GetUserByIdController, UserLoginController, RefreshTokenController];