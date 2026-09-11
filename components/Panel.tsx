export default function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`bg-stone-900 pixel-border ${className}`}>
      <h2 className="border-b-2 border-stone-950 bg-stone-800 px-3 py-2 text-[13px] font-semibold text-stone-200">
        {title}
      </h2>
      <div className="p-3">{children}</div>
    </section>
  );
}
