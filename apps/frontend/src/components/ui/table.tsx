"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface TableProps extends React.ComponentProps<"table"> {
  readonly containerClassName?: string;
  readonly caption?: string;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(function Table(
  { className, containerClassName, caption, children, ...props },
  ref,
) {
  return (
    <div
      data-slot="table-container"
      className={cn("relative w-full overflow-x-auto", containerClassName)}
    >
      <table
        ref={ref}
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        role="table"
        {...props}
      >
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
});

function TableHeader({
  className,
  ...props
}: Readonly<React.ComponentProps<"thead">>) {
  return (
    <thead
      data-slot="table-header"
      className={cn("border-b", className)}
      {...props}
    />
  );
}

function TableBody({
  className,
  ...props
}: Readonly<React.ComponentProps<"tbody">>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({
  className,
  ...props
}: Readonly<React.ComponentProps<"tfoot">>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.ComponentProps<"tr">
>(function TableRow({ className, ...props }, ref) {
  return (
    <tr
      ref={ref}
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className,
      )}
      {...props}
    />
  );
});

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ComponentProps<"th">
>(function TableHead({ className, scope, ...props }, ref) {
  return (
    <th
      ref={ref}
      data-slot="table-head"
      scope={scope ?? "col"}
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-normal sm:whitespace-nowrap break-words [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
});

function TableCell({
  className,
  ...props
}: Readonly<React.ComponentProps<"td">>) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle min-w-0 whitespace-normal sm:whitespace-nowrap break-words [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: Readonly<React.ComponentProps<"caption">>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
};
