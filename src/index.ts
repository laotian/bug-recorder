import { BugRecorderConfig, ShowMode } from './types';
import { RecordManager } from './core/RecordManager';
import { FloatingBar } from './ui/FloatingBar';
import { NoteInput } from './ui/NoteInput';
import { VConsoleIntegration } from './ui/VConsoleIntegration';
import { UserActionListener } from './listeners/UserActionListener';
import { UrlChangeListener } from './listeners/UrlChangeListener';
import { ConsoleListener } from './listeners/ConsoleListener';
import { NetworkListener } from './listeners/NetworkListener';
import { Screenshot } from './utils/Screenshot';
import { MarkdownExporter } from './utils/MarkdownExporter';
import { KeyboardShortcuts } from './utils/KeyboardShortcuts';

class BugRecorder {
  private config: BugRecorderConfig;
  private recordManager: RecordManager;
  private floatingBar?: FloatingBar;
  private noteInput?: NoteInput;
  private vConsoleIntegration?: VConsoleIntegration;
  private userActionListener: UserActionListener;
  private urlChangeListener: UrlChangeListener;
  private consoleListener: ConsoleListener;
  private networkListener: NetworkListener;
  private screenshot: Screenshot;
  private markdownExporter: MarkdownExporter;
  private keyboardShortcuts?: KeyboardShortcuts;
  private isInitialized: boolean = false;

  constructor() {
    this.config = { show: 'bar' };
    this.recordManager = new RecordManager();
    this.userActionListener = new UserActionListener();
    this.urlChangeListener = new UrlChangeListener();
    this.consoleListener = new ConsoleListener();
    this.networkListener = new NetworkListener();
    this.screenshot = new Screenshot();
    this.markdownExporter = new MarkdownExporter();
  }

  public init(config: BugRecorderConfig): void {
    if (this.isInitialized) {
      console.warn('BugRecorder is already initialized');
      return;
    }

    this.config = { ...config };
    this.setupEventListeners();
    this.initializeUI();
    this.isInitialized = true;

    console.log(`BugRecorder initialized in ${config.show} mode`);
  }

  private setupEventListeners(): void {
    this.userActionListener.setEventListeners({
      onUserClick: (data) => {
        this.recordManager.addEvent('USER_CLICK', data);
      },
      onUserInput: (data) => {
        this.recordManager.addEvent('USER_INPUT', data);
      }
    });

    this.urlChangeListener.setEventListeners({
      onUrlChange: (data) => {
        this.recordManager.addEvent('URL_CHANGE', data);
      }
    });

    this.consoleListener.setEventListeners({
      onConsoleEvent: (data) => {
        this.recordManager.addEvent('CONSOLE', data);
      }
    });

    this.networkListener.setEventListeners({
      onNetworkRequest: (data) => {
        this.recordManager.addEvent('XHR', data);
      }
    });

    this.screenshot.setEventListeners({
      onScreenshot: (data) => {
        this.recordManager.addEvent('SCREENSHOT', data);
      }
    });

    this.recordManager.on('record-start', () => {
      this.startAllListeners();
      this.updateUIRecordingState();
    });

    this.recordManager.on('record-pause', () => {
      this.pauseAllListeners();
      this.updateUIRecordingState();
    });

    this.recordManager.on('record-resume', () => {
      this.resumeAllListeners();
      this.updateUIRecordingState();
    });

    this.recordManager.on('record-stop', (events: any[]) => {
      this.stopAllListeners();
      this.updateUIRecordingState();
      this.exportData(events);
    });
  }

  private initializeUI(): void {
    const callbacks = {
      onRecordToggle: () => this.toggleRecording(),
      onStop: () => this.stopRecording(),
      onScreenshot: () => this.takeScreenshot(),
      onNote: () => this.showNoteInput()
    };

    switch (this.config.show) {
      case 'bar':
        this.initFloatingBar(callbacks, true);
        break;

      case 'hidden_bar':
        this.initFloatingBar(callbacks, false);
        this.initKeyboardShortcuts();
        break;

      case 'vConsole':
        this.initVConsoleIntegration(callbacks);
        break;
    }

    this.initNoteInput();
  }

  private initFloatingBar(callbacks: any, visible: boolean): void {
    this.floatingBar = new FloatingBar();
    this.floatingBar.setEventListeners(callbacks);
    
    if (visible) {
      this.floatingBar.show();
    }
  }

