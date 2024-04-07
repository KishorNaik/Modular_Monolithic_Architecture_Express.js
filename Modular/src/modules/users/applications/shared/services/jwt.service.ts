import { jwtSecret } from '@/shared/models/constant/constantValue';
import jwt from 'jsonwebtoken';
import { Service } from 'typedi';

interface IClaims{
    id: string;
    role?:string;
}


export interface IJwtService{
    generateTokenAsync(claims: IClaims): Promise<string>;
    generateRefreshTokenAsync(claims: IClaims): Promise<string>;
}

@Service()
export class JwtService implements IJwtService{
   
    public generateTokenAsync(claims:IClaims): Promise<string> {
        return new Promise((resolve, reject) => {
            try
            {
                const token:string = jwt.sign(claims, jwtSecret, { expiresIn: '1h', algorithm: 'HS256' });
                resolve(token);
            }
            catch(ex){
                reject(ex);
            }
        });
    }

    public generateRefreshTokenAsync(claims: IClaims): Promise<string> {
        return new Promise((resolve, reject) => {
            try
            {
                const token:string = jwt.sign(claims, jwtSecret, { expiresIn: '7d', algorithm: 'HS256' });
                resolve(token);
            }
            catch(ex){
                reject(ex);
            }
        });
    }

}