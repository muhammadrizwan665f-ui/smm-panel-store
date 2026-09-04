import { ShoppingCart, Zap, TrendingUp, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

const options = [
  {
    id: "new-order",
    title: "New Order",
    description: "Boost your social presence instantly",
    icon: ShoppingCart,
    color: "oklch(0.55 0.22 260)",
  },
  {
    id: "services",
    title: "Services List",
    description: "Explore our wide range of services",
    icon: Zap,
    color: "oklch(0.65 0.25 280)",
  },
  {
    id: "history",
    title: "Order History",
    description: "Track your growth and orders",
    icon: TrendingUp,
    color: "oklch(0.6 0.2 300)",
  },
];

export function OptionCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto px-4">
      {options.map((option) => (
        <Link
          key={option.id}
          to="/option/$id"
          params={{ id: option.id }}
          className="group relative block p-8 rounded-3xl glass hover:bg-white/5 transition-all duration-300 border border-white/10 hover:border-white/20 shadow-xl overflow-hidden"
        >
          <div 
            className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
            style={{ backgroundColor: option.color }}
          />
          
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner"
            style={{ backgroundColor: `${option.color}20` }}
          >
            <option.icon size={32} style={{ color: option.color }} />
          </div>

          <h3 className="text-2xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
            {option.title}
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            {option.description}
          </p>

          <div className="mt-8 flex items-center text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all">
            Get Started <ChevronRight size={16} className="ml-1" />
          </div>
        </Link>
      ))}
    </div>
  );
}
