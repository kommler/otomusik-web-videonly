import React from 'react';
import { Input, InputProps } from './input';
import { Textarea, TextareaProps } from './textarea';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  children,
}) => {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

interface FormInputProps extends InputProps {
  label: string;
  required?: boolean;
  error?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  required = false,
  error,
  ...props
}) => {
  return (
    <FormField label={label} required={required} error={error}>
      <Input {...props} />
    </FormField>
  );
};

interface FormTextareaProps extends TextareaProps {
  label: string;
  required?: boolean;
  error?: string;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  required = false,
  error,
  ...props
}) => {
  return (
    <FormField label={label} required={required} error={error}>
      <Textarea {...props} />
    </FormField>
  );
};

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  required = false,
  error,
  className,
  children,
  ...props
}) => {
  return (
    <FormField label={label} required={required} error={error}>
      <select
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white ${className || ''}`}
        {...props}
      >
        {children}
      </select>
    </FormField>
  );
};