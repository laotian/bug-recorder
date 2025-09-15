declare const VConsole: any;

export class VConsoleIntegration {
  private vConsoleInstance: any = null;
  private tabId: string = 'bug_recorder';
  private isInitialized: boolean = false;
  private onRecordToggle?: () => void;
  private onStop?: () => void;
  private onScreenshot?: () => void;
  private onNote?: () => void;

  public init(): boolean {
    try {
      if (typeof VConsole === 'undefined' || !(window as any).VConsole) {
        console.warn('VConsole is not available');
        return false;
      }

      this.vConsoleInstance = (window as any).VConsole || new VConsole();
      
      if (!this.vConsoleInstance) {
        console.warn('Failed to initialize VConsole instance');
        return false;
      }

      this.addBugRecorderTab();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize VConsole integration:', error);
      return false;
    }
  }

  private addBugRecorderTab(): void {
    try {
      const tabName = 'Bug录制';
      
      if (this.vConsoleInstance.addPlugin) {
        this.vConsoleInstance.addPlugin({
          id: this.tabId,
          name: tabName,
          create: () => {
            return this.createTabContent();
          },
          init: (node: HTMLElement) => {
            this.setupTabEventListeners(node);
          }
        });
      } else {
        console.warn('VConsole addPlugin method not available');
      }
    } catch (error) {
      console.error('Failed to add Bug Recorder tab to VConsole:', error);
    }
  }

  private createTabContent(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'vc-bug-recorder';
    container.innerHTML = this.getTabHTML();
    
    container.style.cssText = `
      padding: 15px;
      background: #fff;
      height: 100%;
      box-sizing: border-box;
    `;
    
    return container;
  }

  private getTabHTML(): string {
    return `
      <div class="bug-recorder-panel">
        <div class="recorder-header">
          <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">Bug录制控制</h3>
          <div class="recorder-status">
            <span id="recorder-status-text">未录制</span>
          </div>
        </div>
        
        <div class="recorder-controls">
          <button id="vconsole-record-toggle" class="vc-btn" style="margin-right: 8px;">开始录制</button>
          <button id="vconsole-stop" class="vc-btn" style="margin-right: 8px; display: none;">停止录制</button>
          <button id="vconsole-screenshot" class="vc-btn" style="margin-right: 8px; display: none;">截图</button>
          <button id="vconsole-note" class="vc-btn">添加备注</button>
        </div>
        
        <div class="recorder-info" style="margin-top: 20px; font-size: 12px; color: #666;">
          <p>• 点击"开始录制"开始记录用户操作</p>
          <p>• 录制过程中可以截图和添加备注</p>
          <p>• 停止录制后内容会自动复制到剪贴板</p>
        </div>
      </div>
    `;
  }

  private setupTabEventListeners(container: HTMLElement): void {
    const recordToggleBtn = container.querySelector('#vconsole-record-toggle') as HTMLButtonElement;
    const stopBtn = container.querySelector('#vconsole-stop') as HTMLButtonElement;
    const screenshotBtn = container.querySelector('#vconsole-screenshot') as HTMLButtonElement;
    const noteBtn = container.querySelector('#vconsole-note') as HTMLButtonElement;

    if (recordToggleBtn) {
      recordToggleBtn.addEventListener('click', () => {
        this.onRecordToggle?.();
      });
    }

    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        this.onStop?.();
      });
    }

    if (screenshotBtn) {
      screenshotBtn.addEventListener('click', () => {
        this.onScreenshot?.();
      });
    }

    if (noteBtn) {
      noteBtn.addEventListener('click', () => {
        this.onNote?.();
      });
    }
  }

  public updateRecordingState(isRecording: boolean, isPaused: boolean): void {
    if (!this.isInitialized) return;

    try {
      const container = document.querySelector('.vc-bug-recorder');
      if (!container) return;

      const recordToggleBtn = container.querySelector('#vconsole-record-toggle') as HTMLButtonElement;
      const stopBtn = container.querySelector('#vconsole-stop') as HTMLButtonElement;
      const screenshotBtn = container.querySelector('#vconsole-screenshot') as HTMLButtonElement;
      const statusText = container.querySelector('#recorder-status-text') as HTMLSpanElement;

      if (recordToggleBtn && stopBtn && screenshotBtn && statusText) {
        if (isRecording) {
          recordToggleBtn.textContent = isPaused ? '继续录制' : '暂停录制';
          stopBtn.style.display = 'inline-block';
          screenshotBtn.style.display = isPaused ? 'none' : 'inline-block';
          statusText.textContent = isPaused ? '已暂停' : '录制中';
          statusText.style.color = isPaused ? '#f39c12' : '#27ae60';
        } else {
          recordToggleBtn.textContent = '开始录制';
          stopBtn.style.display = 'none';
          screenshotBtn.style.display = 'none';
          statusText.textContent = '未录制';
          statusText.style.color = '#95a5a6';
        }
      }
    } catch (error) {
      console.error('Failed to update recording state in VConsole:', error);
    }
  }

  public showMessage(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
    if (!this.isInitialized) return;

    try {
      const container = document.querySelector('.vc-bug-recorder');
      if (!container) return;

      const messageDiv = document.createElement('div');
      messageDiv.style.cssText = `
        padding: 8px 12px;
        margin: 10px 0;
        border-radius: 4px;
        font-size: 12px;
        ${type === 'success' ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' :
          type === 'error' ? 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;' :
          'background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb;'}
      `;
      messageDiv.textContent = message;

      container.appendChild(messageDiv);

      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.parentNode.removeChild(messageDiv);
        }
      }, 3000);
    } catch (error) {
      console.error('Failed to show message in VConsole:', error);
    }
  }

  public setEventListeners(callbacks: {
    onRecordToggle?: () => void;
    onStop?: () => void;
    onScreenshot?: () => void;
    onNote?: () => void;
  }): void {
    this.onRecordToggle = callbacks.onRecordToggle;
    this.onStop = callbacks.onStop;
    this.onScreenshot = callbacks.onScreenshot;
    this.onNote = callbacks.onNote;
  }

  public isAvailable(): boolean {
    return typeof VConsole !== 'undefined' && this.isInitialized;
  }

  public destroy(): void {
    if (this.vConsoleInstance && this.vConsoleInstance.removePlugin) {
      try {
        this.vConsoleInstance.removePlugin(this.tabId);
      } catch (error) {
        console.error('Failed to remove Bug Recorder tab from VConsole:', error);
      }
    }
    
    this.isInitialized = false;
    this.vConsoleInstance = null;
  }
}