import {
  useEffect,
  useRef,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";
import { ArrowUpRight, X } from "@phosphor-icons/react";

export function Mark({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path d="M5 5 17 13 25 44 5 5Z" fill="currentColor" />
      <path d="m43 5-12 8-6 31L43 5Z" fill="currentColor" opacity=".72" />
    </svg>
  );
}

export function Button({
  children,
  arrow,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  arrow?: boolean;
  variant?: "primary" | "secondary" | "quiet";
}) {
  return (
    <button className={`button ${variant} ${className}`} {...props}>
      {children}
      {arrow && (
        <span className="button-orbit">
          <ArrowUpRight size={18} weight="light" aria-hidden="true" />
        </span>
      )}
    </button>
  );
}

export function Surface({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`surface ${className}`}>
      <div className="surface-core">{children}</div>
    </div>
  );
}

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-inner">
        <div className="modal-heading">
          <h2 id="modal-title">{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={22} weight="light" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
