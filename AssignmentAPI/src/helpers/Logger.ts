import * as winston from 'winston';

export class Logger {
  private static instance: winston.Logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.simple()
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
    ],
  });

  static info(message: string, meta?: any) {
    this.instance.info(message, meta);
  }

  static error(message: string, meta?: any) {
    this.instance.error(message, meta);
  }

  static warn(message: string, meta?: any) {
    this.instance.warn(message, meta);
  }

  static debug(message: string, meta?: any) {
    this.instance.debug(message, meta);
  }

  static trace(message: string, meta?: any) {
    this.instance.verbose(message, meta);
  }
}
