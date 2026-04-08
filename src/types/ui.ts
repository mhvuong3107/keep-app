import { User } from "./user";
import { Label }  from "./label";

export interface NoteUI {
  id: string;
  title: string;
  color: string;
  pinned: boolean;
  archived: boolean;
  collaborators: User[];
  labels: Label[];
}
