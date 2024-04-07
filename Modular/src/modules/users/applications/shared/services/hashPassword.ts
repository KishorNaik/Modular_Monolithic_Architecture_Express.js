import { saltRounds } from '@/shared/models/constant/constantValue';
import * as bcrypt from 'bcrypt';
import { Service } from 'typedi';

export interface IHashPasswordService{
    hashPasswordAsync(password: string): Promise<string>;
    comparePasswordAsync(password: string, hashedPassword: string): Promise<boolean>
}

@Service()
export class HashPasswordService implements IHashPasswordService{
    public async hashPasswordAsync(password: string): Promise<string> {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    }

    public async comparePasswordAsync(password: string, hashedPassword: string): Promise<boolean> {
        const match = await bcrypt.compare(password, hashedPassword);
        return match;
    }

}