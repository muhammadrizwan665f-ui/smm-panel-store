import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Construction } from "lucide-react";

const PlaceholderContent = ({ title }: { title: string }) => {
  return (
    <div className="max-w-3xl mx-auto px-4 text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Link 
        to="/dashboard"
        className="inline-flex items-center text-sm font-bold text-primary hover:underline mb-8"
      >
        <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
      </Link>

      <div className="glass-white p-12 md:p-20 rounded-[3rem] card-shadow border border-white/50">
        <div className="w-24 h-24 gradient-soft rounded-full flex items-center justify-center text-primary mx-auto mb-8">
          <Construction size={48} />
        </div>
        <h1 className="text-4xl font-black text-gradient mb-4">
          {title}
        </h1>
        <p className="text-lg text-muted-foreground mb-10 max-w-md mx-auto">
          We're hard at work building the <strong>{title}</strong> module. 
          Expect a professional, fully functional experience in Phase 2!
        </p>
        
        <div className="grid grid-cols-3 gap-2 w-full max-w-[200px] mx-auto">
          <div className="h-1.5 gradient-primary rounded-full animate-pulse" />
          <div className="h-1.5 bg-secondary rounded-full" />
          <div className="h-1.5 bg-secondary rounded-full" />
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/_authenticated/transactions")({ component: () => <PlaceholderContent title="Transactions" /> });
