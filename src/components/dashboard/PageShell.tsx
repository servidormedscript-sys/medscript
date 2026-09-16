import DashboardHeader from "@/components/dashboard/DashboardHeader";

type PageShellProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export default function PageShell({
  title,
  description,
  children,
}: PageShellProps) {
  return (
    <>
      <DashboardHeader title={title} description={description} />
      <div className="p-8">{children}</div>
    </>
  );
}
