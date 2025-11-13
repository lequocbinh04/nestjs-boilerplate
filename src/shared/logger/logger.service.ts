import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private context?: string;

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, context?: string) {
    const ctx = context || this.context;
    console.log(this.formatMessage('LOG', message, ctx));
  }

  error(message: string, trace?: string, context?: string) {
    const ctx = context || this.context;
    console.error(this.formatMessage('ERROR', message, ctx));
    if (trace) {
      console.error(trace);
    }
  }

  warn(message: string, context?: string) {
    const ctx = context || this.context;
    console.warn(this.formatMessage('WARN', message, ctx));
  }

  debug(message: string, context?: string) {
    const ctx = context || this.context;
    console.debug(this.formatMessage('DEBUG', message, ctx));
  }

  verbose(message: string, context?: string) {
    const ctx = context || this.context;
    console.log(this.formatMessage('VERBOSE', message, ctx));
  }

  private formatMessage(level: string, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const ctx = context ? `[${context}]` : '';
    return `${timestamp} [${level}] ${ctx} ${message}`;
  }
}
