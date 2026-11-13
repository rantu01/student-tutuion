interface StatItem {
  label: string;
  value: string;
  description: string;
}

export default function Stats({ stats }: { stats: StatItem[] }) {
  return (
    <section className="py-10 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-h4 mb-0.5">{stat.value}</div>
              <div className="text-h6 mb-0.5">{stat.label}</div>
              <div className="text-body-sm">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


