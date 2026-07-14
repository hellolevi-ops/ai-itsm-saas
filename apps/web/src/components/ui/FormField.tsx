'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { Input } from './Input';

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

type InputElementProps = InputHTMLAttributes<HTMLInputElement> & FormFieldProps;

export const FormField = forwardRef<HTMLInputElement, InputElementProps>(
  ({ label, error, hint, required, id, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <Input ref={ref} id={inputId} error={!!error} {...props} />
        {error ? (
          <p className="text-sm text-red-600" data-testid={`${inputId}-error`}>
            {error}
          </p>
        ) : hint ? (
          <p className="text-sm text-gray-500">{hint}</p>
        ) : null}
      </div>
    );
  }
);

FormField.displayName = 'FormField';
