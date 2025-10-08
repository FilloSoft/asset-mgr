import type { ReactNode } from "react";

interface BaseFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

interface InputFieldProps extends BaseFieldProps {
  type?: string;
}

interface TextAreaFieldProps extends BaseFieldProps {
  rows?: number;
}

interface SelectFieldProps
  extends Omit<BaseFieldProps, "placeholder" | "required"> {
  options: ReadonlyArray<{ label: string; value: string }>;
}

const FIELD_WRAPPER_CLASS = "space-y-2";

export function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 border-t pt-6">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {children}
    </section>
  );
}

export function TextField({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  disabled,
  type = "text",
  required,
  className,
}: InputFieldProps) {
  const wrapperClass = className
    ? `${FIELD_WRAPPER_CLASS} ${className}`
    : FIELD_WRAPPER_CLASS;

  return (
    <div className={wrapperClass}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && <ErrorText message={error} />}
    </div>
  );
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  disabled,
  rows = 3,
  required,
  className,
}: TextAreaFieldProps) {
  const wrapperClass = className
    ? `${FIELD_WRAPPER_CLASS} ${className}`
    : FIELD_WRAPPER_CLASS;

  return (
    <div className={wrapperClass}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && <ErrorText message={error} />}
    </div>
  );
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  disabled,
  error,
  className,
}: SelectFieldProps) {
  const wrapperClass = className
    ? `${FIELD_WRAPPER_CLASS} ${className}`
    : FIELD_WRAPPER_CLASS;

  return (
    <div className={wrapperClass}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <ErrorText message={error} />}
    </div>
  );
}

export function FormActions({
  isLoading,
  isEditing,
  onCancel,
}: {
  isLoading: boolean;
  isEditing: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="flex justify-end space-x-4 pt-6 border-t">
      <button
        type="button"
        onClick={onCancel}
        className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        disabled={isLoading}
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isLoading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Saving...
          </span>
        ) : (
          <span>{isEditing ? "Update Asset" : "Create Asset"}</span>
        )}
      </button>
    </div>
  );
}

function ErrorText({ message }: { message: string }) {
  return <p className="text-sm text-red-600">{message}</p>;
}
