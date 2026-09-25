"use client";

import SupportRequestButton from "@/components/support/SupportRequestButton";

type Props = {
  variant?: "bar" | "embedded";
};

export default function DashboardSupportTopBar({ variant = "bar" }: Props) {
  if (variant === "embedded") {
    return <SupportRequestButton variant="header" />;
  }

  return (
    <div className="sticky top-0 z-30 flex justify-end border-b border-navy-900/8 bg-white/95 px-4 py-2.5 backdrop-blur-sm sm:px-6 lg:px-8">
      <SupportRequestButton variant="header" />
    </div>
  );
}
