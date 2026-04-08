'use client';
import { useState, useEffect, useRef } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import { User } from "@/types/user";

// Cache to store fetched collaborators
const collaboratorsCache = new Map<string, User[]>();

export const useCollaborators = (userIds: string[]) => {
    const [collaborators, setCollaborators] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    // Stringify userIds to create consistent cache key
    const userIdString = JSON.stringify([...userIds].sort());

    useEffect(() => {
        // Check if cached this exact query before
        if (collaboratorsCache.has(userIdString)) {
            setCollaborators(collaboratorsCache.get(userIdString) || []);
            return;
        }

        if (!userIds.length) {
            setCollaborators([]);
            return;
        }

        const fetchCollaborators = async () => {
            setLoading(true);
            try {
                // Firestore 'in' query supports up to 10 values
                const batches = [];
                for (let i = 0; i < userIds.length; i += 10) {
                    batches.push(userIds.slice(i, i + 10));
                }

                const allUsers: User[] = [];
                for (const batch of batches) {
                    const usersQuery = query(collection(db, "users"), where("uid", "in", batch));
                    const snapshot = await getDocs(usersQuery);
                    snapshot.docs.forEach((doc) => {
                        allUsers.push(doc.data() as User);
                    });
                }

                // Sort for consistent comparison later
                allUsers.sort((a, b) => (a.uid || "").localeCompare(b.uid || ""));

                // Cache the results
                collaboratorsCache.set(userIdString, allUsers);
                setCollaborators(allUsers);
            } catch (error) {
                console.error("Error fetching collaborators:", error);
                setCollaborators([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCollaborators();
    }, [userIdString, userIds.length]);

    return { collaborators, loading };
};
