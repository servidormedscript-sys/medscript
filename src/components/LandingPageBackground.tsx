type LandingPageBackgroundProps = {
  children: React.ReactNode;
};

export default function LandingPageBackground({
  children,
}: LandingPageBackgroundProps) {
  return (
    <div className="bg-gradient-to-b from-ocean-100 via-ocean-50 to-ocean-100">
      {children}
    </div>
  );
}
