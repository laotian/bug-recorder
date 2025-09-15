export class FloatingBar {
  private element: HTMLDivElement;
  private isVisible: boolean = false;
  private isDragging: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private initialLeft: number = 0;
  private initialTop: number = 0;

  private onRecordToggle?: () => void;
  private onStop?: () => void;
  private onScreenshot?: () => void;
  private onNote?: () => void;

  constructor() {
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
        <button id="screenshot-btn" class="control-btn" title="截图" style="display: none;">
          ${this.getScreenshotIcon()}
        </button>
        <button id="note-btn" class="control-btn" title="添加备注">
          ${this.getNoteIcon()}
        </button>
      </div>
    `;
  }

  private getBarStyles(): string {
    return `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 8px;
      padding: 8px 12px;
      display: flex;
      gap: 8px;
      z-index: 999999;
      cursor: move;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      user-select: none;
    `;
  }

  private setupEventListeners(): void {
    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));

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
      this.onScreenshot?.();
    });

    noteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onNote?.();
    });
  }

  private handleMouseDown(e: MouseEvent): void {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    
    this.isDragging = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    
    const rect = this.element.getBoundingClientRect();
    this.initialLeft = rect.left;
    this.initialTop = rect.top;
    
    this.element.style.cursor = 'grabbing';
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this.startX;
    const deltaY = e.clientY - this.startY;
    
    const newLeft = Math.max(0, Math.min(window.innerWidth - this.element.offsetWidth, this.initialLeft + deltaX));
    const newTop = Math.max(0, Math.min(window.innerHeight - this.element.offsetHeight, this.initialTop + deltaY));
    
    this.element.style.left = newLeft + 'px';
    this.element.style.top = newTop + 'px';
    this.element.style.right = 'auto';
  }

  private handleMouseUp(): void {
    this.isDragging = false;
    this.element.style.cursor = 'move';
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
      screenshotBtn.innerHTML = originalHTML;
    }, 1000);
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

  public destroy(): void {
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
      <rect x="3" y="3" width="10" height="10" fill="#747d8c"/>
    </svg>`;
  }

  private getScreenshotIcon(): string {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="2" y="4" width="12" height="8" rx="1" stroke="#57606f" stroke-width="1.5" fill="none"/>
      <circle cx="8" cy="8" r="2" fill="#57606f"/>
      <path d="M4 4V3a1 1 0 011-1h6a1 1 0 011 1v1" stroke="#57606f" stroke-width="1.5" fill="none"/>
    </svg>`;
  }

  private getNoteIcon(): string {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3 2a1 1 0 011-1h8a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V2z" stroke="#57606f" stroke-width="1.5" fill="none"/>
      <path d="M5 5h6M5 8h6M5 11h4" stroke="#57606f" stroke-width="1.5"/>
    </svg>`;
  }

  private getCheckIcon(): string {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.5 4L6 11.5 2.5 8" stroke="#2ed573" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }
}