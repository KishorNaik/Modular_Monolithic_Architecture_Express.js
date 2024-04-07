import { expressjwt} from "express-jwt";
import { jwtSecret } from '@/shared/models/constant/constantValue';
import { DataResponseFactory } from "@/shared/models/response/data.Response";

export const authenticateJwt = expressjwt({ secret: jwtSecret, algorithms: ['HS256'] });

export function authorizeRole(role: string) {
    return function (req: any, res: any, next: any) {
        if (req.user.role !== role) {
            var response=DataResponseFactory.Response<undefined>(false, 403, undefined, 'Forbidden - You do not have permission to access this resource');
            return res.status(403).json(response);
        }
        next();
    }
}