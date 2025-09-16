import { ScreenshotEvent } from '../types';

declare const html2canvas: any;

export class Screenshot {
  private onScreenshot?: (data: ScreenshotEvent) => void;

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

      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 0.8,
        height: window.innerHeight,
        width: window.innerWidth,
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

      const canvas = await html2canvas(document.documentElement, {
        useCORS: true,
        allowTaint: true,
        scale: 0.8,
        height: window.innerHeight,
        width: window.innerWidth,
        x: window.scrollX,
        y: window.scrollY,
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
        const canvas = await html2canvas(document.body, {
          useCORS: true,
          allowTaint: true,
          scale: 0.6,
          height: document.body.scrollHeight,
          width: document.body.scrollWidth,
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