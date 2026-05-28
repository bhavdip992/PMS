import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // For GCM, 12 bytes is standard

const getEncryptionKey = () => {
  const hexKey = process.env.VAULT_ENCRYPTION_KEY;
  if (!hexKey) {
    throw new Error('VAULT_ENCRYPTION_KEY environment variable is not defined.');
  }
  return Buffer.from(hexKey, 'hex');
};

export const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag().toString('hex');
  
  // Format: iv:encryptedData:tag
  return `${iv.toString('hex')}:${encrypted}:${tag}`;
};

export const decrypt = (encryptedString) => {
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format. Expected iv:encryptedData:tag');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = Buffer.from(parts[1], 'hex');
  const tag = Buffer.from(parts[2], 'hex');
  
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  const decBuf = decipher.update(encryptedText); let decrypted = decBuf.toString("utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
};
