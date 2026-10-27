import { Module } from '@nestjs/common';
import { SecurityWhitelistService } from './security-whitelist.service';
import { SecurityWhitelistController } from './security-whitelist.controller';

@Module({
  controllers: [SecurityWhitelistController],
  providers: [SecurityWhitelistService],
  exports: [SecurityWhitelistService],
})
export class SecurityWhitelistModule {}
