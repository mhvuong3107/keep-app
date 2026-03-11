"use client";
import { Note } from "@/types/note";
import { use, useEffect, useState } from "react";
export default function Trash() {
    const [DeletedNotes, setDeletedNotes] = useState<Note[]>([]);
    return (
        <div className="space-y-6 columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-6">

            This is Trash page. Here you can see all the deleted notes and restore them or delete them permanently.
        </div>
    );
}
