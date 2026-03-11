"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) dialog.showModal();
    else dialog.close();
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        "fixed inset-0 m-auto w-full max-w-lg rounded-2xl border-0 bg-white p-0 shadow-2xl shadow-slate-900/15 dark:bg-slate-900 dark:shadow-slate-950/50",
        className
      )}
      onClick={handleBackdropClick}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </dialog>
  );
}
