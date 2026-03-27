'use client';

import { useDispatch, useSelector } from 'react-redux';
import { loginWithGoogle, logout } from '@/lib/features/authSlice';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { AppDispatch, RootState } from '@/lib/store';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar';

export const AuthButton = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user, loading } = useAuth();
    const authError = useSelector((state: RootState) => state.auth.error);

    const handleLogin = () => {
        dispatch(loginWithGoogle());
    };

    const handleLogout = () => {
        dispatch(logout());
    };

    if (loading) {
        return <Button disabled>Loading...</Button>;
    }

if (user) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button>
            <Avatar className="cursor-pointer">
              <AvatarImage src={user.photoURL || ''} />
              <AvatarFallback>
                {user.displayName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-56">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">
              {user.displayName}
            </p>
            <p className="text-xs text-muted-foreground">
              {user.email}
            </p>

            <Button
              onClick={handleLogout}
              variant="secondary"
              className="mt-2 cursor-pointer"
            >
              Đăng xuất
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

    return (
        <div className="flex flex-col items-center gap-2">
            <Button onClick={handleLogin}>
                Sign in with Google
            </Button>
            {authError && (
                <p className="text-sm text-red-500">{authError}</p>
            )}
        </div>
    );
};