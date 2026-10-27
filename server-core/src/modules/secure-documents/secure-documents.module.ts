import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SecureDocumentsService } from './secure-documents.service';
import { SecureDocumentsController } from './secure-documents.controller';

@Module({
  imports: [ConfigModule],
  controllers: [SecureDocumentsController],
  providers: [SecureDocumentsService],
  exports: [SecureDocumentsService],
})
export class SecureDocumentsModule {}
