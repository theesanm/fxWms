
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary-dark shadow-sm dark:bg-primary dark:text-white dark:hover:bg-primary-dark",
        outline: "border border-secondary-medium bg-white text-secondary-dark hover:bg-secondary-light dark:border-dark-bg-secondary dark:bg-dark-bg-secondary dark:text-dark-text-primary dark:hover:bg-dark-bg-primary",
        success: "bg-success text-white hover:bg-success/90 dark:bg-success dark:text-white dark:hover:bg-success/90",
        warning: "bg-warning text-secondary-dark hover:bg-warning/90 dark:bg-warning dark:text-secondary-dark dark:hover:bg-warning/90",
        danger: "bg-danger text-white hover:bg-danger/90 dark:bg-danger dark:text-white dark:hover:bg-danger/90",
        destructive: "bg-danger text-white hover:bg-danger/90 dark:bg-danger dark:text-white dark:hover:bg-danger/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }






