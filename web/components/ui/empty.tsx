import * as React from "react";

import { cn } from "@/lib/utils";

const Empty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted p-8 text-center",
      className,
    )}
    {...props}
  />
));
Empty.displayName = "Empty";

const EmptyHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col items-center gap-4", className)}
    {...props}
  />
));
EmptyHeader.displayName = "EmptyHeader";

interface EmptyMediaProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "icon" | "image";
}

const EmptyMedia = React.forwardRef<HTMLDivElement, EmptyMediaProps>(
  ({ className, variant = "icon", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        variant === "icon"
          ? "flex h-16 w-16 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"
          : "h-32 w-full bg-secondary rounded-lg",
        className,
      )}
      {...props}
    />
  ),
);
EmptyMedia.displayName = "EmptyMedia";

const EmptyTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold leading-none", className)}
    {...props}
  />
));
EmptyTitle.displayName = "EmptyTitle";

const EmptyDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground max-w-xs", className)}
    {...props}
  />
));
EmptyDescription.displayName = "EmptyDescription";

const EmptyFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex gap-2 mt-4", className)} {...props} />
));
EmptyFooter.displayName = "EmptyFooter";

export {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyFooter,
};
