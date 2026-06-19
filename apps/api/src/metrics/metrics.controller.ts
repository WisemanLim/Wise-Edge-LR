import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { UsageService } from './usage.service';
import { CLOUD_PRICING } from './tokens';

interface BaselineDto {
  monthlyUsd: number;
  model?: string;
  note?: string;
  capexUsd?: number;
}

@Controller('metrics')
export class MetricsController {
  constructor(private readonly usage: UsageService) {}

  // 누적 토큰 사용량 + 상용 대비 절감 (PRD P1-4)
  @Get('cost')
  cost(@Query('model') model?: string) {
    return this.usage.report(model ?? 'gpt-4o');
  }

  // 지원 상용 단가표
  @Get('pricing')
  pricing() {
    return CLOUD_PRICING;
  }

  // 도입 전 상용 월청구 baseline 설정(실측 입력)
  @Post('baseline')
  setBaseline(@Body() body: BaselineDto) {
    this.usage.setBaseline(
      { monthlyUsd: body.monthlyUsd, model: body.model, note: body.note },
      body.capexUsd ?? 0,
    );
    return this.usage.baselineSummary();
  }

  // baseline 대비 로컬 운영비 절감 환산
  @Get('baseline')
  baseline() {
    return this.usage.baselineSummary();
  }
}
