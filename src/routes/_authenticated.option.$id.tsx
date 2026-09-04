import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/option/$id")({
  component: OptionPage,
});

function OptionPage() {
  const { id } = Route.useParams();
  
  return (
    <div className="max-w-3xl mx-auto px-4 text-center">
      <Link 
        to="/dashboard"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft size={16} className="mr-2" /> Back to dashboard
      </Link>

      <div className="glass p-12 rounded-3xl border border-white/10 shadow-2xl">
        <h1 className="text-4xl font-bold text-gradient mb-4 capitalize">
          {id.replace("-", " ")}
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          This feature is currently under development. 
          Stay tuned for updates in Phase 2!
        </p>
        
        <div className="w-20 h-1 bg-primary/20 mx-auto rounded-full" />
      </div>
    </div>
  );
}
