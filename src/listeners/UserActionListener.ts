import { UserClickEvent, UserInputEvent } from '../types';

export class UserActionListener {
  private isListening: boolean = false;
  private onUserClick?: (data: UserClickEvent) => void;
  private onUserInput?: (data: UserInputEvent) => void;

  private clickHandler = (event: MouseEvent) => {
    if (!this.isListening) return;
    
    const target = event.target as HTMLElement;
    if (!target || this.isRecorderElement(target)) return;

    const clickData: UserClickEvent = {
      elementId: target.id || undefined,
      elementName: target.getAttribute('name') || undefined,
      elementClass: target.className || undefined,
      elementType: this.getElementType(target),
      elementLabel: this.getElementLabel(target),
      xpath: this.generateXPath(target)
    };

    this.onUserClick?.(clickData);
  };

  private inputHandler = (event: Event) => {
    if (!this.isListening) return;
    
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    if (!target || this.isRecorderElement(target)) return;

    if (target.type === 'password') return;

    const inputData: UserInputEvent = {
      elementId: target.id || undefined,
      elementName: target.getAttribute('name') || undefined,
      elementClass: target.className || undefined,
      elementType: this.getElementType(target),
      value: target.value,
      xpath: this.generateXPath(target)
    };

    this.onUserInput?.(inputData);
  };

  private changeHandler = (event: Event) => {
    if (!this.isListening) return;
    
    const target = event.target as HTMLSelectElement;
    if (!target || this.isRecorderElement(target)) return;

    const inputData: UserInputEvent = {
      elementId: target.id || undefined,
      elementName: target.getAttribute('name') || undefined,
      elementClass: target.className || undefined,
      elementType: this.getElementType(target),
      value: target.value,
      xpath: this.generateXPath(target)
    };

    this.onUserInput?.(inputData);
  };

  public startListening(): void {
    if (this.isListening) return;
    
    this.isListening = true;
    document.addEventListener('click', this.clickHandler, true);
    document.addEventListener('input', this.inputHandler, true);
    document.addEventListener('change', this.changeHandler, true);
  }

  public stopListening(): void {
    if (!this.isListening) return;
    
    this.isListening = false;
    document.removeEventListener('click', this.clickHandler, true);
    document.removeEventListener('input', this.inputHandler, true);
    document.removeEventListener('change', this.changeHandler, true);
  }

  public setEventListeners(callbacks: {
    onUserClick?: (data: UserClickEvent) => void;
    onUserInput?: (data: UserInputEvent) => void;
  }): void {
    this.onUserClick = callbacks.onUserClick;
    this.onUserInput = callbacks.onUserInput;
  }

  private isRecorderElement(element: HTMLElement): boolean {
    let current: HTMLElement | null = element;
    while (current) {
      if (current.id === 'bug-recorder-floating-bar' || 
          current.id === 'bug-recorder-note-input') {
        return true;
      }
      
      // 安全地检查className - 支持字符串和DOMTokenList
      const className = current.className;
      if (className) {
        const classStr = typeof className === 'string' ? className : String(className);
        if (classStr.includes('bug-recorder')) {
          return true;
        }
      }
      
      // 还要检查classList
      if (current.classList && current.classList.contains('bug-recorder')) {
        return true;
      }
      
      current = current.parentElement;
    }
    return false;
  }

  private getElementType(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();
    
    if (tagName === 'input') {
      const inputType = (element as HTMLInputElement).type || 'text';
      return `input[${inputType}]`;
    }
    
    if (tagName === 'button') {
      return 'button';
    }
    
    if (tagName === 'a') {
      return 'link';
    }
    
    if (tagName === 'select') {
      return 'select';
    }
    
    if (tagName === 'textarea') {
      return 'textarea';
    }
    
    if (element.onclick || element.getAttribute('onclick')) {
      return `${tagName}[clickable]`;
    }
    
    return tagName;
  }

  private getElementLabel(element: HTMLElement): string | undefined {
    const textContent = element.textContent?.trim();
    if (textContent && textContent.length < 50) {
      return textContent;
    }

    const placeholder = element.getAttribute('placeholder');
    if (placeholder) {
      return `placeholder: ${placeholder}`;
    }

    const title = element.getAttribute('title');
    if (title) {
      return `title: ${title}`;
    }

    const alt = element.getAttribute('alt');
    if (alt) {
      return `alt: ${alt}`;
    }

    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      return `aria-label: ${ariaLabel}`;
    }

    const value = (element as HTMLInputElement).value;
    if (value && value.length < 50) {
      return `value: ${value}`;
    }

    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) {
      return `label: ${label.textContent?.trim()}`;
    }

    return undefined;
  }

  private generateXPath(element: HTMLElement): string {
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }
    
    const path: string[] = [];
    let current: HTMLElement | null = element;
    
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      const tagName = current.tagName.toLowerCase();
      const parent: HTMLElement | null = current.parentElement;
      
      if (!parent) {
        path.unshift(tagName);
        break;
      }
      
      const siblings = Array.from(parent.children as HTMLCollectionOf<Element>).filter((child: Element) => 
        child.tagName.toLowerCase() === tagName
      );
      
      if (siblings.length === 1) {
        path.unshift(tagName);
      } else {
        const index = siblings.indexOf(current) + 1;
        path.unshift(`${tagName}[${index}]`);
      }
      
      current = parent;
    }
    
    return '/' + path.join('/');
  }
}