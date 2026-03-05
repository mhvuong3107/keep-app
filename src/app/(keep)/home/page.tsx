"use client";
import NoteInput from "@/components/keep/NoteInput";
import NoteCard from "@/components/keep/NoteCard";

export default function Home() {
    return (
        <div className="space-y-6">
            <NoteInput />
            <NoteCard />
        </div>
    );
}
