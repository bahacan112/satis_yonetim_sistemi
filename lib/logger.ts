interface LogData {
  [key: string]: any;
}

class Logger {
  private formatMessage(
    level: string,
    message: string,
    data?: LogData
  ): string {
    const timestamp = new Date().toISOString();
    const logData = data ? ` ${JSON.stringify(data)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${logData}`;
  }

  info(message: string, data?: LogData): void {
    console.log(this.formatMessage("info", message, data));
  }

  warn(message: string, data?: LogData): void {
    console.warn(this.formatMessage("warn", message, data));
  }

  error(message: string, data?: LogData): void {
    console.error(this.formatMessage("error", message, data));
  }

  debug(message: string, data?: LogData): void {
    console.debug(this.formatMessage("debug", message, data));
  }
}

// Create logger instances
export const supabaseLogger = new Logger();
export const securityLogger = new Logger();
export const authLogger = new Logger();
export const apiLogger = new Logger();

// Default export
export default new Logger();
