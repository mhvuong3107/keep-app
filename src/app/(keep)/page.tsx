"use client";
import NoteInput from "@/components/keep/NoteInput";
import NoteCard from "@/components/keep/NoteCard";

export default function Home() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Notes</h1>
            <NoteInput />
            <NoteCard />
        </div>
    );
}
