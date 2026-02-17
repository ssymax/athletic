import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export function Button({
    children,
    className = '',
    variant = 'primary',
    size = 'md',
    isLoading = false,
    ...props
}: ButtonProps) {
    const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        ghost: 'btn-ghost',
        danger: 'btn-danger',
    };

    const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
        sm: 'btn-sm',
        md: '',
        lg: 'btn-lg',
    };

    return (
        <button
            className={`btn ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()}
            disabled={props.disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="mr-2">...</span>
            ) : null}
            {children}
        </button>
    );
}
