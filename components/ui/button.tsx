import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
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
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    
    // Fix for Electron: Add native event listener as fallback
    React.useEffect(() => {
      if (typeof window !== 'undefined' && (window as any).process?.type && onClick) {
        const button = buttonRef.current || (typeof ref === 'object' && ref?.current) || null
        if (button) {
          const nativeHandler = (e: MouseEvent) => {
            // Create a synthetic event-like object
            const syntheticEvent = {
              ...e,
              currentTarget: button,
              target: e.target,
              preventDefault: () => e.preventDefault(),
              stopPropagation: () => e.stopPropagation(),
              nativeEvent: e,
            } as unknown as React.MouseEvent<HTMLButtonElement>
            
            // Call the React onClick handler
            if (onClick) {
              onClick(syntheticEvent)
            }
          }
          
          // Use capture phase to ensure we catch the event
          button.addEventListener('click', nativeHandler, true)
          
          return () => {
            button.removeEventListener('click', nativeHandler, true)
          }
        }
      }
    }, [onClick, ref])
    
    const combinedRef = React.useCallback((node: HTMLButtonElement | null) => {
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref && 'current' in ref) {
        (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
      }
      buttonRef.current = node
    }, [ref])
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={combinedRef}
        onClick={onClick}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
