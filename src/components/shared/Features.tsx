import { ElementType } from "react";

interface FeatureItem {
  name: string;
  description: string;
  icon: ElementType;
  color: string;
}

export default function Features({ features }: { features: FeatureItem[] }) {
  return (
    <section className="py-12 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-h5 mb-1">Powerful Features</h2>
          <p className="text-body-sm max-w-2xl mx-auto">
            Everything you need to manage your educational institution effectively
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.name} className="card hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-h6 mb-1">{feature.name}</h3>
                <p className="text-body">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


