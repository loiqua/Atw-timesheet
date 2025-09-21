"use client";
import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';

export type PasswordInputProps = Readonly<
  Omit<React.ComponentPropsWithoutRef<'input'>, 'type'> & {
    className?: string;
  }
>;

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [show, setShow] = React.useState(false);
    return (
      <div className="relative">
        <input
          {...props}
          ref={ref}
          type={show ? 'text' : 'password'}
          className={
            `w-full rounded-md border px-3 py-2 bg-white/90 dark:bg-black/30 outline-none focus:border-blue-500 ${className ?? ''}`
          }
          autoComplete={show ? 'off' : props.autoComplete ?? 'current-password'}
        />
        <button
          type="button"
          aria-label={show ? 'Hide password' : 'Show password'}
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';
