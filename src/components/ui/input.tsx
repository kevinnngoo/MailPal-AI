import * as React from "react";

import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  validate?: (value: string) => string | null;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, validate, onChange, ...props }, ref) => {
    const [error, setError] = React.useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      // Client-side validation
      if (validate) {
        const validationError = validate(value);
        setError(validationError);
      }

      // Sanitize input
      const sanitizedValue = value.replace(/<script[^>]*>.*?<\/script>/gi, "");
      if (sanitizedValue !== value) {
        e.target.value = sanitizedValue;
      }

      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          ref={ref}
          onChange={handleChange}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${props.id}-error`} className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
