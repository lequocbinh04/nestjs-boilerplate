import { Module } from '@nestjs/common';
import { EMAIL_SERVICE } from './email.di-token';
import { ResendEmailService } from './email.service';

@Module({
  providers: [
    {
      provide: EMAIL_SERVICE,
      useClass: ResendEmailService,
    },
  ],
  exports: [EMAIL_SERVICE],
})
export class EmailModule {}
