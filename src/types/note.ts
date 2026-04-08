export interface Note {
  id: string;
  title: string;
  color: string;
  labelIds?: string[];
  pinned: boolean;
  deleted?: boolean;
  archived: boolean;
  ownerId: string;
  memberIds?: string[];
  createdAt?: string;
  updatedAt?: string;
  order?: number;
  ydoc?: number[];
  contentPreview?: string;
}

export interface FirestoreNote {
  id: string;

  title: string;
  color: string;

  ownerId: string;
  memberIds: string[];

  ydoc?: number[];
  contentPreview: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface UserNoteMeta {
  id: string;
  userId: string;
  noteId: string;
  pinned: boolean;
  archived: boolean;
  deleted: boolean;
  labelIds: string[];
  order: number;
}
