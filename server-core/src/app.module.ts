import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app.config';
import { microservicesConfig } from './config/microservices.config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { RedisModule } from './modules/redis/redis.module';
import { AuditTrailModule } from './modules/audit-trail/audit-trail.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SecurityWhitelistModule } from './modules/security-whitelist/security-whitelist.module';
import { SchoolsModule } from './modules/schools/schools.module';
import { FoundationModule } from './modules/foundation/foundation.module';
import { ClassesModule } from './modules/academics/classes/classes.module';
import { AttendanceModule } from './modules/academics/attendance/attendance.module';
import { AssessmentsModule } from './modules/academics/assessments/assessments.module';
import { AnecdotesModule } from './modules/academics/anecdotes/anecdotes.module';
import { ReportsModule } from './modules/academics/reports/reports.module';
import { PpdbModule } from './modules/ppdb/ppdb.module';
import { SecureDocumentsModule } from './modules/secure-documents/secure-documents.module';
import { SystemBackupModule } from './modules/system-backup/system-backup.module';
import { AiIntegrationModule } from './modules/ai-integration/ai-integration.module';
import { WaDistributionModule } from './modules/wa-distribution/wa-distribution.module';
import { AswajaModule } from './modules/academics/aswaja/aswaja.module';
import { ActivityPhotosModule } from './modules/academics/activity-photos/activity-photos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, microservicesConfig],
    }),
    PrismaModule,
    RedisModule,
    AuditTrailModule,
    AuthModule,
    UsersModule,
    SecurityWhitelistModule,
    SchoolsModule,
    FoundationModule,
    ClassesModule,
    AttendanceModule,
    AssessmentsModule,
    AnecdotesModule,
    ReportsModule,
    PpdbModule,
    SecureDocumentsModule,
    SystemBackupModule,
    AiIntegrationModule,
    WaDistributionModule,
    AswajaModule,
    ActivityPhotosModule,
  ],
})
export class AppModule {}
