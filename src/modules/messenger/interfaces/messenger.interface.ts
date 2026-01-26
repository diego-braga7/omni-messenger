export interface ISendTextOptions {
  delayMessage?: number;
  delayTyping?: number;
}

export interface ISendDocumentOptions {
  caption?: string;
  delayMessage?: number;
}

export interface IOptionRow {
  id: string;
  title: string;
  description?: string;
}

export interface IOptionSection {
  title: string;
  rows: IOptionRow[];
}

export interface ISendOptionListOptions {
  title?: string;
  footer?: string;
  buttonLabel?: string;
}

export interface IButton {
  id: string;
  label: string;
}

export interface ISendButtonListOptions {
  title?: string;
  footer?: string;
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
  sendOptionList(
    to: string,
    message: string,
    sections: IOptionSection[],
    options?: ISendOptionListOptions,
  ): Promise<any>;
  sendButtonList(
    to: string,
    message: string,
    buttons: IButton[],
    options?: ISendButtonListOptions,
  ): Promise<any>;
}
