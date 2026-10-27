import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8000', 10),
  appUrl: process.env.APP_URL || 'http://127.0.0.1:8000',
  jwtSecret: process.env.JWT_SECRET || 'Masyithoh_Vault_LakaLaka_HMM99',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'masyithoh_tegal__Forge_Session_Core_V1',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  secureStreamSecret: process.env.SECURE_STREAM_SECRET || 'Bahari_Gatekeeper_Stream_028',
  secureStreamExpiryMinutes: parseInt(process.env.SECURE_STREAM_EXPIRY_MINUTES || '15', 10),
  storageDriver: process.env.STORAGE_DRIVER || 'local',
  storageLocalDocuments: process.env.STORAGE_LOCAL_DOCUMENTS || './storage/documents',
  storagePrivateDocuments: process.env.STORAGE_PRIVATE_DOCUMENTS || './storage/private',
}));
