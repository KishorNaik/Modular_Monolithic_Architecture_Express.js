import { ENCRYPTION_KEY } from '@/config';
import { ivLength } from '../shared/models/constant';
import crypto from 'crypto';

class AES {
	private _ivLength: number = ivLength;

	public encryptAsync(data: string): Promise<string> {
		return new Promise((resolve, reject) => {
			try {
				let iv = crypto.randomBytes(this._ivLength);
				let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
				let encrypted = cipher.update(data);

				encrypted = Buffer.concat([encrypted, cipher.final()]);

				return resolve(`${iv.toString('hex')}:${encrypted.toString('hex')}`);
			} catch (e) {
				reject(e);
			}
		});
	}

	public decryptAsync(data: string): Promise<string> {
		return new Promise((resolve, reject) => {
			try {
				let textParts = data.split(':');
				let iv = Buffer.from(textParts.shift(), 'hex');
				let encryptedText = Buffer.from(textParts.join(':'), 'hex');
				let decipher = crypto.createDecipheriv(
					'aes-256-cbc',
					Buffer.from(ENCRYPTION_KEY),
					iv
				);
				let decrypted = decipher.update(encryptedText);

				decrypted = Buffer.concat([decrypted, decipher.final()]);

				return resolve(decrypted.toString());
			} catch (e) {
				reject(e);
			}
		});
	}
}

const aes = new AES();
export { aes };
