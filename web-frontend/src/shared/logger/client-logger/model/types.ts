import type { Logger } from "pino";

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export type LogFields = Record<string, unknown>;

export interface UserContext {
  user_id: string;
  session_id: string;
}

export interface LogPayload {
  level: string;
  time: string;
  msg: string;
  request_id: string;
  operation_name?: string;
  attempt_num: number;
  user_id: string;
  session_id: string;
  user_agent: string;
  page_url?: string;
  page_title?: string;
  referrer?: string;
  sample_rate?: number;
  navigation_timing?: {
    page_load_time: number;
  };
  [key: string]: unknown;
}

export interface ClientLogger extends Logger {
  withSampleRate(sampleRate: number, context?: LogFields): ClientLogger;
  startOperation(operationName: string, context?: LogFields): ClientLogger & { endOperation: () => void };
}

export type Redactable = unknown;

export interface LogConfig {
  LEVELS: {
    DEBUG: number;
    INFO: number;
    WARN: number;
    ERROR: number;
    FATAL: number;
  };
  MAX_RETRIES: number;
  RETRY_DELAY: number;
  SAMPLE_RATE: number;
}

export interface FailedLogEntry {
  payload: LogPayload;
  timestamp: number;
}
