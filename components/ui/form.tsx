import * as React from "react";
import { cn } from "@/lib/utils";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
  UseFormReturn,
} from "react-hook-form";
import { Label } from "@/components/ui/label";

// Original custom form components
interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, children, onSubmit, ...props }, ref) => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      onSubmit?.(e);
    };

    return (
      <form
        ref={ref}
        onSubmit={handleSubmit}
        className={cn("space-y-6", className)}
        {...props}
      >
        {children}
      </form>
    );
  }
);
Form.displayName = "Form";

interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({ className, title, description, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800", className)}
        {...props}
      >
        {(title || description) && (
          <div className="mb-6">
            {title && (
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
        )}
        <div className="space-y-4">{children}</div>
      </div>
    );
  }
);
FormSection.displayName = "FormSection";

interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of columns for the group in medium and larger screens */
  cols?: 1 | 2 | 3 | 4;
  /** Gap between form fields */
  gap?: "sm" | "md" | "lg";
}

const FormGroup = React.forwardRef<HTMLDivElement, FormGroupProps>(
  ({ className, cols = 1, gap = "md", children, ...props }, ref) => {
    const gapSize = {
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
    };

    const colsSize = {
      1: "md:grid-cols-1",
      2: "md:grid-cols-2",
      3: "md:grid-cols-3",
      4: "md:grid-cols-4",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "grid grid-cols-1",
          colsSize[cols],
          gapSize[gap],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
FormGroup.displayName = "FormGroup";

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  /** Span multiple columns in a FormGroup */
  colSpan?: 1 | 2 | 3 | 4 | "full";
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, label, error, helperText, required, colSpan, children, ...props }, ref) => {
    const id = React.useId();
    
    const colSpanClasses = {
      1: "md:col-span-1",
      2: "md:col-span-2",
      3: "md:col-span-3",
      4: "md:col-span-4",
      "full": "md:col-span-full",
    };
    
    // Clone the child element to pass down the id
    const childrenWithProps = React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, {
          id,
          "aria-describedby": error ? `${id}-error` : helperText ? `${id}-description` : undefined,
          ...child.props,
        });
      }
      return child;
    });
    
    return (
      <div
        ref={ref}
        className={cn(
          "space-y-2",
          colSpan && colSpanClasses[colSpan],
          className
        )}
        {...props}
      >
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        {childrenWithProps}
        {error ? (
          <p id={`${id}-error`} className="text-sm text-red-500">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${id}-description`} className="text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);
FormField.displayName = "FormField";

interface FormActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Set to true to align buttons to the right */
  alignEnd?: boolean;
}

const FormActions = React.forwardRef<HTMLDivElement, FormActionsProps>(
  ({ className, alignEnd, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-wrap items-center space-x-2 pt-4 -mb-4", // Added -mb-4 here
          alignEnd && "justify-end",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
FormActions.displayName = "FormActions";

interface FormRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Set to true to align with flexible spacing */
  flexible?: boolean;
  /** Set column count (default: 2) */
  columns?: number;
}

const FormRow = React.forwardRef<HTMLDivElement, FormRowProps>(
  ({ className, flexible, columns = 2, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          `grid gap-4 ${columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`,
          flexible && "grid-flow-dense",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
FormRow.displayName = "FormRow";

// shadcn-style form hooks and components

// A custom hook-form compatible wrapper for the original Form
const HookForm = React.forwardRef<
  HTMLFormElement,
  React.PropsWithChildren<{
    className?: string;
  }> & React.ComponentPropsWithoutRef<typeof FormProvider>
>(({ children, className, ...props }, ref) => {
  return (
    <FormProvider {...props}>
      <form ref={ref} className={cn("space-y-6", className)}>
        {children}
      </form>
    </FormProvider>
  );
});
HookForm.displayName = "HookForm";

// Form field context for hook-form integration
type HookFormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName;
};

const HookFormFieldContext = React.createContext<HookFormFieldContextValue>(
  {} as HookFormFieldContextValue
);

// Form field for hook-form
const HookFormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <HookFormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </HookFormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(HookFormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <HookFormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField();

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  );
});
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
});
FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
});
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message) : children;

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

export {
  Form,
  FormSection,
  FormGroup,
  FormField,
  FormActions,
  FormRow,
  
  // Hook form components
  HookForm as FormProvider,
  HookFormField as FormField2,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
};