import { XhrEvent, NetworkRequest, NetworkResponse } from '../types';

export class NetworkListener {
  private isListening: boolean = false;
  private onNetworkRequest?: (data: XhrEvent) => void;
  private originalXhrOpen: typeof XMLHttpRequest.prototype.open;
  private originalXhrSend: typeof XMLHttpRequest.prototype.send;
  private originalFetch: typeof fetch;
  private ignoreRequestUrls: (string | RegExp)[] = [];

  constructor() {
    this.originalXhrOpen = XMLHttpRequest.prototype.open;
    this.originalXhrSend = XMLHttpRequest.prototype.send;
    this.originalFetch = window.fetch;
  }

  public startListening(): void {
    if (this.isListening) return;

    this.isListening = true;
    this.interceptXHR();
    this.interceptFetch();
  }

  public stopListening(): void {
    if (!this.isListening) return;

    this.isListening = false;
    XMLHttpRequest.prototype.open = this.originalXhrOpen;
    XMLHttpRequest.prototype.send = this.originalXhrSend;
    window.fetch = this.originalFetch;
  }

  private interceptXHR(): void {
    const self = this;

    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
      (this as any).__method = method;
      (this as any).__url = url.toString();
      (this as any).__requestHeaders = {};

      return self.originalXhrOpen.apply(this, [method, url, ...args] as any);
    };

    XMLHttpRequest.prototype.send = function(body?: any) {
      if (!self.isListening) {
        return self.originalXhrSend.apply(this, [body]);
      }

      const xhr = this;
      const method = (xhr as any).__method || 'GET';
      const url = (xhr as any).__url || '';
      const requestHeaders = (xhr as any).__requestHeaders || {};

      const originalSetRequestHeader = xhr.setRequestHeader;
      xhr.setRequestHeader = function(header: string, value: string) {
        requestHeaders[header] = value;
        return originalSetRequestHeader.apply(this, [header, value]);
      };

      const originalOnReadyStateChange = xhr.onreadystatechange;
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          self.handleXHRResponse(method, url, requestHeaders, body, xhr);
        }

