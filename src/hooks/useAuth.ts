import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { setUser, SerializableUser } from '@/lib/features/authSlice';
import { AppDispatch, RootState } from '@/lib/store';

export const useAuth = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user, loading, error } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
            if (user) {
                // Convert Firebase User to serializable object
                const serializableUser: SerializableUser = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    emailVerified: user.emailVerified,
                };
                dispatch(setUser(serializableUser));
            } else {
                dispatch(setUser(null));
            }
        });

        return () => unsubscribe();
    }, [dispatch]);

    return { user, loading, error };
};