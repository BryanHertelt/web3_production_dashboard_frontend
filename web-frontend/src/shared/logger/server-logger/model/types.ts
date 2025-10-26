export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
export type LogFields = Record<string, unknown>;

export interface ServerLogger {
  debug(msg: string, fields?: LogFields, sampleRate?: number): Promise<void>;
  info(msg: string, fields?: LogFields, sampleRate?: number): Promise<void>;
  warn(msg: string, fields?: LogFields, sampleRate?: number): Promise<void>;
  error(msg: string, fields?: LogFields, sampleRate?: number): Promise<void>;
  fatal(msg: string, fields?: LogFields, sampleRate?: number): Promise<void>;
}

export type Redactable = unknown;

export type NormalizedError = {
  message: string;
  status?: number;
  code?: string;
  method?: string;
  url?: string;
  name: string;
  stack?: string;
  cause?: string;
};
