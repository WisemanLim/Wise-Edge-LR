import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(@Query('limit') limit?: string) {
    const n = limit ? Number(limit) : 50;
    return { total: this.audit.size(), entries: this.audit.list(n) };
  }

  // 해시체인 무결성 검증(변조 탐지)
  @Get('verify')
  verify() {
    return this.audit.verify();
  }
}
