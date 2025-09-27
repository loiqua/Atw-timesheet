"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type DialogContextType = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const DialogCtx = React.createContext<DialogContextType | null>(null);

export function Dialog({ open, onOpenChange, children }: { readonly open: boolean; readonly onOpenChange: (v: boolean) => void; readonly children: React.ReactNode; }) {
  const value = React.useMemo<DialogContextType>(() => ({ open, setOpen: onOpenChange }), [open, onOpenChange]);
  return (
    <DialogCtx.Provider value={value}>{children}</DialogCtx.Provider>
  );
}

export function DialogTrigger({ asChild = false, children }: { readonly asChild?: boolean; readonly children: React.ReactElement; }) {
  const ctx = React.useContext(DialogCtx);
  if (!ctx) return children;
  const { setOpen } = ctx;
  if (asChild) {
    type Clickable = { onClick?: (e: React.MouseEvent) => void } & Record<string, unknown>;
    const child = React.Children.only(children) as React.ReactElement<Clickable>;
    const prevOnClick = child.props?.onClick;
    return React.cloneElement(child, {
      ...(child.props ?? {}),
      onClick: (e: React.MouseEvent) => {
        prevOnClick?.(e);
        setOpen(true);
      },
    });
  }
  return (
    <button type="button" onClick={() => setOpen(true)}>{children}</button>
  );
}

export function DialogContent({ className, children, role = "dialog", ariaLabelledby }: { readonly className?: string; readonly children: React.ReactNode; readonly role?: string; readonly ariaLabelledby?: string; }) {
  const ctx = React.useContext(DialogCtx);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!ctx?.open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") ctx.setOpen(false); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // autofocus content
    ref.current?.focus();
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [ctx]);

  if (!ctx?.open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Fermer le dialogue"
        onClick={(e) => { if (e.currentTarget === e.target) ctx.setOpen(false); }}
        onKeyDown={(e) => { if (e.key === "Escape" || e.key === "Enter" || e.key === " ") ctx.setOpen(false); }}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={ref}
          tabIndex={-1}
          role={role}
          aria-modal="true"
          aria-labelledby={ariaLabelledby}
          className={cn("w-full max-w-2xl rounded-xl border bg-white p-4 shadow-xl dark:bg-neutral-900", className)}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mb-3", className)} {...props} />;
}

export function DialogTitle({ className, children, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2 className={cn("text-lg font-semibold", className)} {...props}>
      {children || "Titre du dialogue"}
    </h2>
  );
}

export function DialogClose({ children }: { readonly children: React.ReactElement }) {
  const ctx = React.useContext(DialogCtx);
  if (!ctx) return children;
  type Clickable = { onClick?: () => void } & Record<string, unknown>;
  const child = React.Children.only(children) as React.ReactElement<Clickable>;
  const prevOnClick = child.props?.onClick;
  return React.cloneElement(child, { ...(child.props ?? {}), onClick: () => { prevOnClick?.(); ctx.setOpen(false); } });
}
