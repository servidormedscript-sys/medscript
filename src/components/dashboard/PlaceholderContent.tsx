type PlaceholderContentProps = {
  message: string;
};

export default function PlaceholderContent({ message }: PlaceholderContentProps) {
  return (
    <div className="rounded-lg border border-dashed border-navy-900/15 bg-white p-10 text-center">
      <p className="text-sm text-navy-800/60">{message}</p>
    </div>
  );
}
