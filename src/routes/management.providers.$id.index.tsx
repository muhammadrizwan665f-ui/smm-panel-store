import { createFileRoute, Outlet, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ExternalLink, RefreshCw, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { adminGetProvider } from '@/lib/admin/admin.functions'
import { testConnection, getProviderBalance } from '@/lib/providers/provider.functions'
import { getCurrencySymbol } from '@/lib/currency.constants'

export const Route = createFileRoute('/management/providers/$id/')({
  component: ProviderDetailView,
})

function ProviderDetailView() {
  const { id } = Route.useParams()
  const [provider, setProvider] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [testingConnection, setTestingConnection] = useState(false)
  const [refreshingBalance, setRefreshingBalance] = useState(false)

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const res = JSON.parse(await adminGetProvider({ data: { id } }))
        if (!res.success) throw new Error(res.message)
        setProvider(res.data)
      } catch (error: any) {
        setLoadError(error?.message || 'Failed to load provider')
      } finally {
        setLoading(false)
      }
    }
    fetchProvider()
  }, [id])

  const fetchProvider = async () => {
    try {
      const res = JSON.parse(await adminGetProvider({ data: { id } }))
      if (!res.success) throw new Error(res.message)
      setProvider(res.data)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to reload provider')
    }
  }

  const handleTestConnection = async () => {
    if (testingConnection) return
    setTestingConnection(true)
    try {
      const resJson = await testConnection({ 
        data: { 
          apiUrl: provider.api_url, 
          apiKey: provider.api_key,
          apiVersion: provider.api_version 
        } 
      })
      const res = JSON.parse(resJson)
      if (res.success) {
        toast.success(res.message)
        fetchProvider()
      } else {
        toast.error(res.message)
      }
    } catch (e: any) {
      toast.error(e.message || "Test failed")
    } finally {
      setTestingConnection(false)
    }
  }

  const handleRefreshBalance = async () => {
    if (refreshingBalance) return
    setRefreshingBalance(true)
    try {
      const resJson = await getProviderBalance({ data: { providerId: id } })
      const res = JSON.parse(resJson)
      if (res.balance !== undefined) {
        toast.success(`Balance updated`)
        fetchProvider()
      } else if (res.error) {
        toast.error(res.error)
      }
    } catch (e: any) {
      toast.error(e.message || "Balance check failed")
    } finally {
      setRefreshingBalance(false)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (loadError) return (
    <div className="p-8 text-center space-y-3">
      <p className="font-black uppercase tracking-widest text-red-500">Failed to load provider</p>
      <p className="text-xs text-muted-foreground break-words">{loadError}</p>
    </div>
  )
  if (!provider) return <div className="p-8 text-center">Provider not found</div>

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/management/providers">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">{provider.name}</h1>
          <p className="text-sm text-muted-foreground">{provider.api_url}</p>
        </div>
      </div>

      <div className="flex border-b bg-white rounded-t-xl overflow-hidden">
        <Link 
          to="/management/providers/$id" 
          params={{ id }}
          activeProps={{ className: 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50' }}
          className="px-6 py-3 text-sm font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
        >
          Details
        </Link>
        <Link 
          to="/management/providers/$id/services" 
          params={{ id }}
          activeProps={{ className: 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50' }}
          className="px-6 py-3 text-sm font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
        >
          Services
        </Link>
        <Link 
          to="/management/providers/$id/settings" 
          params={{ id }}
          activeProps={{ className: 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50' }}
          className="px-6 py-3 text-sm font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
        >
          Settings
        </Link>
      </div>

      <div className="bg-white p-8 rounded-b-xl border-x border-b shadow-sm space-y-8">
          {/* Simple Details View */}
          <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Connection Info</h3>
                  <div className="space-y-2">
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-xs font-bold text-gray-500 uppercase">API Version</span>
                          <span className="text-xs font-black">{provider.api_version}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-xs font-bold text-gray-500 uppercase">Provider API Currency</span>
                          <span className="text-xs font-black">{provider.currency}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-xs font-bold text-gray-500 uppercase">Status</span>
                          <span className="text-xs font-black text-green-600 uppercase">{provider.status}</span>
                      </div>
                  </div>
              </div>

              <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Financial Info</h3>
                  <div className="space-y-2">
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-xs font-bold text-gray-500 uppercase">Current Balance ({provider.currency || 'USDT'})</span>
                          <span className="text-xs font-black">{getCurrencySymbol(String(provider.currency || 'USDT'))}{(Number(provider.balance) || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-xs font-bold text-gray-500 uppercase">Last Sync</span>
                          <span className="text-xs font-black">{provider.last_sync ? new Date(provider.last_sync).toLocaleString() : 'Never'}</span>
                      </div>
                  </div>
              </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline"
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="font-black uppercase tracking-widest text-xs px-8 py-6 rounded-2xl border-yellow-200 hover:bg-yellow-50 text-yellow-700"
              >
                <Zap size={16} className={`mr-2 ${testingConnection ? 'animate-pulse' : ''}`} />
                Test Connection
              </Button>
              <Button 
                variant="outline"
                onClick={handleRefreshBalance}
                disabled={refreshingBalance}
                className="font-black uppercase tracking-widest text-xs px-8 py-6 rounded-2xl"
              >
                <RefreshCw size={16} className={`mr-2 ${refreshingBalance ? 'animate-spin' : ''}`} />
                Refresh Balance
              </Button>
              <Link to="/management/providers/$id/services" params={{ id }}>
                  <Button className="w-full md:w-auto font-black uppercase tracking-widest text-xs px-8 py-6 rounded-2xl">
                      Manage Services
                  </Button>
              </Link>
          </div>
      </div>
    </div>
  )
}
