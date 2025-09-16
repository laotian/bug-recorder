export class KeyboardShortcuts {
  private isListening: boolean = false;
  private onToggleVisibility?: () => void;
  private currentKeys: Set<string> = new Set();

  private keydownHandler = (event: KeyboardEvent) => {
    if (!this.isListening) return;

    this.currentKeys.add(event.code);

    if (this.isShortcutPressed(['ControlLeft', 'ShiftLeft', 'AltLeft', 'KeyR']) ||
        this.isShortcutPressed(['ControlRight', 'ShiftRight', 'AltRight', 'KeyR'])) {

      event.preventDefault();
      event.stopPropagation();
      this.onToggleVisibility?.();
    }
  };

  private keyupHandler = (event: KeyboardEvent) => {
    this.currentKeys.delete(event.code);
  };

  private isShortcutPressed(keys: string[]): boolean {
    return keys.every(key => this.currentKeys.has(key)) && this.currentKeys.size === keys.length;
  }

  public startListening(): void {
    if (this.isListening) return;

    this.isListening = true;
    document.addEventListener('keydown', this.keydownHandler, true);
    document.addEventListener('keyup', this.keyupHandler, true);
  }

  public stopListening(): void {
    if (!this.isListening) return;

    this.isListening = false;
    document.removeEventListener('keydown', this.keydownHandler, true);
    document.removeEventListener('keyup', this.keyupHandler, true);
    this.currentKeys.clear();
  }

  public setEventListeners(callbacks: {
    onToggleVisibility?: () => void;
  }): void {
    this.onToggleVisibility = callbacks.onToggleVisibility;
  }

  public static getShortcutDescription(): string {
    return 'Ctrl + Alt + R';
  }
}
