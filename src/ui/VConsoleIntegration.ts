declare const VConsole: any;

export class VConsoleIntegration {
  private vConsoleInstance: any = null;
  private plugin: any = null;
  private tabId: string = 'bug_recorder';
  private isInitialized: boolean = false;
  private onShowFloatingBar?: () => void;
  private onHideFloatingBar?: () => void;

  public init(vConsoleInstance?: any): boolean {
    try {
      // If vConsole instance is provided directly, use it
      if (vConsoleInstance) {
        this.vConsoleInstance = vConsoleInstance;
      } else {
        // Check if VConsole class is available
        if (typeof window === 'undefined' || !(window as any).VConsole) {
          console.warn('VConsole is not available');
          return false;
        }

        // Try to find vConsole instance in multiple ways
        this.vConsoleInstance = this.findVConsoleInstance();
      }
      
      if (!this.vConsoleInstance) {
        console.warn('VConsole instance not found. Please make sure vConsole is initialized before BugRecorder.');
        return false;
      }

      // Check if addPlugin method exists
      if (typeof this.vConsoleInstance.addPlugin !== 'function') {
        console.warn('VConsole addPlugin method not available');
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

  private findVConsoleInstance(): any {
    // Method 1: Check window.vConsole
    if ((window as any).vConsole && typeof (window as any).vConsole.addPlugin === 'function') {
      return (window as any).vConsole;
    }

    // Method 2: Check if there's a global vConsole variable
    if (typeof (window as any).vConsole !== 'undefined' && typeof (window as any).vConsole.addPlugin === 'function') {
      return (window as any).vConsole;
    }

    // Method 3: Check VConsole instances array (VConsole might store instances internally)
    const VConsoleClass = (window as any).VConsole;
    if (VConsoleClass && VConsoleClass.instance && typeof VConsoleClass.instance.addPlugin === 'function') {
      return VConsoleClass.instance;
    }

    // Method 4: Try to find any vConsole instance in the DOM or global scope
    // Look for any variable that has the vConsole methods
    for (const key in window) {
      try {
        const obj = (window as any)[key];
        if (obj && typeof obj === 'object' && typeof obj.addPlugin === 'function' && typeof obj.showPlugin === 'function') {
          return obj;
        }
      } catch (e) {
        // Ignore errors when accessing window properties
      }
    }

    return null;
  }

  private addBugRecorderTab(): void {
    try {
      const tabName = 'Bug录制';
      
      // Create plugin using VConsole.VConsolePlugin constructor
      const VConsoleClass = (window as any).VConsole;
      this.plugin = new VConsoleClass.VConsolePlugin(this.tabId, tabName);
      
      // Bind plugin events
      this.plugin.on('renderTab', (callback: Function) => {
        const content = this.createTabContent();
        callback(content);
      });

      this.plugin.on('ready', () => {
        // Setup event listeners after the tab is rendered
        this.setupTabEventListeners();
      });

      // Add plugin to vConsole instance
      this.vConsoleInstance.addPlugin(this.plugin);
      
    } catch (error) {
      console.error('Failed to add Bug Recorder tab to VConsole:', error);
    }
  }

  private createTabContent(): string {
    return `
      <div class="vc-bug-recorder" style="padding: 15px; background: #fff; height: 100%; box-sizing: border-box;">
        ${this.getTabHTML()}
      </div>
    `;
  }

  private getTabHTML(): string {
    return `
      <div class="bug-recorder-panel">
        <div class="recorder-header">
          <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">Bug录制控制</h3>
          <div class="recorder-description" style="margin-bottom: 15px; font-size: 14px; color: #666;">
            通过悬浮栏进行录制操作
          </div>
        </div>
        
        <div class="floating-bar-controls" style="display: flex; gap: 8px; margin-bottom: 20px;">
          <button id="vconsole-show-bar" class="vc-control-btn">显示悬浮栏</button>
          <button id="vconsole-hide-bar" class="vc-control-btn">隐藏悬浮栏</button>
        </div>
        
        <div class="recorder-info" style="font-size: 12px; color: #666;">
          <p><strong>使用说明：</strong></p>
          <ul style="margin: 8px 0; padding-left: 16px;">
            <li>点击"显示悬浮栏"显示录制工具栏</li>
            <li>通过悬浮栏进行开始/暂停/停止录制</li>
            <li>录制过程中可以截图和添加备注</li>
            <li>停止录制后会弹出结果对话框</li>
          </ul>
        </div>
      </div>
      <style>
        .vc-control-btn {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: #fff;
          color: #333;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s ease;
        }
        
        .vc-control-btn:hover {
          background: #f0f0f0;
          border-color: #999;
        }
        
        .vc-control-btn:active {
          background: #e0e0e0;
        }
        
        .vc-control-btn:first-child {
          background: #007bff;
          color: #fff;
          border-color: #007bff;
        }
        
        .vc-control-btn:first-child:hover {
          background: #0056b3;
          border-color: #0056b3;
        }
      </style>
    `;
  }

  private setupTabEventListeners(): void {
    // Find the plugin container in DOM
    const container = document.querySelector('.vc-bug-recorder');
    if (!container) {
      console.warn('Bug recorder container not found in DOM');
      return;
    }

    const showBarBtn = container.querySelector('#vconsole-show-bar') as HTMLButtonElement;
    const hideBarBtn = container.querySelector('#vconsole-hide-bar') as HTMLButtonElement;

    if (showBarBtn) {
      showBarBtn.addEventListener('click', () => {
        this.onShowFloatingBar?.();
      });
    }

    if (hideBarBtn) {
      hideBarBtn.addEventListener('click', () => {
        this.onHideFloatingBar?.();
      });
    }
  }

  public updateRecordingState(isRecording: boolean, isPaused: boolean): void {
    // VConsole integration no longer manages recording state directly
    // Recording state is managed by the floating bar
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
    onShowFloatingBar?: () => void;
    onHideFloatingBar?: () => void;
  }): void {
    this.onShowFloatingBar = callbacks.onShowFloatingBar;
    this.onHideFloatingBar = callbacks.onHideFloatingBar;
  }

  public isAvailable(): boolean {
    return typeof VConsole !== 'undefined' && this.isInitialized;
  }

  public destroy(): void {
    if (this.vConsoleInstance && this.vConsoleInstance.removePlugin && this.plugin) {
      try {
        this.vConsoleInstance.removePlugin(this.tabId);
      } catch (error) {
        console.error('Failed to remove Bug Recorder tab from VConsole:', error);
      }
    }
    
    this.isInitialized = false;
    this.vConsoleInstance = null;
    this.plugin = null;
  }
}