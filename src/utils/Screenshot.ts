import { ScreenshotEvent } from '../types';

declare const html2canvas: any;

export class Screenshot {
  private onScreenshot?: (data: ScreenshotEvent) => void;
  private screenshotElement?: string;

  private isRecorderElement(element: HTMLElement): boolean {
    if (element.id === 'bug-recorder-floating-bar' || 
        element.id === 'bug-recorder-note-input') {
      return true;
    }
    
    // 安全地检查className - 支持字符串和DOMTokenList
    const className = element.className;
    if (className) {
      const classStr = typeof className === 'string' ? className : String(className);
      if (classStr.includes('bug-recorder')) {
        return true;
      }
    }
    
    // 还要检查classList
    if (element.classList && element.classList.contains('bug-recorder')) {
      return true;
    }
    
    return false;
  }

  public async takeScreenshot(): Promise<string> {
    try {
      if (typeof html2canvas === 'undefined') {
        throw new Error('html2canvas is not available. Please include html2canvas library.');
      }

      // 获取目标元素，如果指定了 screenshotElement 则使用该元素，否则使用 document.body
      const targetElement = this.getTargetElement();
      
      const canvas = await html2canvas(targetElement, {
        useCORS: true,
        allowTaint: true,
        scale: 0.8,
        height: targetElement === document.body ? window.innerHeight : targetElement.scrollHeight,
        width: targetElement === document.body ? window.innerWidth : targetElement.scrollWidth,
        scrollX: 0,
        scrollY: 0,
        ignoreElements: (element: HTMLElement) => {
          return this.isRecorderElement(element);
        }
      });

      const dataUrl = canvas.toDataURL('image/png', 0.8);
      
      const screenshotData: ScreenshotEvent = {
        dataUrl
      };

      this.onScreenshot?.(screenshotData);
      
      return dataUrl;
    } catch (error) {
      console.error('Screenshot failed:', error);
      throw error;
    }
  }

  public async takeViewportScreenshot(): Promise<string> {
    try {
      if (typeof html2canvas === 'undefined') {
        throw new Error('html2canvas is not available. Please include html2canvas library.');
      }

      // 获取目标元素，如果指定了 screenshotElement 则使用该元素，否则使用 document.documentElement
      const targetElement = this.getTargetElement() || document.documentElement;
      
      const canvas = await html2canvas(targetElement, {
        useCORS: true,
        allowTaint: true,
        scale: 0.8,
        height: targetElement === document.documentElement ? window.innerHeight : Math.min(targetElement.scrollHeight, window.innerHeight),
        width: targetElement === document.documentElement ? window.innerWidth : Math.min(targetElement.scrollWidth, window.innerWidth),
        x: targetElement === document.documentElement ? window.scrollX : 0,
        y: targetElement === document.documentElement ? window.scrollY : 0,
        scrollX: 0,
        scrollY: 0,
        ignoreElements: (element: HTMLElement) => {
          return this.isRecorderElement(element);
        }
      });

      const dataUrl = canvas.toDataURL('image/png', 0.8);
      
      const screenshotData: ScreenshotEvent = {
        dataUrl
      };

      this.onScreenshot?.(screenshotData);
      
      return dataUrl;
    } catch (error) {
      console.error('Viewport screenshot failed:', error);
      throw error;
    }
  }

  public async takeFullPageScreenshot(): Promise<string> {
    try {
      if (typeof html2canvas === 'undefined') {
        throw new Error('html2canvas is not available. Please include html2canvas library.');
      }

      const originalScrollTop = window.scrollY;
      const originalScrollLeft = window.scrollX;

      try {
        // 获取目标元素，如果指定了 screenshotElement 则使用该元素，否则使用 document.body
        const targetElement = this.getTargetElement();
        
        const canvas = await html2canvas(targetElement, {
          useCORS: true,
          allowTaint: true,
          scale: 0.6,
          height: targetElement === document.body ? document.body.scrollHeight : targetElement.scrollHeight,
          width: targetElement === document.body ? document.body.scrollWidth : targetElement.scrollWidth,
          scrollX: 0,
          scrollY: 0,
          ignoreElements: (element: HTMLElement) => {
            return this.isRecorderElement(element);
          }
        });

        const dataUrl = canvas.toDataURL('image/png', 0.7);
        
        const screenshotData: ScreenshotEvent = {
          dataUrl
        };

        this.onScreenshot?.(screenshotData);
        
        return dataUrl;
      } finally {
        window.scrollTo(originalScrollLeft, originalScrollTop);
      }
    } catch (error) {
      console.error('Full page screenshot failed:', error);
      throw error;
    }
  }

  public setEventListeners(callbacks: {
    onScreenshot?: (data: ScreenshotEvent) => void;
  }): void {
    this.onScreenshot = callbacks.onScreenshot;
  }

  public setScreenshotElement(selector?: string): void {
    this.screenshotElement = selector;
  }

  private getTargetElement(): HTMLElement {
    if (this.screenshotElement) {
      try {
        const element = document.querySelector(this.screenshotElement) as HTMLElement;
        if (element) {
          return element;
        } else {
          console.warn(`Screenshot target element not found: ${this.screenshotElement}, falling back to document.body`);
        }
      } catch (error) {
        console.warn(`Invalid CSS selector: ${this.screenshotElement}, falling back to document.body`);
      }
    }
    return document.body;
  }

  public static isHtml2CanvasAvailable(): boolean {
    return typeof html2canvas !== 'undefined';
  }

  public static async loadHtml2Canvas(): Promise<void> {
    if (this.isHtml2CanvasAvailable()) {
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load html2canvas'));
      document.head.appendChild(script);
    });
  }

  public dataUrlToBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  }

  public downloadScreenshot(dataUrl: string, filename: string = 'screenshot.png'): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public copyToClipboard(dataUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const blob = this.dataUrlToBlob(dataUrl);
        
        if (navigator.clipboard && navigator.clipboard.write) {
          const clipboardItem = new ClipboardItem({
            [blob.type]: blob
          });
          
          navigator.clipboard.write([clipboardItem])
            .then(() => resolve())
            .catch(reject);
        } else {
          reject(new Error('Clipboard API not supported'));
        }
      } catch (error) {
        reject(error);
      }
    });
  }
}