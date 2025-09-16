import { RecordState, RecordEvent, EventType } from '../types';

export class RecordManager {
  private state: RecordState;
  private listeners: Map<EventType, Function[]> = new Map();

  constructor() {
    this.state = {
      isRecording: false,
      isPaused: false,
      events: []
    };
  }

  public startRecording(): void {
    this.state.isRecording = true;
    this.state.isPaused = false;
    this.state.events = [];
    this.emit('record-start');
  }

  public pauseRecording(): void {
    if (!this.state.isRecording) return;
    this.state.isPaused = true;
    this.emit('record-pause');
  }

  public resumeRecording(): void {
    if (!this.state.isRecording) return;
    this.state.isPaused = false;
    this.emit('record-resume');
  }

  public stopRecording(): RecordEvent[] {
    if (!this.state.isRecording) return [];
    
    const events = [...this.state.events];
    this.state.isRecording = false;
    this.state.isPaused = false;
    this.state.events = [];
    
    this.emit('record-stop', events);
    return events;
  }

  public toggleRecording(): void {
    if (!this.state.isRecording) {
      this.startRecording();
    } else if (this.state.isPaused) {
      this.resumeRecording();
    } else {
      this.pauseRecording();
    }
  }

  public addEvent(type: EventType, data: any): void {
    if (!this.state.isRecording || this.state.isPaused) return;

    const event: RecordEvent = {
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type,
      data
    };

    this.state.events.push(event);
    this.emit('event-added', event);
  }

  public getState(): RecordState {
    return { ...this.state };
  }

  public isRecording(): boolean {
    return this.state.isRecording && !this.state.isPaused;
  }

  public isPaused(): boolean {
    return this.state.isPaused;
  }

  public isActive(): boolean {
    return this.state.isRecording;
  }

  public on(eventType: string, callback: Function): void {
    if (!this.listeners.has(eventType as EventType)) {
      this.listeners.set(eventType as EventType, []);
    }
    this.listeners.get(eventType as EventType)!.push(callback);
  }

  public off(eventType: string, callback: Function): void {
    const callbacks = this.listeners.get(eventType as EventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(eventType: string, ...args: any[]): void {
    const callbacks = this.listeners.get(eventType as EventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error('Error in RecordManager event callback:', error);
        }
      });
    }
  }

  public getEventCount(): number {
    return this.state.events.length;
  }

  public clearEvents(): void {
    this.state.events = [];
  }

  public getEvents(): RecordEvent[] {
    return [...this.state.events];
  }
}
