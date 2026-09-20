"use client";

import SupportRequestButton from "@/components/support/SupportRequestButton";

export default function DashboardSupportTopBar() {
  return (
    <div className="sticky top-0 z-30 flex justify-end border-b border-navy-900/8 bg-white/95 px-8 py-2.5 backdrop-blur-sm">
      <SupportRequestButton variant="header" />
    </div>
  );
}
