import * as React from "react"
import { cn } from "@/utils/cn"

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  maxHeight?: string | number
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, maxHeight, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={{ maxHeight, ...style }}
        className={cn("overflow-y-auto overflow-x-hidden", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ScrollArea.displayName = "ScrollArea"

export { ScrollArea }
