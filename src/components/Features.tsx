import { Brain, Users, CreditCard } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Planning",
    description: "Get personalized itineraries crafted by advanced AI that learns your preferences and suggests the perfect destinations.",
  },
  {
    icon: Users,
    title: "Social Travel Community",
    description: "Connect with fellow travelers, share experiences, and discover hidden gems through our vibrant community.",
  },
  {
    icon: CreditCard,
    title: "Seamless Booking",
    description: "Book flights, hotels, and experiences all in one place with competitive prices and instant confirmation.",
  },
];

const Features = () => {
  return (
    <section className="py-24 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Why Choose TraviLink?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need for the perfect trip, powered by cutting-edge technology
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card p-8 rounded-2xl border border-border hover:border-accent transition-all duration-300 hover:shadow-lg group"
            >
              <div className="w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                <feature.icon className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
