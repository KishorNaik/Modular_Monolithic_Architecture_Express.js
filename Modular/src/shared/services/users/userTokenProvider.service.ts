import { Request } from 'express';
import { Service } from 'typedi';
import jwt from 'jsonwebtoken';
import { IClaims } from '../../../modules/users/applications/shared/services/jwt.service';
import { HttpException } from '@/shared/utils/httpException';
import { Result } from 'neverthrow';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { SECRET_KEY } from '@/config';

export interface IUserTokenProviderService {
  getUserId(request: Request): string;
  getUserRole(request: Request): string;
}

@Service()
export class UserTokenProviderService implements IUserTokenProviderService {
  public getUserId(request: Request): string {
    const decoded: IClaims = jwt.verify(request.headers.authorization.split(' ')[1], SECRET_KEY) as IClaims;
    return decoded.id;
  }

  public getUserRole(request: Request): string {
    const decoded: IClaims = jwt.verify(request.headers.authorization.split(' ')[1], SECRET_KEY) as IClaims;
    return decoded.role;
  }
}
