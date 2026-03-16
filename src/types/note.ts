export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  labelIds?: string[];
  pinned: boolean;
  deleted?: boolean;
  archived: boolean;
}