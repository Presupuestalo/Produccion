import * as React from "react"
import { cn } from "@/lib/utils"

export function Empty({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("flex flex-col items-center justify-center p-8 text-center", className)}
            {...props}
        >
            {children}
        </div>
    )
}

export function EmptyMedia({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("mb-4", className)} {...props}>
            {children}
        </div>
    )
}

export function EmptyTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3 className={cn("text-lg font-semibold", className)} {...props}>
            {children}
        </h3>
    )
}

export function EmptyDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p className={cn("text-sm text-muted-foreground", className)} {...props}>
            {children}
        </p>
    )
}

export function EmptyActions({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("mt-6 flex gap-2", className)} {...props}>
            {children}
        </div>
    )
}
