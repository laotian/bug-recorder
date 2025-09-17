export class FloatingBar {
  private element: HTMLDivElement;
  private isVisible: boolean = false;
  private isDragging: boolean = false;
  private offsetX: number = 0;
  private offsetY: number = 0;

  // 绑定的事件处理函数引用
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseUp: () => void;
  private boundMouseDown: (e: MouseEvent) => void;

  private onRecordToggle?: () => void;
  private onStop?: () => void;
  private onScreenshot?: () => void;
  private onScreenshotEventOnly?: () => void;
  private onNote?: () => void;

  constructor() {
    // 绑定事件处理函数
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);
    this.boundMouseDown = this.handleMouseDown.bind(this);

    this.element = this.createFloatingBar();
    this.setupEventListeners();
    this.hide();
  }

  private createFloatingBar(): HTMLDivElement {
    const bar = document.createElement('div');
    bar.id = 'bug-recorder-floating-bar';
    bar.innerHTML = this.getBarHTML();
    bar.style.cssText = this.getBarStyles();

    document.body.appendChild(bar);
    return bar;
  }

  private getBarHTML(): string {
    return `
      <div class="bug-recorder-controls">
        <button id="record-toggle" class="control-btn" title="开始/暂停录制">
          ${this.getRecordIcon()}
        </button>
        <button id="stop-btn" class="control-btn" title="停止录制" style="display: none;">
          ${this.getStopIcon()}
        </button>
        <button id="screenshot-btn" class="control-btn" title="截图（Alt+点击仅记录截图事件）" style="display: none;">
          ${this.getCameraIcon()}
        </button>
        <button id="note-btn" class="control-btn" title="添加备注">
          ${this.getPenIcon()}
        </button>
      </div>
      <style>
        #bug-recorder-floating-bar .bug-recorder-controls {
          display: flex;
          border-radius: 6px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }
        
        #bug-recorder-floating-bar .control-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0;
          margin: 0;
        }
        
        #bug-recorder-floating-bar .control-btn:last-child {
          border-right: none;
        }
        
        #bug-recorder-floating-bar .control-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
          /*transform: scale(1.05);*/
        }
        
        #bug-recorder-floating-bar .control-btn:active {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(0.95);
        }
        
        #bug-recorder-floating-bar .control-btn svg {
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
        }
      </style>
    `;
  }

  private getBarStyles(): string {
    return `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.75);
      border-radius: 8px;
      padding: 4px;
      display: flex;
      z-index: 999999;
      cursor: move;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      user-select: none;
      transition: box-shadow 0.2s ease;
    `;
  }

  private setupEventListeners(): void {
    this.element.addEventListener('mousedown', this.boundMouseDown);
    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mouseup', this.boundMouseUp);

    // 添加鼠标离开窗口时的处理
    document.addEventListener('mouseleave', this.boundMouseUp);

    const recordBtn = this.element.querySelector('#record-toggle') as HTMLButtonElement;
    const stopBtn = this.element.querySelector('#stop-btn') as HTMLButtonElement;
    const screenshotBtn = this.element.querySelector('#screenshot-btn') as HTMLButtonElement;
    const noteBtn = this.element.querySelector('#note-btn') as HTMLButtonElement;

    recordBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onRecordToggle?.();
    });

    stopBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onStop?.();
    });

    screenshotBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // 检查是否按住了Alt键
      if (e.altKey) {
        // Alt+点击：仅记录截图事件，不真正截图
        this.onScreenshotEventOnly?.();
      } else {
        // 普通点击：执行真正的截图
        this.onScreenshot?.();
      }
    });

    noteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onNote?.();
    });
  }

  private handleMouseDown(e: MouseEvent): void {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;

    this.isDragging = true;

    // 禁用过渡动画以实现即时跟随
    this.element.style.transition = 'none';

    // 计算鼠标相对于元素的偏移量
    const rect = this.element.getBoundingClientRect();
    this.offsetX = e.clientX - rect.left;
    this.offsetY = e.clientY - rect.top;

    this.element.style.cursor = 'grabbing';

    // 阻止默认行为
    e.preventDefault();
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    // 直接根据鼠标位置计算新位置
    let newLeft = e.clientX - this.offsetX;
    let newTop = e.clientY - this.offsetY;

    // 边界检查，确保不超出视窗
    newLeft = Math.max(0, Math.min(window.innerWidth - this.element.offsetWidth, newLeft));
    newTop = Math.max(0, Math.min(window.innerHeight - this.element.offsetHeight, newTop));

    // 立即更新位置
    this.element.style.left = newLeft + 'px';
    this.element.style.top = newTop + 'px';
    this.element.style.right = 'auto';
    this.element.style.bottom = 'auto';

    // 阻止默认行为
    e.preventDefault();
  }

  private handleMouseUp(): void {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.element.style.cursor = 'move';

    // 恢复过渡动画（仅用于非拖动状态下的其他动画）
    this.element.style.transition = 'box-shadow 0.2s ease';
  }

  public show(): void {
    this.isVisible = true;
    this.element.style.display = 'flex';
  }

  public hide(): void {
    this.isVisible = false;
    this.element.style.display = 'none';
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public updateRecordingState(isRecording: boolean, isPaused: boolean): void {
    const recordBtn = this.element.querySelector('#record-toggle') as HTMLButtonElement;
    const stopBtn = this.element.querySelector('#stop-btn') as HTMLButtonElement;
    const screenshotBtn = this.element.querySelector('#screenshot-btn') as HTMLButtonElement;

    if (isRecording) {
      recordBtn.innerHTML = isPaused ? this.getRecordIcon() : this.getPauseIcon();
      recordBtn.title = isPaused ? '继续录制' : '暂停录制';
      stopBtn.style.display = 'block';
      screenshotBtn.style.display = isPaused ? 'none' : 'block';
    } else {
      recordBtn.innerHTML = this.getRecordIcon();
      recordBtn.title = '开始录制';
      stopBtn.style.display = 'none';
      screenshotBtn.style.display = 'none';
    }
  }

  public showScreenshotFeedback(): void {
    const screenshotBtn = this.element.querySelector('#screenshot-btn') as HTMLButtonElement;
    const originalHTML = screenshotBtn.innerHTML;

    screenshotBtn.innerHTML = this.getCheckIcon();
    setTimeout(() => {
      screenshotBtn.innerHTML = this.getCameraIcon();
    }, 1000);
  }

  public setEventListeners(callbacks: {
    onRecordToggle?: () => void;
    onStop?: () => void;
    onScreenshot?: () => void;
    onScreenshotEventOnly?: () => void;
    onNote?: () => void;
  }): void {
    this.onRecordToggle = callbacks.onRecordToggle;
    this.onStop = callbacks.onStop;
    this.onScreenshot = callbacks.onScreenshot;
    this.onScreenshotEventOnly = callbacks.onScreenshotEventOnly;
    this.onNote = callbacks.onNote;
  }

  public destroy(): void {
    // 移除事件监听器
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);
    document.removeEventListener('mouseleave', this.boundMouseUp);

    this.element.remove();
  }

  private getRecordIcon(): string {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="8" cy="8" r="6" fill="#ff4757"/>
    </svg>`;
  }

  private getPauseIcon(): string {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="4" y="3" width="3" height="10" fill="#ffa502"/>
      <rect x="9" y="3" width="3" height="10" fill="#ffa502"/>
    </svg>`;
  }

  private getStopIcon(): string {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="3" y="3" width="10" height="10" fill="#ff4757"/>
    </svg>`;
  }

  private getCameraIcon(): string {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
      <circle cx="12" cy="13" r="3"/>
    </svg>`;
  }

  private getPenIcon(): string {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 21h18"/>
      <path d="M12.222 17.778l6.707-6.707a2.5 2.5 0 0 0 0-3.536l-.707-.707a2.5 2.5 0 0 0-3.536 0L8 13.515V17.5h3.985l.237-.222z"/>
      <path d="M15.5 8.5l3 3"/>
    </svg>`;
  }

  private getScreenshotIcon(): string {
    return this.getCameraIcon();
  }

  private getNoteIcon(): string {
    return this.getPenIcon();
  }

  private getCheckIcon(): string {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.5 4L6 11.5 2.5 8" stroke="#2ed573" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }
}