        if (originalOnReadyStateChange) {
          originalOnReadyStateChange.apply(this, arguments as any);
        }
      };

      return self.originalXhrSend.apply(this, [body]);
    };
  }

  private interceptFetch(): void {
    const self = this;

    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
      if (!self.isListening) {
        return self.originalFetch.apply(this, [input, init]);
      }

      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method || 'GET';
      const headers = self.extractHeaders(init?.headers || {});
      const body = init?.body;

      try {
        const response = await self.originalFetch.apply(this, [input, init]);
        const clonedResponse = response.clone();

        self.handleFetchResponse(method, url, headers, body, clonedResponse);

        return response;
      } catch (error) {
        self.handleFetchError(method, url, headers, body, error);
        throw error;
      }
    };
  }

  private async handleXHRResponse(
    method: string,
    url: string,
    requestHeaders: Record<string, string>,
    requestBody: any,
    xhr: XMLHttpRequest
  ): Promise<void> {
    try {
      // 检查是否应该忽略此URL
      if (this.shouldIgnoreUrl(url)) {
        return;
      }

      const responseHeaders = this.parseXHRResponseHeaders(xhr.getAllResponseHeaders());

      const request: NetworkRequest = {
        method: method.toUpperCase(),
        url,
        headers: requestHeaders,
        body: this.serializeRequestBody(requestBody, url)
      };

      const response: NetworkResponse = {
        status: xhr.status,
        statusText: xhr.statusText,
        headers: responseHeaders,
        body: this.serializeResponseBody(xhr.responseText, url, xhr.status)
      };

      const networkData: XhrEvent = {
        request,
        response
      };

      this.onNetworkRequest?.(networkData);
    } catch (error) {
      console.error('Error handling XHR response:', error);
    }
  }

  private async handleFetchResponse(
    method: string,
    url: string,
    requestHeaders: Record<string, string>,
    requestBody: any,
    response: Response
  ): Promise<void> {
    try {
      // 检查是否应该忽略此URL
      if (this.shouldIgnoreUrl(url)) {
        return;
      }

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let responseBody = '';
      try {
        responseBody = await response.text();
      } catch (error) {
        responseBody = '[Unable to read response body]';
      }

      const request: NetworkRequest = {
        method: method.toUpperCase(),
        url,
        headers: requestHeaders,
        body: this.serializeRequestBody(requestBody, url)
      };

      const networkResponse: NetworkResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: this.serializeResponseBody(responseBody, url, response.status)
      };

      const networkData: XhrEvent = {
        request,
        response: networkResponse
      };

      this.onNetworkRequest?.(networkData);
    } catch (error) {
      console.error('Error handling Fetch response:', error);
    }
  }

  private handleFetchError(
    method: string,
    url: string,
    requestHeaders: Record<string, string>,
    requestBody: any,
    error: any
  ): void {
    try {
      // 检查是否应该忽略此URL
      if (this.shouldIgnoreUrl(url)) {
        return;
      }

      const request: NetworkRequest = {
        method: method.toUpperCase(),
        url,
        headers: requestHeaders,
        body: this.serializeRequestBody(requestBody, url)
      };

      const response: NetworkResponse = {
        status: 0,
        statusText: 'Network Error',
        headers: {},
        body: `Error: ${error.message || error}`
      };

      const networkData: XhrEvent = {
        request,
        response
      };

      this.onNetworkRequest?.(networkData);
    } catch (e) {
      console.error('Error handling Fetch error:', e);
    }
  }

  private extractHeaders(headers: HeadersInit): Record<string, string> {
    const result: Record<string, string> = {};

    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        result[key] = value;
      });
    } else if (Array.isArray(headers)) {
      headers.forEach(([key, value]) => {
        result[key] = value;
      });
    } else if (headers && typeof headers === 'object') {
      Object.entries(headers).forEach(([key, value]) => {
        result[key] = value;
      });
    }

    return result;
  }

  private parseXHRResponseHeaders(headersStr: string): Record<string, string> {
    const headers: Record<string, string> = {};
    if (!headersStr) return headers;

    headersStr.split('\r\n').forEach(line => {
      const parts = line.split(': ');
      if (parts.length === 2) {
        headers[parts[0].toLowerCase()] = parts[1];
      }
    });

    return headers;
  }

  private serializeRequestBody(body: any, url: string): string | undefined {
    if (!body) return undefined;

    if (this.isFileUpload(body)) {
      return '[File Upload - Content not recorded]';
    }

    if (typeof body === 'string') {
      return body;
    }

    if (body instanceof FormData) {
      const entries: string[] = [];
      for (const [key, value] of (body as any).entries()) {
        if (value instanceof File) {
          entries.push(`${key}: [File: ${value.name}]`);
        } else {
          entries.push(`${key}: ${value}`);
        }
      }
      return entries.join('\n');
    }

    if (body instanceof URLSearchParams) {
      return body.toString();
    }

    try {
      return JSON.stringify(body);
    } catch {
      return String(body);
    }
  }

  private serializeResponseBody(body: string, url: string, status: number): string | undefined {
    if (!body) return undefined;

    if (this.isFileDownload(url, body)) {
      return '[File Download - Content not recorded]';
    }

    if (body.length > 10000) {
      return body.substring(0, 10000) + '... [Truncated]';
    }

    return body;
  }

  private isFileUpload(body: any): boolean {
    return body instanceof FormData || body instanceof File || body instanceof Blob;
  }

  private isFileDownload(url: string, responseBody: string): boolean {
    const fileExtensions = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|tar|gz|jpg|jpeg|png|gif|bmp|mp4|mp3|avi|mov)$/i;
    const urlString = typeof url === 'string' ? url : String(url);
    const hasFileExtension = fileExtensions.test(urlString);
    const isLargeNonJSON = responseBody && responseBody.length > 50000 && !this.isJSON(responseBody);
    return hasFileExtension || Boolean(isLargeNonJSON);
  }

  private isJSON(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  public setEventListeners(callbacks: {
    onNetworkRequest?: (data: XhrEvent) => void;
  }): void {
    this.onNetworkRequest = callbacks.onNetworkRequest;
  }

  public setIgnoreRequestUrls(urls: (string | RegExp)[]): void {
    this.ignoreRequestUrls = urls || [];
  }

  private shouldIgnoreUrl(url: string): boolean {
    return this.ignoreRequestUrls.some(pattern => {
      if (typeof pattern === 'string') {
        return url.includes(pattern);
      } else if (pattern instanceof RegExp) {
        return pattern.test(url);
      }
      return false;
    });
  }
}
