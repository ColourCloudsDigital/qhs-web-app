'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 disabled:opacity-70 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-black text-white hover:bg-gray-800 focus-visible:ring-black shadow-sm",
        secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600",
        outline: "border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-400 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800",
        ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-400 dark:text-gray-300 dark:hover:bg-gray-800",
        link: "bg-transparent text-primary underline-offset-4 hover:underline focus-visible:ring-primary p-0 h-auto",
        danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
        success: "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500",
        warning: "bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-500",
        google: "bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-300",
      },
      size: {
        default: "h-11 py-2 px-4",
        sm: "h-9 px-3 text-xs rounded-md",
        lg: "h-12 px-6 text-base rounded-md",
        icon: "h-10 w-10 p-0 rounded-full",
      },
      fullWidth: {
        true: "w-full",
      },
      rounded: {
        default: "rounded-md",
        full: "rounded-full",
        lg: "rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
      rounded: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    fullWidth,
    rounded,
    isLoading = false,
    loadingText,
    children,
    leftIcon,
    rightIcon,
    ...props
  }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, rounded, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {isLoading && loadingText ? loadingText : children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };