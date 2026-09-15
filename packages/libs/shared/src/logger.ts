class Logger {
  public writeLog(entry: RequestErrorLogEntry): void {
    process.stdout.write(JSON.stringify(entry) + "\n");
  }
}

let _logger: Logger;
export function logger(): Logger {
  if (!_logger) {
    _logger = new Logger();
  }
  return _logger;
}

interface RequestErrorLogEntry {
  level: "error";
  requestId: string;
  method: string;
  url: string;
  status: number;
  error: string;
  reason?: string;
  message: string;
}
