import { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** Contained horizontal scroll — page does not grow sideways. */
export function DataTableShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "w-full max-w-full min-w-0 overflow-x-auto rounded-md border border-border",
        className
      )}
    >
      {children}
    </div>
  )
}

export function DataTable({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <table className={cn("w-full text-xs border-collapse", className)}>{children}</table>
  )
}

export function DataTableHead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>
}

export function DataTableHeadRow({ children }: { children: ReactNode }) {
  return <tr className="bg-muted/50">{children}</tr>
}

export function DataTableTh({
  children,
  className,
  stickyRight,
}: {
  children: ReactNode
  className?: string
  stickyRight?: boolean
}) {
  return (
    <th
      className={cn(
        "text-left px-2 py-1.5 font-medium whitespace-nowrap",
        stickyRight && "sticky right-0 bg-muted/50 z-[1]",
        className
      )}
    >
      {children}
    </th>
  )
}

export function DataTableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>
}

export function DataTableRow({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <tr className={cn("border-t border-border hover:bg-muted/30 transition-colors", className)}>
      {children}
    </tr>
  )
}

export function DataTableTd({
  children,
  className,
  title,
  stickyRight,
}: {
  children: ReactNode
  className?: string
  title?: string
  stickyRight?: boolean
}) {
  return (
    <td
      title={title}
      className={cn(
        "px-2 py-1.5",
        stickyRight && "sticky right-0 bg-background z-[1]",
        className
      )}
    >
      {children}
    </td>
  )
}

export function DataTableEmpty({
  colSpan,
  message = "Tidak ada data.",
}: {
  colSpan: number
  message?: string
}) {
  return (
    <tr>
      <td className="p-4 text-center text-muted-foreground" colSpan={colSpan}>
        {message}
      </td>
    </tr>
  )
}

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const
