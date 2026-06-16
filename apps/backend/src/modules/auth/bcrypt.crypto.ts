import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CryptoProvider } from '@sdd/auth';

const SALT_ROUNDS = 10;

@Injectable()
export class BcryptCryptoProvider implements CryptoProvider {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
