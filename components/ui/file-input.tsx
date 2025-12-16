import * as React from "react";
import { cn } from "@/lib/utils";

export interface FileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label?: string;
  error?: string;
  helperText?: string;
  buttonText?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showFileName?: boolean;
  acceptedFileTypes?: string;
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    id, 
    onChange, 
    buttonText = "Choose File", 
    showFileName = true, 
    acceptedFileTypes,
    multiple,
    required,
    ...props 
  }, ref) => {
    const [fileName, setFileName] = React.useState<string>("");
    const generatedId = React.useId();
    const fileInputId = id || generatedId;
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) {
        setFileName("");
      } else if (multiple) {
        setFileName(`${files.length} files selected`);
      } else {
        setFileName(files[0].name);
      }
      
      if (onChange) {
        onChange(e);
      }
    };
    
    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={fileInputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        
        <div className="flex items-center space-x-2">
          <label
            htmlFor={fileInputId}
            className={cn(
              "inline-flex cursor-pointer items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors",
              "hover:bg-gray-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600",
              error && "border-red-500 focus-within:ring-red-500",
              className
            )}
          >
            {buttonText}
            <input
              id={fileInputId}
              type="file"
              className="sr-only"
              onChange={handleChange}
              multiple={multiple}
              accept={acceptedFileTypes}
              ref={ref}
              {...props}
            />
          </label>
          
          {showFileName && fileName && (
            <span className="text-sm text-gray-600 dark:text-gray-400">{fileName}</span>
          )}
        </div>
        
        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : helperText ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

FileInput.displayName = "FileInput";

export { FileInput };