import { Skeleton } from "@/components/ui/skeleton";

export function NotesSkeleton() {
    return (
        <div className="space-y-6">
            {/* Input skeleton */}
            <div className="space-y-2">
                <Skeleton className="w-full h-20 rounded-lg" />
            </div>

            {/* Pinned section */}
            <div>
                <Skeleton className="w-20 h-4 mb-3 px-2" />
                <div className="keep-masonry">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div key={`pinned-${i}`} className="keep-masonry-item">
                            <Skeleton className="w-full h-40 rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Other notes section */}
            <div>
                <Skeleton className="w-20 h-4 mb-3 px-2" />
                <div className="keep-masonry">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={`note-${i}`} className="keep-masonry-item">
                            <Skeleton className="w-full h-40 rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
