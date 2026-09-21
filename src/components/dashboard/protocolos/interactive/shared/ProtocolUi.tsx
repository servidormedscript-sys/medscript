import Link from "next/link";

export function ProtocolPanel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-navy-900/10 bg-white p-5 ${className}`}
    >
      <h4 className="text-sm font-semibold text-navy-950">{title}</h4>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function DangerBanner({
  title,
  children,
  href,
  linkLabel,
}: {
  title: string;
  children?: React.ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-red-300 bg-red-50 p-4">
      <p className="font-semibold text-red-900">{title}</p>
      {children ? <p className="mt-1 text-sm text-red-800/85">{children}</p> : null}
      {href && linkLabel ? (
        <Link
          href={href}
          className="mt-3 inline-block rounded-full bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-ocean-200 bg-ocean-50 p-4 text-sm text-ocean-950">
      {children}
    </div>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-lg border border-navy-900/8 bg-navy-50/40 p-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5"
      />
      <span>
        <span className="text-sm font-medium text-navy-950">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-navy-800/60">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

export function DoseLogButton({
  label,
  detail,
  onClick,
  disabled,
  warn,
}: {
  label: string;
  detail: string;
  onClick: () => void;
  disabled?: boolean;
  warn?: string | null;
}) {
  return (
    <div>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="w-full rounded-lg border border-navy-900/10 bg-navy-50/80 px-4 py-3 text-left text-sm hover:border-ocean-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="font-semibold text-navy-950">{label}</span>
        <span className="mt-1 block text-navy-800/70">{detail}</span>
      </button>
      {warn ? <p className="mt-1 text-xs text-amber-800">{warn}</p> : null}
    </div>
  );
}
