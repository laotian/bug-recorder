export class RecordingResultDialog {
  private element: HTMLDivElement;
  private isVisible: boolean = false;
  private onClose?: () => void;

  constructor() {
    this.element = this.createDialog();
    this.setupEventListeners();
    this.hide();
  }

  private createDialog(): HTMLDivElement {
    const dialog = document.createElement('div');
    dialog.id = 'bug-recorder-result-dialog';
    dialog.innerHTML = this.getDialogHTML();
    dialog.style.cssText = this.getDialogStyles();
    
    document.body.appendChild(dialog);
    return dialog;
  }

  private getDialogHTML(): string {
    return `
      <div class="dialog-overlay">
        <div class="dialog-content">
          <div class="dialog-header">
            <h3>录制结果</h3>
            <button class="close-btn" title="关闭">×</button>
          </div>
          <div class="dialog-body">
            <textarea 
              id="recording-content" 
              rows="5" 
              placeholder="录制内容将显示在这里..."
              readonly
            ></textarea>
          </div>
          <div class="dialog-footer">
            <button id="copy-cli-btn" class="dialog-btn copy-cli-btn">复制命令行</button>
            <div class="dialog-footer-right">
              <button id="close-dialog-btn" class="dialog-btn close-btn-text">关闭</button>
              <button id="copy-dialog-btn" class="dialog-btn copy-btn">复制录制内容</button>
            </div>
          </div>
        </div>
      </div>
      <style>
        #bug-recorder-result-dialog .dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000000;
        }
        
        #bug-recorder-result-dialog .dialog-content {
          background: #fff;
          border-radius: 8px;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }
        
        #bug-recorder-result-dialog .dialog-header {
          padding: 16px 20px;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8f9fa;
        }
        
        #bug-recorder-result-dialog .dialog-header h3 {
          margin: 0;
          color: #333;
          font-size: 18px;
          font-weight: 600;
        }
        
        #bug-recorder-result-dialog .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: #666;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s ease;
        }
        
        #bug-recorder-result-dialog .close-btn:hover {
          background: rgba(0, 0, 0, 0.1);
          color: #333;
        }
        
        #bug-recorder-result-dialog .dialog-body {
          padding: 20px;
        }
        
        #bug-recorder-result-dialog #recording-content {
          width: 100%;
          min-height: 120px;
          max-height: 300px;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 12px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 12px;
          line-height: 1.5;
          background: #f8f9fa;
          color: #333;
          resize: vertical;
          box-sizing: border-box;
        }
        
        #bug-recorder-result-dialog #recording-content:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }
        
        #bug-recorder-result-dialog .dialog-footer {
          padding: 16px 20px;
          border-top: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8f9fa;
        }
        
        #bug-recorder-result-dialog .dialog-footer-right {
          display: flex;
          gap: 12px;
        }
        
        #bug-recorder-result-dialog .dialog-btn {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
          min-width: 70px;
        }
        
        #bug-recorder-result-dialog .close-btn-text {
          background: #fff;
          color: #666;
        }
        
        #bug-recorder-result-dialog .close-btn-text:hover {
          background: #f0f0f0;
          border-color: #bbb;
        }
        
        #bug-recorder-result-dialog .copy-btn {
          background: #007bff;
          color: #fff;
          border-color: #007bff;
        }
        
        #bug-recorder-result-dialog .copy-btn:hover {
          background: #0056b3;
          border-color: #0056b3;
        }
        
        #bug-recorder-result-dialog .copy-btn:active {
          background: #004085;
        }
        
        #bug-recorder-result-dialog .copy-btn.copied {
          background: #28a745;
          border-color: #28a745;
        }
        
        #bug-recorder-result-dialog .copy-cli-btn {
          background: #6c757d;
          color: #fff;
          border-color: #6c757d;
        }
        
        #bug-recorder-result-dialog .copy-cli-btn:hover {
          background: #5a6268;
          border-color: #545b62;
        }
        
        #bug-recorder-result-dialog .copy-cli-btn:active {
          background: #495057;
        }
        
        #bug-recorder-result-dialog .copy-cli-btn.copied {
          background: #28a745;
          border-color: #28a745;
        }
      </style>
    `;
  }

  private getDialogStyles(): string {
    return `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
  }

  private setupEventListeners(): void {
    const closeBtn = this.element.querySelector('.close-btn') as HTMLButtonElement;
    const closeDialogBtn = this.element.querySelector('#close-dialog-btn') as HTMLButtonElement;
    const copyBtn = this.element.querySelector('#copy-dialog-btn') as HTMLButtonElement;
    const copyCliBtn = this.element.querySelector('#copy-cli-btn') as HTMLButtonElement;
    const overlay = this.element.querySelector('.dialog-overlay') as HTMLDivElement;

    closeBtn.addEventListener('click', () => {
      this.hide();
    });

    closeDialogBtn.addEventListener('click', () => {
      this.hide();
    });

    copyBtn.addEventListener('click', () => {
      this.copyContent();
    });

    copyCliBtn.addEventListener('click', () => {
      this.copyCliCommand();
    });

    // 点击遮罩层关闭对话框
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hide();
      }
    });

    // ESC键关闭对话框
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }

  private async copyContent(): Promise<void> {
    const textarea = this.element.querySelector('#recording-content') as HTMLTextAreaElement;
    const copyBtn = this.element.querySelector('#copy-dialog-btn') as HTMLButtonElement;
    
    try {
      await navigator.clipboard.writeText(textarea.value);
      
      // 显示复制成功反馈
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '已复制';
      copyBtn.classList.add('copied');
      
      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.classList.remove('copied');
      }, 2000);
      
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      
      // 降级方案：选中文本
      textarea.select();
      textarea.setSelectionRange(0, 99999);
      
      try {
        document.execCommand('copy');
        copyBtn.textContent = '已复制';
        copyBtn.classList.add('copied');
        
        setTimeout(() => {
          copyBtn.textContent = '复制录制内容';
          copyBtn.classList.remove('copied');
        }, 2000);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
    }
  }

  private async copyCliCommand(): Promise<void> {
    const copyCliBtn = this.element.querySelector('#copy-cli-btn') as HTMLButtonElement;
    const cliCommand = 'npx --registry=https://registry.npmmirror.com codebyai-bug-recorder save';
    
    try {
      await navigator.clipboard.writeText(cliCommand);
      
      // 显示复制成功反馈
      const originalText = copyCliBtn.textContent;
      copyCliBtn.textContent = '已复制';
      copyCliBtn.classList.add('copied');
      
      setTimeout(() => {
        copyCliBtn.textContent = originalText;
        copyCliBtn.classList.remove('copied');
      }, 2000);
      
    } catch (error) {
      console.error('Failed to copy CLI command to clipboard:', error);
      
      // 降级方案：使用execCommand
      try {
        const tempInput = document.createElement('input');
        tempInput.value = cliCommand;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        
        copyCliBtn.textContent = '已复制';
        copyCliBtn.classList.add('copied');
        
        setTimeout(() => {
          copyCliBtn.textContent = '复制命令行';
          copyCliBtn.classList.remove('copied');
        }, 2000);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
    }
  }

  public show(content: string): void {
    const textarea = this.element.querySelector('#recording-content') as HTMLTextAreaElement;
    textarea.value = content;
    
    this.isVisible = true;
    this.element.style.display = 'block';
    
    // 添加出现动画
    requestAnimationFrame(() => {
      this.element.style.opacity = '1';
    });
  }

  public hide(): void {
    this.isVisible = false;
    this.element.style.display = 'none';
    this.onClose?.();
  }

  public setEventListeners(callbacks: {
    onClose?: () => void;
  }): void {
    this.onClose = callbacks.onClose;
  }

  public destroy(): void {
    this.element.remove();
  }

  public isOpen(): boolean {
    return this.isVisible;
  }
}