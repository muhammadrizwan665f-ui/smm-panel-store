import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Landmark, Settings, ShieldCheck, Coins, Palette, KeyRound } from "lucide-react";
import React from "react";

export const Route = createFileRoute("/management/settings")({
  component: SettingsLayout,
});

function SettingsLayout() {
  return (
    <div className="space-y-6">
      <div className="flex border-b overflow-x-auto">
        <Link 
          to="/management/settings" 
          activeOptions={{ exact: true }}
          activeProps={{ className: 'border-b-2 border-primary text-primary font-medium' }}
          className="px-4 py-2 text-muted-foreground whitespace-nowrap"
        >
          <Settings className="h-4 w-4 inline mr-2" />
          General
        </Link>
        <Link 
          to="/management/settings/currency" 
          activeProps={{ className: 'border-b-2 border-primary text-primary font-medium' }}
          className="px-4 py-2 text-muted-foreground whitespace-nowrap"
        >
          <Coins className="h-4 w-4 inline mr-2" />
          Currency
        </Link>
        <Link 
          to="/management/settings/branding" 
          activeProps={{ className: 'border-b-2 border-primary text-primary font-medium' }}
          className="px-4 py-2 text-muted-foreground whitespace-nowrap"
        >
          <Palette className="h-4 w-4 inline mr-2" />
          Branding
        </Link>
        <Link 
          to="/management/settings/account" 
          activeProps={{ className: 'border-b-2 border-primary text-primary font-medium' }}
          className="px-4 py-2 text-muted-foreground whitespace-nowrap"
        >
          <KeyRound className="h-4 w-4 inline mr-2" />
          Admin Login
        </Link>
      </div>
      <div className="pt-4">
        <Outlet />
      </div>
    </div>
  );
}

