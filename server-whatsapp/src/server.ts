import 'dotenv/config';
import app from './app';
import { config } from './config/app.config';
import { SessionManager } from './modules/session/session.manager';
import * as fs from 'fs';

// Ensure required directories exist
const dirs = [config.session.storagePath, './storage/temp'];
dirs.forEach(d => fs.mkdirSync(d, { recursive: true }));

async function bootstrap(): Promise<void> {
  // Restore previously connected sessions on boot
  await SessionManager.restorePersistedSessions();

  app.listen(config.port, '127.0.0.1', () => {
    console.log('=======================================================');
    console.log('📱 E-Rapor WA Gateway Server Running');
    console.log(`🌐 Local URL: http://127.0.0.1:${config.port}`);
    console.log(`🔐 API Key Protection: Active`);
    console.log(`🛡️  IP Whitelist: ${config.security.allowedOriginIps.join(', ')}`);
    console.log(`📦 Environment: ${config.env}`);
    console.log('=======================================================');
  });
}

bootstrap().catch(err => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
