type DashboardHeaderProps = {
  title: string;
  description?: string;
};

export default function DashboardHeader({
  title,
  description,
}: DashboardHeaderProps) {
  return (
    <header className="border-b border-navy-900/8 bg-white px-8 py-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-navy-800/65">{description}</p>
        ) : null}
      </div>
    </header>
  );
}
