import { 
  RecordEvent, 
  UserClickEvent, 
  UserInputEvent, 
  UrlChangeEvent, 
  ConsoleEvent, 
  XhrEvent, 
  ScreenshotEvent, 
  NoteEvent 
} from '../types';

export class MarkdownExporter {
  
  public exportToMarkdown(events: RecordEvent[]): string {
    if (!events || events.length === 0) {
      return '## 复现过程\n\n暂无录制内容';
    }

    let markdown = '## 复现过程\n\n';
    
    events.forEach((event, index) => {
      const eventMarkdown = this.formatEvent(event);
      if (eventMarkdown) {
        markdown += eventMarkdown + '\n';
      }
    });

    return markdown;
  }

  private formatEvent(event: RecordEvent): string {
    const timestamp = event.timestamp;
    
    switch (event.type) {
      case 'NOTE':
        return this.formatNoteEvent(timestamp, event.data as NoteEvent);
      
      case 'USER_CLICK':
        return this.formatUserClickEvent(timestamp, event.data as UserClickEvent);
      
      case 'USER_INPUT':
        return this.formatUserInputEvent(timestamp, event.data as UserInputEvent);
      
      case 'URL_CHANGE':
        return this.formatUrlChangeEvent(timestamp, event.data as UrlChangeEvent);
      
      case 'CONSOLE':
        return this.formatConsoleEvent(timestamp, event.data as ConsoleEvent);
      
      case 'XHR':
      case 'FETCH':
        return this.formatNetworkEvent(timestamp, event.data as XhrEvent, event.type);
      
      case 'SCREENSHOT':
        return this.formatScreenshotEvent(timestamp, event.data as ScreenshotEvent);
      
      default:
        return '';
    }
  }

  private formatNoteEvent(timestamp: string, data: NoteEvent): string {
    return `* 备注：${data.content}`;
  }

  private formatUserClickEvent(timestamp: string, data: UserClickEvent): string {
    let description = `用户点击了"${data.elementLabel || '未知元素'}"`;
    
    if (data.elementType.includes('button')) {
      description = `用户点击了"${data.elementLabel || '按钮'}"按钮`;
    } else if (data.elementType.includes('link')) {
      description = `用户点击了"${data.elementLabel || '链接'}"链接`;
    }

    let details = '';
    if (data.elementId) details += `, id为"${data.elementId}"`;
    if (data.elementClass) details += `, class为".${data.elementClass}"`;

    return `* ${timestamp} USER_CLICK ${description}${details}`;
  }

  private formatUserInputEvent(timestamp: string, data: UserInputEvent): string {
    let description = `用户在"${data.elementLabel || '输入框'}"中输入了内容`;
    
    if (data.elementType.includes('password')) {
      description = `用户在密码框中输入了内容`;
    } else if (data.elementType.includes('select')) {
      description = `用户选择了"${data.value}"`;
    }

    let details = '';
    if (data.elementId) details += `, id为"${data.elementId}"`;
    if (data.elementClass) details += `, class为".${data.elementClass}"`;
    if (!data.elementType.includes('password')) {
      details += `, 输入值为"${data.value}"`;
    }

    return `* ${timestamp} USER_INPUT ${description}${details}`;
  }

  private formatUrlChangeEvent(timestamp: string, data: UrlChangeEvent): string {
    return `* ${timestamp} URL_CHANGE 浏览器URL变更，原地址${data.from}，新地址${data.to}`;
  }

  private formatConsoleEvent(timestamp: string, data: ConsoleEvent): string {
    const level = data.level.toUpperCase();
    return `* ${timestamp} CONSOLE console日志类型:${level}, 日志内容：${data.message}`;
  }

  private formatNetworkEvent(timestamp: string, data: XhrEvent, type: string): string {
    const { request, response } = data;
    
    let markdown = `* ${timestamp} ${type.toUpperCase()}\n\n`;
    markdown += `Request:\n`;
    markdown += '```\n';
    markdown += `${request.method} ${this.extractPath(request.url)} HTTP/1.1\n`;
    
    Object.entries(request.headers).forEach(([key, value]) => {
      markdown += `${key}: ${value}\n`;
    });
    
    if (request.body) {
      markdown += `\n${request.body}\n`;
    }
    
    markdown += '```\n\n';
    
    if (response) {
      markdown += `Response (${response.status} ${response.statusText}):\n`;
      markdown += '```\n';
      
      if (response.body && !response.body.includes('[File Download - Content not recorded]')) {
        try {
          const parsedBody = JSON.parse(response.body);
          markdown += JSON.stringify(parsedBody, null, 2);
        } catch {
          markdown += response.body;
        }
      } else if (response.body) {
        markdown += response.body;
      }
      
      markdown += '\n```';
    }
    
    return markdown;
  }

  private formatScreenshotEvent(timestamp: string, data: ScreenshotEvent): string {
    if (data.dataUrl) {
      // 有实际图片数据的截图
      return `* ${timestamp} SCREENSHOT\n![](${data.dataUrl})`;
    } else {
      // 仅记录截图事件，无图片内容
      const note = data.note || '用户截图';
      return `* ${timestamp} SCREENSHOT ${note}`;
    }
  }

  private extractPath(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } catch {
      return url;
    }
  }

  public copyToClipboard(markdown: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(markdown)
          .then(() => resolve())
          .catch(reject);
      } else {
        this.fallbackCopyToClipboard(markdown);
        resolve();
      }
    });
  }

  private fallbackCopyToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }
    
    document.body.removeChild(textArea);
  }

  public downloadAsFile(markdown: string, filename: string = 'bug-report.md'): void {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  public generateSummary(events: RecordEvent[]): string {
    const summary = {
      totalEvents: events.length,
      userActions: 0,
      networkRequests: 0,
      screenshots: 0,
      notes: 0,
      consoleEvents: 0,
      urlChanges: 0
    };

    events.forEach(event => {
      switch (event.type) {
        case 'USER_CLICK':
        case 'USER_INPUT':
          summary.userActions++;
          break;
        case 'XHR':
        case 'FETCH':
          summary.networkRequests++;
          break;
        case 'SCREENSHOT':
          summary.screenshots++;
          break;
        case 'NOTE':
          summary.notes++;
          break;
        case 'CONSOLE':
          summary.consoleEvents++;
          break;
        case 'URL_CHANGE':
          summary.urlChanges++;
          break;
      }
    });

    const startTime = events.length > 0 ? events[0].timestamp : '';
    const endTime = events.length > 0 ? events[events.length - 1].timestamp : '';

    return `### 录制统计

* 录制时间：${startTime} - ${endTime}
* 总事件数：${summary.totalEvents}
* 用户操作：${summary.userActions}
* 网络请求：${summary.networkRequests}
* 截图数量：${summary.screenshots}
* 备注数量：${summary.notes}
* Console日志：${summary.consoleEvents}
* URL变化：${summary.urlChanges}

---

`;
  }
}