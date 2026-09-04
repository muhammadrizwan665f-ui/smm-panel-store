import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/management/providers/$id")({
  beforeLoad: ({ params }) => {
    if (params.id === 'index') {
      throw redirect({ to: '/management/providers' });
    }
  },
  component: () => <Outlet />,
});
