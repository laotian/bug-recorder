export class NoteInput {
  private element: HTMLDivElement;
  private textarea: HTMLTextAreaElement;
  private onSubmit?: (content: string) => void;
  private onCancel?: () => void;

  constructor() {
    this.element = this.createNoteInput();
    this.textarea = this.element.querySelector('#note-textarea') as HTMLTextAreaElement;
    this.setupEventListeners();
  }

  private createNoteInput(): HTMLDivElement {
    const container = document.createElement('div');
    container.id = 'bug-recorder-note-input';
    container.innerHTML = this.getNoteInputHTML();
    container.style.cssText = this.getNoteInputStyles();
    
    document.body.appendChild(container);
    return container;
  }

  private getNoteInputHTML(): string {
    return `
      <div class="note-modal">
        <div class="note-header">
          <h3>添加备注</h3>
          <button id="note-close" class="close-btn" title="关闭">×</button>
        </div>
        <div class="note-body">
          <textarea id="note-textarea" placeholder="请输入备注信息..."></textarea>
        </div>
        <div class="note-footer">
          <button id="note-cancel" class="btn btn-cancel">取消</button>
          <button id="note-submit" class="btn btn-submit">确定</button>
        </div>
      </div>
    `;
  }

  private getNoteInputStyles(): string {
    return `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 1000000;
    `;
  }

  private setupEventListeners(): void {
    const modal = this.element.querySelector('.note-modal') as HTMLDivElement;
    const closeBtn = this.element.querySelector('#note-close') as HTMLButtonElement;
    const cancelBtn = this.element.querySelector('#note-cancel') as HTMLButtonElement;
    const submitBtn = this.element.querySelector('#note-submit') as HTMLButtonElement;

    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) {
        this.hide();
        this.onCancel?.();
      }
    });

    closeBtn.addEventListener('click', () => {
      this.hide();
      this.onCancel?.();
    });

    cancelBtn.addEventListener('click', () => {
      this.hide();
      this.onCancel?.();
    });

    submitBtn.addEventListener('click', () => {
      const content = this.textarea.value.trim();
      if (content) {
        this.onSubmit?.(content);
        this.textarea.value = '';
        this.hide();
      }
    });

    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        const content = this.textarea.value.trim();
        if (content) {
          this.onSubmit?.(content);
          this.textarea.value = '';
          this.hide();
        }
      }
      if (e.key === 'Escape') {
        this.hide();
        this.onCancel?.();
      }
    });

    this.addModalStyles();
  }

  private addModalStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      #bug-recorder-note-input .note-modal {
        background: white;
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        width: 400px;
        max-width: 90vw;
        max-height: 80vh;
        overflow: hidden;
      }

      #bug-recorder-note-input .note-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: #f8f9fa;
        border-bottom: 1px solid #e9ecef;
      }

      #bug-recorder-note-input .note-header h3 {
        margin: 0;
        font-size: 16px;
        color: #333;
        font-weight: 600;
      }

      #bug-recorder-note-input .close-btn {
        background: none;
        border: none;
        font-size: 20px;
        color: #666;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      #bug-recorder-note-input .close-btn:hover {
        background: rgba(0, 0, 0, 0.1);
        color: #333;
      }

      #bug-recorder-note-input .note-body {
        padding: 20px;
      }

      #bug-recorder-note-input #note-textarea {
        width: 100%;
        height: 120px;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        resize: vertical;
        outline: none;
        box-sizing: border-box;
      }

      #bug-recorder-note-input #note-textarea:focus {
        border-color: #007bff;
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
      }

      #bug-recorder-note-input .note-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 16px 20px;
        background: #f8f9fa;
        border-top: 1px solid #e9ecef;
      }

      #bug-recorder-note-input .btn {
        padding: 8px 16px;
        border-radius: 4px;
        border: none;
        font-size: 14px;
        cursor: pointer;
        font-weight: 500;
      }

      #bug-recorder-note-input .btn-cancel {
        background: #f8f9fa;
        color: #666;
        border: 1px solid #ddd;
      }

      #bug-recorder-note-input .btn-cancel:hover {
        background: #e9ecef;
        color: #333;
      }

      #bug-recorder-note-input .btn-submit {
        background: #007bff;
        color: white;
      }

      #bug-recorder-note-input .btn-submit:hover {
        background: #0056b3;
      }
    `;
    
    if (!document.querySelector('#bug-recorder-note-styles')) {
      style.id = 'bug-recorder-note-styles';
      document.head.appendChild(style);
    }
  }

  public show(): void {
    this.element.style.display = 'flex';
    setTimeout(() => {
      this.textarea.focus();
    }, 100);
  }

  public hide(): void {
    this.element.style.display = 'none';
    this.textarea.value = '';
  }

  public setEventListeners(callbacks: {
    onSubmit?: (content: string) => void;
    onCancel?: () => void;
  }): void {
    this.onSubmit = callbacks.onSubmit;
    this.onCancel = callbacks.onCancel;
  }

  public destroy(): void {
    const styles = document.querySelector('#bug-recorder-note-styles');
    if (styles) {
      styles.remove();
    }
    this.element.remove();
  }
}