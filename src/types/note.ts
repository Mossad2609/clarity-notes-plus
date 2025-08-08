export interface NoteVersion {
  id: string;
  title: string;
  contentHtml: string;
  timestamp: string;
}

export interface EncryptedBlob {
  iv: string; // base64
  salt: string; // base64
  data: string; // base64 ciphertext
}

export interface Note {
  id: string;
  title: string;
  contentHtml: string;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  tags: string[];
  summary?: string;
  encrypted?: boolean;
  encData?: EncryptedBlob; // when encrypted, plaintext should be sanitized on save
  versions?: NoteVersion[];
}
