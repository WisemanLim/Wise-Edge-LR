import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { LlmModule } from './llm/llm.module';
import { RagModule } from './rag/rag.module';
import { MetricsModule } from './metrics/metrics.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [LlmModule, RagModule, MetricsModule, AuditModule, AuthModule],
  controllers: [AppController],
})
export class AppModule {}
