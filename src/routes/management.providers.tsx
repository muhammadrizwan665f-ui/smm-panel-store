import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/management/providers")({
  component: () => <Outlet />,
});
