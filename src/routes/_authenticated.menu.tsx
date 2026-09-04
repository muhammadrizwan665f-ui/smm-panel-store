import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/menu")({
  component: MenuPage,
});

function MenuPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">
        User Menu is available in the bottom navigation.
      </p>
    </div>
  );
}
