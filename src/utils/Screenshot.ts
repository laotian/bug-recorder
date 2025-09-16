import { ScreenshotEvent } from '../types';
import * as domToImage from 'dom-to-image';

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
      // 获取目标元素，如果指定了 screenshotElement 则使用该元素，否则使用 document.body
      const targetElement = this.getTargetElement();
      
      const dataUrl = await domToImage.toPng(targetElement, {
        quality: 1.0,
        bgcolor: '#ffffff',
        width: targetElement === document.body ? window.innerWidth : targetElement.scrollWidth,
        height: targetElement === document.body ? window.innerHeight : targetElement.scrollHeight,
        style: {
          // 确保输入框文本正确显示
          transform: 'scale(1)',
          transformOrigin: 'top left'
        },
        filter: (node: HTMLElement) => {
          // 过滤掉录制器相关元素
          return !this.isRecorderElement(node);
        }
      });
      
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
      // 获取目标元素，如果指定了 screenshotElement 则使用该元素，否则使用 document.documentElement
      const targetElement = this.getTargetElement() || document.documentElement;
      
      const dataUrl = await domToImage.toPng(targetElement, {
        quality: 1.0,
        bgcolor: '#ffffff',
        width: targetElement === document.documentElement ? window.innerWidth : Math.min(targetElement.scrollWidth, window.innerWidth),
        height: targetElement === document.documentElement ? window.innerHeight : Math.min(targetElement.scrollHeight, window.innerHeight),
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        },
        filter: (node: HTMLElement) => {
          return !this.isRecorderElement(node);
        }
      });
      
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
      const originalScrollTop = window.scrollY;
      const originalScrollLeft = window.scrollX;

      try {
        // 获取目标元素，如果指定了 screenshotElement 则使用该元素，否则使用 document.documentElement
        const targetElement = this.getTargetElement();
        
        // 对于全页截图，使用 document.documentElement 而不是 document.body
        const screenshotTarget = targetElement === document.body ? document.documentElement : targetElement;
        
        const dataUrl = await domToImage.toPng(screenshotTarget, {
          quality: 1.0,
          bgcolor: '#ffffff',
          width: screenshotTarget === document.documentElement ? 
            Math.max(document.body.scrollWidth, document.body.offsetWidth, 
                    document.documentElement.clientWidth, document.documentElement.scrollWidth, 
                    document.documentElement.offsetWidth) : 
            targetElement.scrollWidth,
          height: screenshotTarget === document.documentElement ? 
            Math.max(document.body.scrollHeight, document.body.offsetHeight, 
                    document.documentElement.clientHeight, document.documentElement.scrollHeight, 
                    document.documentElement.offsetHeight) : 
            targetElement.scrollHeight,
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left'
          },
          filter: (node: HTMLElement) => {
            return !this.isRecorderElement(node);
          }
        });
        
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

  public static isDomToImageAvailable(): boolean {
    return typeof domToImage !== 'undefined';
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