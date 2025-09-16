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

  public async takeFullPageScreenshot(): Promise<string> {
    try {
      const originalScrollTop = window.scrollY;
      const originalScrollLeft = window.scrollX;

      try {
        // 预处理：标记有问题的图片
        // this.markProblematicImages();

        // 获取目标元素，如果指定了 screenshotElement 则使用该元素，否则使用 document.documentElement
        const targetElement = this.getTargetElement();

        // 对于全页截图，使用 document.documentElement 而不是 document.body
        const screenshotTarget = targetElement === document.body ? document.documentElement : targetElement;

        const dataUrl = await domToImage.toPng(screenshotTarget, {
          quality: 0.8,
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
            return !this.isRecorderElement(node) && !this.isProblematicElement(node);
          },
          imagePlaceholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmZmYiLz48L3N2Zz4=',
          cacheBust: true
        });

        const screenshotData: ScreenshotEvent = {
          dataUrl
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

  private isProblematicElement(element: HTMLElement): boolean {
    if (!element) return false;

    // 过滤可能引起CORS问题的图片
    if (element.tagName === 'IMG') {
      const img = element as HTMLImageElement;
      const src = img.src;

      // 跳过没有src或空src的图片
      if (!src || src === '' || src === '#') {
        return true;
      }

      // 只过滤没有设置crossOrigin的跨域图片
      if (src && !this.isSameDomain(src) && !img.crossOrigin) {
        // console.log('🚫 Cross-origin image without crossOrigin detected:', src.substring(0, 50) + '...');
        return true;
      }

      // 检查图片是否加载失败
      if (img.complete && img.naturalWidth === 0) {
        // console.log('🚫 Failed to load image:', src.substring(0, 50) + '...');
        return true;
      }

      // 检查图片的错误状态
      if ((img as any).__loadError) {
        return true;
      }
    }

    // 过滤iframe
    if (element.tagName === 'IFRAME') {
      return true;
    }

    // 过滤object和embed元素
    if (element.tagName === 'OBJECT' || element.tagName === 'EMBED') {
      return true;
    }

    // 过滤video和audio元素
    if (element.tagName === 'VIDEO' || element.tagName === 'AUDIO') {
      return true;
    }

    // 过滤canvas元素（可能有跨域问题）
    if (element.tagName === 'CANVAS') {
      try {
        const canvas = element as HTMLCanvasElement;
        // 尝试读取canvas数据，如果失败说明有跨域问题
        canvas.toDataURL();
      } catch (error) {
        return true;
      }
    }

    // 过滤svg元素中可能有问题的图片引用
    if (element.tagName === 'SVG') {
      const images = element.querySelectorAll('image');
      for (let i = 0; i < images.length; i++) {
        const svgImg = images[i];
        const href = svgImg.getAttribute('href') || svgImg.getAttribute('xlink:href');
        if (href && !this.isSameDomain(href)) {
          return true;
        }
      }
    }

    return false;
  }

  private isSameDomain(url: string): boolean {
    try {
      const urlObj = new URL(url, window.location.href);
      return urlObj.hostname === window.location.hostname;
    } catch {
      return false;
    }
  }

  private markProblematicImages(): void {
    const images = document.querySelectorAll('img');
    let markedCount = 0;

    images.forEach((img, index) => {
      let hasIssue = false;
      const issues: string[] = [];

      // 为加载失败的图片添加标记
      if (!img.complete || img.naturalWidth === 0) {
        (img as any).__loadError = true;
        hasIssue = true;
        issues.push('load-failed');
      }

      // 监听图片加载错误
      const errorHandler = () => {
        (img as any).__loadError = true;
        console.warn(`🖼️ Image error event fired:`, img.src);
      };

      img.addEventListener('error', errorHandler, { once: true });

      // 检查是否为跨域图片
      if (img.src && !this.isSameDomain(img.src)) {
        (img as any).__loadError = true;
        hasIssue = true;
        issues.push('cross-origin');
      }

      // 检查空或无效src
      if (!img.src || img.src === '' || img.src === '#') {
        hasIssue = true;
        issues.push('invalid-src');
      }

      if (hasIssue) {
        markedCount++;
        console.log(`🚨 Image ${index + 1}/${images.length} marked problematic:`, {
          src: img.src || '[empty]',
          issues: issues,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        });
      }
    });

    console.log(`📊 Marked ${markedCount}/${images.length} images as problematic`);
  }

}
