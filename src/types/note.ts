export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  deleted?: boolean;
  archived: boolean;
}