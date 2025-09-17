import { ScreenshotEvent } from '../types';
import { domToPng } from 'modern-screenshot';

export class Screenshot {
  private onScreenshot?: (data: ScreenshotEvent) => void;
  private screenshotElement?: string;

  public async takeFullPageScreenshot(): Promise<string> {
    try {
      const originalScrollTop = window.scrollY;
      const originalScrollLeft = window.scrollX;

      try {
        // 获取目标元素，如果指定了 screenshotElement 则使用该元素，否则使用 document.documentElement
        const targetElement = this.getTargetElement();

        // 对于全页截图，使用 document.documentElement 而不是 document.body
        const screenshotTarget = targetElement === document.body ? document.documentElement : targetElement;

        const dataUrl = await domToPng(screenshotTarget, {
          backgroundColor: '#ffffff'
        });

        const screenshotData: ScreenshotEvent = {
          dataUrl,
          type: 'auto'
        };

        this.onScreenshot?.(screenshotData);

        return dataUrl;
      } finally {
        window.scrollTo(originalScrollLeft, originalScrollTop);
      }
    } catch (error: any) {
      console.error('Full page screenshot failed:', error, error.message);
      // 尝试简化版截图
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

}
