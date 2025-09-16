import { ConsoleEvent } from '../types';

export class ConsoleListener {
  private isListening: boolean = false;
  private onConsoleEvent?: (data: ConsoleEvent) => void;
  private ignoreConsoleContents: (string | RegExp)[] = [];
  private originalConsole: {
    log: typeof console.log;
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
  };

  constructor() {
    this.originalConsole = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console)
    };
  }

  private wrapConsoleMethod(level: 'log' | 'info' | 'warn' | 'error'): void {
    const original = this.originalConsole[level];
    
    (console as any)[level] = (...args: any[]) => {
      original(...args);
      
      if (this.isListening && this.onConsoleEvent) {
        try {
          const message = args.map(arg => {
            if (typeof arg === 'string') {
              return arg;
            } else if (arg instanceof Error) {
              return arg.message + '\n' + arg.stack;
            } else {
              try {
                return JSON.stringify(arg);
              } catch {
                return String(arg);
              }
            }
          }).join(' ');

          // 检查是否应该忽略此console内容
          if (this.shouldIgnoreContent(message)) {
            return;
          }

          const consoleData: ConsoleEvent = {
            level,
            message,
            args: this.serializeArgs(args)
          };

          this.onConsoleEvent(consoleData);
        } catch (error) {
          // Avoid infinite loop by not logging this error
        }
      }
    };
  }

  private serializeArgs(args: any[]): any[] {
    return args.map(arg => {
      if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
        return arg;
      } else if (arg instanceof Error) {
        return {
          name: arg.name,
          message: arg.message,
          stack: arg.stack
        };
      } else if (arg && typeof arg === 'object') {
        try {
          return JSON.parse(JSON.stringify(arg));
        } catch {
          return String(arg);
        }
      } else {
        return String(arg);
      }
    });
  }

  public startListening(): void {
    if (this.isListening) return;
    
    this.isListening = true;
    
    this.wrapConsoleMethod('log');
    this.wrapConsoleMethod('info');
    this.wrapConsoleMethod('warn');
    this.wrapConsoleMethod('error');

    this.captureUnhandledErrors();
  }

  public stopListening(): void {
    if (!this.isListening) return;
    
    this.isListening = false;
    
    console.log = this.originalConsole.log;
    console.info = this.originalConsole.info;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;

    this.removeUnhandledErrorCapture();
  }

  private errorHandler = (event: ErrorEvent) => {
    if (!this.isListening) return;
    
    const message = `Uncaught Error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`;
    
    // 检查是否应该忽略此错误内容
    if (this.shouldIgnoreContent(message)) {
      return;
    }
    
    const consoleData: ConsoleEvent = {
      level: 'error',
      message,
      args: [{
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      }]
    };
    
    this.onConsoleEvent?.(consoleData);
  };

  private rejectionHandler = (event: PromiseRejectionEvent) => {
    if (!this.isListening) return;
    
    const message = `Unhandled Promise Rejection: ${event.reason}`;
    
    // 检查是否应该忽略此Promise拒绝内容
    if (this.shouldIgnoreContent(message)) {
      return;
    }
    
    const consoleData: ConsoleEvent = {
      level: 'error',
      message,
      args: [{ reason: event.reason }]
    };
    
    this.onConsoleEvent?.(consoleData);
  };

  private captureUnhandledErrors(): void {
    window.addEventListener('error', this.errorHandler);
    window.addEventListener('unhandledrejection', this.rejectionHandler);
  }

  private removeUnhandledErrorCapture(): void {
    window.removeEventListener('error', this.errorHandler);
    window.removeEventListener('unhandledrejection', this.rejectionHandler);
  }

  public setEventListeners(callbacks: {
    onConsoleEvent?: (data: ConsoleEvent) => void;
  }): void {
    this.onConsoleEvent = callbacks.onConsoleEvent;
  }

  public setIgnoreConsoleContents(contents: (string | RegExp)[]): void {
    this.ignoreConsoleContents = contents || [];
  }

  private shouldIgnoreContent(content: string): boolean {
    return this.ignoreConsoleContents.some(pattern => {
      if (typeof pattern === 'string') {
        return content.includes(pattern);
      } else if (pattern instanceof RegExp) {
        return pattern.test(content);
      }
      return false;
    });
  }
}