  private initKeyboardShortcuts(): void {
    this.keyboardShortcuts = new KeyboardShortcuts();
    this.keyboardShortcuts.setEventListeners({
      onToggleVisibility: () => {
        if (this.floatingBar) {
          if (this.recordManager.isActive()) {
            this.stopRecording();
            this.floatingBar.hide();
          } else {
            this.floatingBar.toggle();
          }
        }
      }
    });
    this.keyboardShortcuts.startListening();
  }

  private initVConsoleIntegration(callbacks: any): void {
    this.vConsoleIntegration = new VConsoleIntegration();
    const initialized = this.vConsoleIntegration.init();
    
    if (initialized) {
      this.vConsoleIntegration.setEventListeners(callbacks);
    } else {
      console.warn('VConsole not available, falling back to floating bar mode');
      this.config.show = 'bar';
      this.initFloatingBar(callbacks, true);
    }
  }

  private initNoteInput(): void {
    this.noteInput = new NoteInput();
    this.noteInput.setEventListeners({
      onSubmit: (content) => {
        this.recordManager.addEvent('NOTE', { content });
        this.showUIMessage('备注已添加', 'success');
      },
      onCancel: () => {
        // Do nothing on cancel
      }
    });
  }

  private toggleRecording(): void {
    this.recordManager.toggleRecording();
  }

  private stopRecording(): void {
    this.recordManager.stopRecording();
  }

  private async takeScreenshot(): Promise<void> {
    if (!this.recordManager.isRecording()) {
      this.showUIMessage('请先开始录制', 'error');
      return;
    }

    try {
      await this.screenshot.takeFullPageScreenshot();
      this.floatingBar?.showScreenshotFeedback();
      this.showUIMessage('截图已保存', 'success');
    } catch (error) {
      console.error('Screenshot failed:', error);
      this.showUIMessage('截图失败', 'error');
    }
  }

  private showNoteInput(): void {
    this.noteInput?.show();
  }

  private startAllListeners(): void {
    this.userActionListener.startListening();
    this.urlChangeListener.startListening();
    this.consoleListener.startListening();
    this.networkListener.startListening();
  }

  private pauseAllListeners(): void {
    this.userActionListener.stopListening();
  }

  private resumeAllListeners(): void {
    this.userActionListener.startListening();
  }

  private stopAllListeners(): void {
    this.userActionListener.stopListening();
    this.urlChangeListener.stopListening();
    this.consoleListener.stopListening();
    this.networkListener.stopListening();
  }

  private updateUIRecordingState(): void {
    const state = this.recordManager.getState();
    
    this.floatingBar?.updateRecordingState(state.isRecording, state.isPaused);
    this.vConsoleIntegration?.updateRecordingState(state.isRecording, state.isPaused);
  }

  private exportData(events: any[]): void {
    try {
      const summary = this.markdownExporter.generateSummary(events);
      const markdown = summary + this.markdownExporter.exportToMarkdown(events);
      
      this.markdownExporter.copyToClipboard(markdown).then(() => {
        this.showUIMessage(`录制完成！已复制${events.length}条记录到剪贴板`, 'success');
      }).catch((error) => {
        console.error('Failed to copy to clipboard:', error);
        this.showUIMessage('录制完成！但复制到剪贴板失败', 'error');
      });
    } catch (error) {
      console.error('Failed to export data:', error);
      this.showUIMessage('导出数据失败', 'error');
    }
  }

  private showUIMessage(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
    this.vConsoleIntegration?.showMessage(message, type);
    
    if (this.config.show !== 'vConsole') {
      console.log(`[BugRecorder] ${message}`);
    }
  }

  public destroy(): void {
    if (!this.isInitialized) return;

    this.stopAllListeners();
    this.keyboardShortcuts?.stopListening();
    
    this.floatingBar?.destroy();
    this.noteInput?.destroy();
    this.vConsoleIntegration?.destroy();

    this.isInitialized = false;
    console.log('BugRecorder destroyed');
  }

  public getRecordManager(): RecordManager {
    return this.recordManager;
  }

  public getMarkdownExporter(): MarkdownExporter {
    return this.markdownExporter;
  }

  public static getVersion(): string {
    return '1.0.0';
  }
}

export default BugRecorder;