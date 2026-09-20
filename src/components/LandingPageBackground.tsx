type LandingPageBackgroundProps = {
  children: React.ReactNode;
};

export default function LandingPageBackground({
  children,
}: LandingPageBackgroundProps) {
  return <div className="relative">{children}</div>;
}
