export type ShowMode = 'bar' | 'hidden_bar' | 'vConsole';

export interface BugRecorderConfig {
  show: ShowMode;
}

export interface RecordEvent {
  timestamp: string;
  type: EventType;
  data: any;
}

export type EventType = 
  | 'USER_CLICK'
  | 'USER_INPUT' 
  | 'URL_CHANGE'
  | 'CONSOLE'
  | 'XHR'
  | 'FETCH'
  | 'SCREENSHOT'
  | 'NOTE';

export interface UserClickEvent {
  elementId?: string;
  elementName?: string;
  elementClass?: string;
  elementType: string;
  elementLabel?: string;
  xpath?: string;
}

export interface UserInputEvent {
  elementId?: string;
  elementName?: string;
  elementClass?: string;
  elementType: string;
  elementLabel?: string;
  value: string;
  xpath?: string;
}

export interface UrlChangeEvent {
  from: string;
  to: string;
}

export interface ConsoleEvent {
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
  args?: any[];
}

export interface NetworkRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

export interface NetworkResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: string;
}

export interface XhrEvent {
  request: NetworkRequest;
  response: NetworkResponse;
}

export interface ScreenshotEvent {
  dataUrl: string;
}

export interface NoteEvent {
  content: string;
}

export interface RecordState {
  isRecording: boolean;
  isPaused: boolean;
  events: RecordEvent[];
}