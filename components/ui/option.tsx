import * as React from "react";
import { SelectItem } from "./select";

interface OptionProps extends React.ComponentPropsWithoutRef<typeof SelectItem> {
  value: string;
  disabled?: boolean;
  selected?: boolean;
}

const Option: React.FC<OptionProps> = ({
  value,
  disabled,
  selected,
  children,
  ...props
}) => {
  return (
    <SelectItem
      value={value}
      disabled={disabled}
      {...props}
    >
      {children}
    </SelectItem>
  );
};

Option.displayName = "Option";

export { Option };