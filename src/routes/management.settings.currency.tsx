import { createFileRoute } from '@tanstack/react-router';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw, Save, Info } from "lucide-react";
import { getCurrencySettings, updateCurrencySettings } from "@/lib/settings.functions";

export const Route = createFileRoute('/management/settings/currency')({
  component: CurrencySettingsPage,
});

function CurrencySettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [settings, setSettings] = React.useState({
    customer_currency: 'PKR',
    usdt_rate: '280',
    price_rounding: '2_decimals',
    usdt_to_inr: '280',
    currency_symbol: 'Rs.',
    currency_code: 'PKR'
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const resultJson = await getCurrencySettings();
      const data = typeof resultJson === 'string' ? JSON.parse(resultJson) : resultJson;
      setSettings(data);
    } catch (error: any) {
      toast.error("Failed to load settings: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const resultJson = await updateCurrencySettings({ data: settings });
      const result = typeof resultJson === 'string' ? JSON.parse(resultJson) : resultJson;
      if (result.success) {
        toast.success("Settings saved successfully");
      }
    } catch (error: any) {
      toast.error("Failed to save settings: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentSymbol = settings.currency_symbol || settings.customer_currency;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Currency & Pricing</h1>
        <p className="text-muted-foreground">Global configuration for customer-facing service prices.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pricing Configuration</CardTitle>
          <CardDescription>Configure your customer-facing currency and USDT conversion rate.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer_currency">Customer Currency</Label>
                <select 
                  id="customer_currency"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={settings.customer_currency}
                  onChange={(e) => setSettings({...settings, customer_currency: e.target.value})}
                >
                  
                  <option value="PKR">PKR</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency_symbol">Display Symbol (e.g. Rs. or Rs.)</Label>
                <Input 
                  id="currency_symbol" 
                  value={settings.currency_symbol} 
                  onChange={(e) => setSettings({...settings, currency_symbol: e.target.value})} 
                  placeholder="Rs."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency_code">Currency Code (Internal)</Label>
                <Input 
                  id="currency_code" 
                  value={settings.currency_code} 
                  onChange={(e) => setSettings({...settings, currency_code: e.target.value})} 
                  placeholder="PKR"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base_currency">Base Internal Currency</Label>
                <Input id="base_currency" value="USDT" disabled className="bg-muted font-bold" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="usdt_rate">1 USDT = ? {settings.customer_currency}</Label>
              <div className="relative">
                <Input 
                  id="usdt_rate" 
                  type="number" 
                  step="0.01" 
                  value={settings.usdt_rate}
                  onChange={(e) => setSettings({...settings, usdt_rate: e.target.value})}
                  className="pr-12 font-black text-lg"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                  {settings.customer_currency}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                All provider costs will be normalized to USDT then converted using this rate.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="usdt_to_inr">1 USDT = ? PKR (Backup Rate)</Label>
              <div className="relative">
                <Input 
                  id="usdt_to_inr" 
                  type="number" 
                  step="0.01" 
                  value={settings.usdt_to_inr}
                  onChange={(e) => setSettings({...settings, usdt_to_inr: e.target.value})}
                  className="pr-12 font-black"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">PKR</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_rounding">Price Rounding Method</Label>
              <select 
                id="price_rounding"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={settings.price_rounding}
                onChange={(e) => setSettings({...settings, price_rounding: e.target.value})}
              >
                <option value="none">No Rounding (Exact)</option>
                <option value="2_decimals">2 Decimal Places (0.00)</option>
                <option value="whole">Whole Numbers (0)</option>
                <option value="nearest_5">Nearest 5 (5, 10, 15...)</option>
                <option value="nearest_10">Nearest 10 (10, 20, 30...)</option>
              </select>
            </div>

            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                <Info size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight mb-1">Pricing Logic</h4>
                <p className="text-xs text-blue-700 leading-relaxed font-medium">
                  Provider Cost (converted to USDT) × {settings.usdt_rate} {settings.customer_currency} + Profit = Customer Price.
                  <br /><br />
                  <span className="font-black">Note:</span> Changing these settings will NOT automatically update existing service prices. You must manually trigger a "Recalculate Prices" action from the Services management page.
                </p>
              </div>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-6 font-black uppercase tracking-widest" disabled={saving}>
              {saving ? <RefreshCw className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
              Save Configuration
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
