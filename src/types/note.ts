export interface Note {
  id: string;
  title: string;
  contentHtml: string;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  tags: string[];
  summary?: string;
}
