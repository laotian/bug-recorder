import { UrlChangeEvent } from '../types';

export class UrlChangeListener {
  private isListening: boolean = false;
  private currentUrl: string = '';
  private onUrlChange?: (data: UrlChangeEvent) => void;
  private originalPushState: typeof history.pushState;
  private originalReplaceState: typeof history.replaceState;

  constructor() {
    this.currentUrl = window.location.href;
    this.originalPushState = history.pushState.bind(history);
    this.originalReplaceState = history.replaceState.bind(history);
  }

  private popstateHandler = (event: PopStateEvent) => {
    if (!this.isListening) return;
    this.handleUrlChange();
  };

  private handleUrlChange(): void {
    const newUrl = window.location.href;
    if (newUrl !== this.currentUrl) {
      const urlChangeData: UrlChangeEvent = {
        from: this.currentUrl,
        to: newUrl
      };
      
      this.currentUrl = newUrl;
      this.onUrlChange?.(urlChangeData);
    }
  }

  private wrapHistoryMethod(method: 'pushState' | 'replaceState'): void {
    const original = method === 'pushState' ? this.originalPushState : this.originalReplaceState;
    
    (history as any)[method] = (...args: any[]) => {
      const result = original.apply(history, args as [data: any, unused: string, url?: string | URL | null]);
      if (this.isListening) {
        setTimeout(() => this.handleUrlChange(), 0);
      }
      return result;
    };
  }

  public startListening(): void {
    if (this.isListening) return;
    
    this.isListening = true;
    this.currentUrl = window.location.href;
    
    window.addEventListener('popstate', this.popstateHandler);
    
    this.wrapHistoryMethod('pushState');
    this.wrapHistoryMethod('replaceState');
  }

  public stopListening(): void {
    if (!this.isListening) return;
    
    this.isListening = false;
    window.removeEventListener('popstate', this.popstateHandler);
    
    history.pushState = this.originalPushState;
    history.replaceState = this.originalReplaceState;
  }

  public setEventListeners(callbacks: {
    onUrlChange?: (data: UrlChangeEvent) => void;
  }): void {
    this.onUrlChange = callbacks.onUrlChange;
  }

  public getCurrentUrl(): string {
    return this.currentUrl;
  }
}