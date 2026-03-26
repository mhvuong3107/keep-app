import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export interface SerializableUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
}

interface AuthState {
    user: SerializableUser | null;
    loading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    loading: true,
    error: null,
};

export const loginWithGoogle = createAsyncThunk(
    "auth/loginWithGoogle",
    async (_, { rejectWithValue }) => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            const serializableUser: SerializableUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                emailVerified: user.emailVerified,
            };
            return serializableUser;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
        }
    }
);

export const logout = createAsyncThunk(
    "auth/logout",
    async (_, { rejectWithValue }) => {
        try {
            await signOut(auth);
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<SerializableUser | null>) => {
            state.user = action.payload;
            state.loading = false;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginWithGoogle.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginWithGoogle.fulfilled, (state, action) => {
                state.user = action.payload;
                state.loading = false;
                state.error = null;
            })
            .addCase(loginWithGoogle.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(logout.pending, (state) => {
                state.loading = true;
            })
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.loading = false;
                state.error = null;
            })
            .addCase(logout.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setUser, setLoading, setError } = authSlice.actions;
export default authSlice.reducer;