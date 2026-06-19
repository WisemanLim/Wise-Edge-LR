import { Module } from '@nestjs/common';
import { UsageService } from './usage.service';
import { MetricsController } from './metrics.controller';

@Module({
  controllers: [MetricsController],
  providers: [UsageService],
  exports: [UsageService],
})
export class MetricsModule {}
