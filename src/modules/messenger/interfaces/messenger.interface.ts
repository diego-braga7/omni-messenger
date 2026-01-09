export interface ISendTextOptions {
  delayMessage?: number;
  delayTyping?: number;
}

export interface ISendDocumentOptions {
  caption?: string;
  delayMessage?: number;
}

export interface IMessengerProvider {
  sendText(
    to: string,
    message: string,
    options?: ISendTextOptions,
  ): Promise<any>;
  sendDocument(
    to: string,
    documentUrl: string,
    fileName: string,
    extension: string,
    options?: ISendDocumentOptions,
  ): Promise<any>;
}
