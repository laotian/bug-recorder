import { BugRecorderConfig, ShowMode } from './types';
import { RecordManager } from './core/RecordManager';
import { FloatingBar } from './ui/FloatingBar';
import { NoteInput } from './ui/NoteInput';
import { VConsoleIntegration } from './ui/VConsoleIntegration';
import { RecordingResultDialog } from './ui/RecordingResultDialog';
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
  private recordingResultDialog?: RecordingResultDialog;
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
    
    // 设置截图目标元素
    if (config.screenshotElement) {
      this.screenshot.setScreenshotElement(config.screenshotElement);
    }
    
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

    if (this.config.show === 'bar') {
      this.initFloatingBar(callbacks, true);
    } else if (this.config.show === 'hidden_bar') {
      this.initFloatingBar(callbacks, false);
      this.initKeyboardShortcuts();
    } else if (this.config.show === 'vConsole' || (typeof this.config.show === 'object' && this.config.show.addPlugin)) {
      this.initVConsoleIntegration(callbacks);
    } else {
      console.warn('Unknown show mode, falling back to bar mode');
      this.initFloatingBar(callbacks, true);
    }

    this.initNoteInput();
    this.initRecordingResultDialog();
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
    
    // Check if config.show is a vConsole instance
    const vConsoleInstance = (typeof this.config.show === 'object' && this.config.show.addPlugin) ? 
      this.config.show : undefined;
    
    const initialized = this.vConsoleIntegration.init(vConsoleInstance);
    
    if (initialized) {
      // Initialize floating bar for vConsole mode (hidden by default)
      this.initFloatingBar(callbacks, false);
      
      // Set VConsole-specific callbacks
      this.vConsoleIntegration.setEventListeners({
        onShowFloatingBar: () => {
          this.floatingBar?.show();
        },
        onHideFloatingBar: () => {
          this.floatingBar?.hide();
        }
      });
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

  private initRecordingResultDialog(): void {
    this.recordingResultDialog = new RecordingResultDialog();
    this.recordingResultDialog.setEventListeners({
      onClose: () => {
        // Dialog closed
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
      
      // 显示录制结果对话框
      this.recordingResultDialog?.show(markdown);
      this.showUIMessage(`录制完成！共记录${events.length}条操作`, 'success');
    } catch (error) {
      console.error('Failed to export data:', error);
      this.showUIMessage('导出数据失败', 'error');
    }
  }

  private showUIMessage(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
    this.vConsoleIntegration?.showMessage(message, type);
    
    if (this.config.show !== 'vConsole' && !(typeof this.config.show === 'object' && this.config.show.addPlugin)) {
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
    this.recordingResultDialog?.destroy();

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