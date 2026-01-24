export interface Attachment {
  id: string;
  type: 'image' | 'pdf' | 'file';
  name: string;
  mimeType: string;
  size: number;
  base64: string;       // Base64 编码的文件内容
  previewUrl?: string;  // 用于预览的 Data URL
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
  reasoning?: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  preview: string;
  updatedAt: Date;
}
