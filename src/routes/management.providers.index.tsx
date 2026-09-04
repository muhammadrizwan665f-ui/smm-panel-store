import { createFileRoute, Link } from "@tanstack/react-router";
import { getCurrencySymbol } from "@/lib/currency.constants";
import { 
  Plus, 
  Search, 
  ExternalLink, 
  RefreshCw, 
  Wallet,
  Settings,
  Database,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Copy,
  Lock,
  ArrowRight,
  X,
  History,
  Activity,
  Check,
  Trash2,
  Power,
  PowerOff
} from "lucide-react";
import React from "react";
import { getProviderBalance, testConnection, addProvider, listProviders } from "@/lib/providers/provider.functions";
import { adminDeleteProvider, adminUpdateProviderStatus } from "@/lib/admin/admin.functions";
import { getCurrencySettings } from "@/lib/settings.functions";
import { useAdminData } from "@/components/admin/AdminData";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/management/providers/")({
  ssr: false,
  component: ProvidersPage,
});

function ProvidersPage() {
  const { data: currencySettings } = useAdminData(() => getCurrencySettings());
  const currentSymbol = currencySettings?.currency_symbol || (currencySettings?.customer_currency === 'PKR' ? 'Rs.' : 'Rs.');

  const [providers, setProviders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshingStates, setRefreshingStates] = React.useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});
  const [showAddModal, setShowAddModal] = React.useState(false);
  
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testStatus, setTestStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = React.useState<string | null>(null);
  
  // Add provider form state
  const [formData, setFormData] = React.useState({
    name: '',
    apiUrl: '',
    apiKey: '',
    apiVersion: 'v2',
    currency: 'USDT',
    notes: ''
  });

  const currencySymbols: Record<string, string> = {
    'PKR': 'Rs.',
    'USD': '$',
    'USDT': '₮',
    'EUR': '€'
  };

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const result = await listProviders();
      const parsed = typeof result === 'string' ? JSON.parse(result) : result;
      
      // ensure we have an array even if the RPC result is wrapped
      let data = [];
      if (Array.isArray(parsed)) {
        data = parsed;
      } else if (parsed && Array.isArray(parsed.data)) {
        data = parsed.data;
      } else if (parsed && parsed.error) {
        console.error("Provider load error:", parsed.error);
        toast.error("Error loading providers: " + parsed.error);
        data = [];
      } else if (parsed && typeof parsed === 'object') {
        // Fallback for unexpected object shapes
        data = parsed.result || parsed.providers || [];
      }
      
      setProviders(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Failed to load providers:", error);
      toast.error("Failed to load providers: " + error.message);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProviders();
  }, []);

  const handleTestConnection = async () => {
    if (!formData.apiUrl || !formData.apiKey) {
      toast.error("Please fill in API URL and Key");
      setTestStatus('error');
      setTimeout(() => setTestStatus('idle'), 2000);
      return;
    }
    
    setTestStatus('loading');
    setTestMessage(null);
    
    try {
      const resultJson = await testConnection({ 
        data: { 
          apiUrl: formData.apiUrl, 
          apiKey: formData.apiKey, 
          apiVersion: formData.apiVersion 
        } 
      });
      const result = typeof resultJson === 'string' ? JSON.parse(resultJson) : resultJson;
      
      if (result.success) {
        toast.success(result.message);
        setTestStatus('success');
        setTestMessage(result.message);
      } else {
        toast.error(result.message);
        setTestStatus('error');
        setTestMessage(result.message);
      }
    } catch (error: any) {
      toast.error("Connection test failed: " + error.message);
      setTestStatus('error');
      setTestMessage(error.message);
    } finally {
      setTimeout(() => {
        setTestStatus((current) => current === 'loading' ? 'idle' : current);
      }, 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting provider data:", { ...formData, apiKey: '[REDACTED]' });
    setSaveStatus('loading');
    
    try {
      const resultJson = await addProvider({ 
        data: {
          name: formData.name,
          apiUrl: formData.apiUrl,
          apiKey: formData.apiKey,
          apiVersion: formData.apiVersion,
          currency: formData.currency,
          notes: formData.notes
        } 
      });

      console.log("addProvider raw result:", resultJson);
      const result = typeof resultJson === 'string' ? JSON.parse(resultJson) : resultJson;

      if (result.error) {
        console.error("addProvider error result:", result.error);
        toast.error("Error: " + result.error);
        setSaveStatus('error');
      } else if (result.success || result.id) {
        console.log("addProvider success:", result);
        toast.success("Provider added successfully!");
        setSaveStatus('success');
        setTimeout(() => {
          setShowAddModal(false);
          setSaveStatus('idle');
          setFormData({ name: '', apiUrl: '', apiKey: '', apiVersion: 'v2', currency: 'USDT', notes: '' });
          fetchProviders();
        }, 1000);
      } else {
        console.warn("addProvider unexpected result shape:", result);
        toast.error("Unexpected response from server");
        setSaveStatus('error');
      }
    } catch (error: any) {
      console.error("Error in handleSubmit catch block:", error);
      toast.error("System Error: " + error.message);
      setSaveStatus('error');
    } finally {
      // We don't want to reset status to 'idle' immediately if it's 'success' or 'error'
      // to let the user see the result. The success path handles its own reset.
      setTimeout(() => {
         setSaveStatus((current) => (current === 'loading') ? 'idle' : current);
      }, 3000);
    }
  };

  const refreshBalance = async (id: string) => {
    setRefreshingStates(prev => ({ ...prev, [id]: 'loading' }));
    try {
      const resultJson = await getProviderBalance({ data: { providerId: id } });
      const result = typeof resultJson === 'string' ? JSON.parse(resultJson) : resultJson;
      
      toast.success("Balance updated");
      setRefreshingStates(prev => ({ ...prev, [id]: 'success' }));
      fetchProviders();
    } catch (error: any) {
      toast.error("Failed to refresh balance: " + error.message);
      setRefreshingStates(prev => ({ ...prev, [id]: 'error' }));
    } finally {
      setTimeout(() => {
        setRefreshingStates(prev => ({ ...prev, [id]: 'idle' }));
      }, 2000);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const resultJson = await adminUpdateProviderStatus({ data: { id, status: newStatus } });
      const result = typeof resultJson === 'string' ? JSON.parse(resultJson) : resultJson;
      if (result.success) {
        toast.success(`Provider ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
        fetchProviders();
      } else {
        toast.error(result.message || "Failed to update status");
      }
    } catch (error: any) {
      toast.error(error.message || "Error updating status");
    }
  };

  const deleteProvider = async (id: string) => {
    if (!confirm("Are you sure you want to delete this provider? This will also deactivate all its linked services.")) return;
    
    try {
      const resultJson = await adminDeleteProvider({ data: { id } });
      const result = typeof resultJson === 'string' ? JSON.parse(resultJson) : resultJson;
      if (result.success) {
        toast.success("Provider deleted");
        fetchProviders();
      } else {
        toast.error(result.message || "Failed to delete provider");
      }
    } catch (error: any) {
      toast.error(error.message || "Error deleting provider");
    }
  };

  const maskApiKey = (key: string | null) => {
    if (!key) return 'Not Configured';
    if (key.length <= 4) return '••••';
    return `••••••••${key.slice(-4)}`;
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SMM Providers</h1>
          <p className="text-muted-foreground">Manage your SMM API connections and service imports.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add New Provider
        </Button>
      </div>

      {loading && providers.length === 0 ? (
        <div className="flex justify-center p-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : providers.length === 0 ? (
        <Card className="border-dashed border-2 flex flex-col items-center justify-center p-12 text-center">
          <Database className="h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle>No Providers Found</CardTitle>
          <CardDescription className="mt-2 mb-6">
            Connect your first SMM panel to start importing services and fulfilling orders.
          </CardDescription>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Your First Provider
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <Card key={provider.id} className="overflow-hidden group hover:border-primary/50 transition-colors">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{provider.name}</CardTitle>
                    <div className="flex flex-col text-xs text-muted-foreground truncate max-w-[200px]">
                      <div className="flex items-center">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {provider.api_url}
                      </div>
                      <div className="font-semibold text-primary mt-1">API: {provider.api_version || 'v2'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={provider.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                      {provider.status}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleStatus(provider.id, provider.status);
                        }}
                        title={provider.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {provider.status === 'active' ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          deleteProvider(provider.id);
                        }}
                        title="Delete Provider"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="text-muted-foreground flex items-center"><Activity className="h-3 w-3 mr-1" /> Status</div>
                    <div className="font-medium text-green-600 flex items-center">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Configured
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground flex items-center"><History className="h-3 w-3 mr-1" /> Last Sync</div>
                    <div className="font-medium">{provider.last_sync ? new Date(provider.last_sync).toLocaleDateString() : 'Never'}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Wallet className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm font-medium">Balance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{getCurrencySymbol(String(provider.currency || 'USDT'))}{(Number(provider.balance) || 0).toFixed(2)} <span className="text-[10px] text-muted-foreground font-medium">{String(provider.currency || 'USDT')}</span></span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => refreshBalance(provider.id)}
                      disabled={refreshingStates[provider.id] === 'loading'}
                    >
                      {refreshingStates[provider.id] === 'loading' ? 
                        <RefreshCw className="h-3 w-3 animate-spin" /> : 
                        refreshingStates[provider.id] === 'success' ? 
                        <Check className="h-3 w-3 text-green-500" /> :
                        refreshingStates[provider.id] === 'error' ?
                        <XCircle className="h-3 w-3 text-red-500" /> :
                        <RefreshCw className="h-3 w-3" />
                      }
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link to="/management/providers/$id/services" params={{ id: provider.id }}>
                    <Button variant="outline" className="w-full justify-start text-xs h-9">
                      <Plus className="h-3 w-3 mr-2" /> Services
                    </Button>
                  </Link>
                  <Link to="/management/providers/$id/settings" params={{ id: provider.id }}>
                    <Button variant="outline" className="w-full justify-start text-xs h-9">
                      <Settings className="h-3 w-3 mr-2" /> Settings
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Provider Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-4 top-4" 
                onClick={() => setShowAddModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <CardTitle>Add SMM Provider</CardTitle>
              <CardDescription>Connect a new SMM panel via API.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Main SMM Provider" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiUrl">API URL</Label>
                  <Input 
                    id="apiUrl" 
                    placeholder="https://provider-domain.com/api/v2" 
                    required 
                    type="url"
                    value={formData.apiUrl}
                    onChange={(e) => setFormData({...formData, apiUrl: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiVersion">API Version</Label>
                  <select 
                    id="apiVersion"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.apiVersion}
                    onChange={(e) => setFormData({...formData, apiVersion: e.target.value})}
                  >
                    <option value="v2">Version 2 (v2)</option>
                    <option value="v3">Version 3 (v3)</option>
                    <option value="v4">Version 4 (v4)</option>
                    <option value="latest">Latest Supported</option>
                    <option value="custom">Custom / Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <div className="relative">
                    <Input 
                      id="apiKey" 
                      placeholder="Enter provider API key" 
                      required 
                      type="password"
                      value={formData.apiKey}
                      onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                    />
                    <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="hidden">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <select 
                      id="currency"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.currency}
                      onChange={(e) => setFormData({...formData, currency: e.target.value})}
                    >
                      <option value="USDT">USDT</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-end">
                     <Button 
                      type="button" 
                      variant="outline"
                      className="w-full"
                      onClick={handleTestConnection}
                      disabled={testStatus === 'loading'}
                    >
                      {testStatus === 'loading' ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : testStatus === 'success' ? <Check className="h-4 w-4 mr-2" /> : testStatus === 'error' ? <XCircle className="h-4 w-4 mr-2" /> : <Activity className="h-4 w-4 mr-2" />}
                      {testStatus === 'loading' ? 'Testing...' : testStatus === 'success' ? 'Success' : testStatus === 'error' ? 'Failed' : 'Test API'}
                    </Button>
                  </div>
                </div>
                
                {testMessage && (
                  <div className={`text-xs p-2 rounded ${testStatus === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {testMessage}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input 
                    id="notes" 
                    placeholder="Internal reference..." 
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </CardContent>
              <div className="p-6 pt-0 flex gap-3">
                <Button variant="outline" className="flex-1" type="button" onClick={() => setShowAddModal(false)} disabled={saveStatus === 'loading'}>Cancel</Button>
                <Button 
                  className="flex-1" 
                  type="submit" 
                  disabled={saveStatus === 'loading' || saveStatus === 'success'}
                  variant={saveStatus === 'success' ? 'secondary' : saveStatus === 'error' ? 'destructive' : 'default'}
                >
                  {saveStatus === 'loading' ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : saveStatus === 'success' ? <Check className="h-4 w-4 mr-2" /> : saveStatus === 'error' ? <XCircle className="h-4 w-4 mr-2" /> : null}
                  {saveStatus === 'loading' ? 'Saving...' : saveStatus === 'success' ? 'Saved' : saveStatus === 'error' ? 'Try Again' : 'Save Provider'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
