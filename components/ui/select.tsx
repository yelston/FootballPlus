"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

const SelectRoot = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

// Wrapper component for backward compatibility with native select API
export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, onChange, value, defaultValue, disabled, name, id, ...props }, ref) => {
    const [open, setOpen] = React.useState(false)
    const [selectedValue, setSelectedValue] = React.useState<string>(
      value !== undefined ? String(value) : defaultValue !== undefined ? String(defaultValue) : ""
    )

    React.useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(String(value))
      }
    }, [value])

    const options = React.useMemo(() => {
      const opts: Array<{ value: string; label: string }> = []
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.type === "option") {
          const value = String(child.props.value ?? "")
          opts.push({
            value,
            label: child.props.children?.toString() || "",
          })
        }
      })
      return opts
    }, [children])

    const selectedLabel = React.useMemo(() => {
      const option = options.find((opt) => opt.value === selectedValue)
      return option?.label || ""
    }, [options, selectedValue])

    // Create a hidden native select for form submission
    const hiddenSelectRef =
      React.useRef<HTMLSelectElement | null>(null) as React.MutableRefObject<
        HTMLSelectElement | null
      >

    // Use a placeholder value for empty strings since Radix UI doesn't allow empty string values
    const PLACEHOLDER_VALUE = "__none__"

    const handleValueChange = (val: string | undefined) => {
      // Convert placeholder value back to empty string for form submission
      const formValue = val === undefined || val === PLACEHOLDER_VALUE ? "" : val
      setSelectedValue(formValue)
      // Update hidden select value
      if (hiddenSelectRef.current) {
        hiddenSelectRef.current.value = formValue
      }
      // Create a synthetic event for onChange compatibility
      if (onChange && hiddenSelectRef.current) {
        const syntheticEvent = {
          target: { value: formValue, name: name || "" },
          currentTarget: hiddenSelectRef.current,
        } as React.ChangeEvent<HTMLSelectElement>
        onChange(syntheticEvent)
      }
    }
    
    // Convert empty string to placeholder value for Radix Select
    const radixValue = selectedValue === "" ? PLACEHOLDER_VALUE : selectedValue
    
    // Map options, converting empty strings to placeholder value for Radix
    const radixOptions = options.map((option) => ({
      ...option,
      radixValue: option.value === "" ? PLACEHOLDER_VALUE : option.value,
    }))

    return (
      <>
        <SelectRoot value={radixValue} onValueChange={handleValueChange} open={open} onOpenChange={setOpen}>
          <SelectTrigger
            disabled={disabled}
            className={cn(
              !selectedLabel && "text-muted-foreground",
              className
            )}
          >
            <SelectValue placeholder="Select...">
              {selectedLabel || "Select..."}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {radixOptions.map((option) => (
              <SelectItem key={option.value} value={option.radixValue}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectRoot>
        {/* Hidden native select for form submission */}
        <select
          ref={(node) => {
            hiddenSelectRef.current = node
            if (typeof ref === "function") {
              ref(node)
            } else if (ref) {
              const mutableRef = ref as { current: HTMLSelectElement | null }
              mutableRef.current = node
            }
          }}
          value={selectedValue}
          onChange={(e) => {
            handleValueChange(e.target.value)
          }}
          disabled={disabled}
          name={name}
          id={id}
          className="hidden"
          {...props}
        >
          {children}
        </select>
      </>
    )
  }
)
Select.displayName = "Select"

export {
  Select,
  SelectRoot,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
