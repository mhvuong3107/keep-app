// types/ui.ts

import { User } from "./user";
import { Label }  from "./label";

export interface NoteUI {
  id: string;

  title: string;
  color: string;

  pinned: boolean;
  archived: boolean;

  // 👥 đã map user
  collaborators: User[];

  // 🏷️ đã map label
  labels: Label[];
}