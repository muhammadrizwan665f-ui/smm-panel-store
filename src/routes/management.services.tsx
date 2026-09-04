import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/management/services")({
  component: () => <Outlet />,
});
