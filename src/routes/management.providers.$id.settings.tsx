import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { adminDeleteProvider } from '@/lib/admin/admin.functions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Save, Trash2 } from 'lucide-react'


export const Route = createFileRoute('/management/providers/$id/settings')({
  component: ProviderSettings,
})

function ProviderSettings() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<any>({
    name: '',
    api_url: '',
    api_key: '',
    currency: 'USDT',
    api_version: 'v2',
    status: 'active',
    notes: ''
  })

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const { data, error } = await supabase.from('providers').select('*').eq('id', id).maybeSingle()
        if (error) throw error
        if (data) {
          const p = data as any
          setFormData({
            name: p.name || '',
            api_url: p.api_url || '',
            api_key: p.api_key || '',
            currency: 'USDT', // Always USDT internally for API
            api_version: p.api_version || 'v2',
            status: p.status || 'active',
            notes: p.notes || ''
          })
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to load provider")
      } finally {
        setLoading(false)
      }
    }

    fetchProvider()
  }, [id])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('providers').update({
        name: formData.name,
        api_url: formData.api_url,
        api_key: formData.api_key,
        api_version: formData.api_version,
        currency: formData.currency,
        status: formData.status,
        notes: formData.notes,
      }).eq('id', id)

      if (error) throw error
      toast.success("Provider updated successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to update provider")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this provider? All its services will be deactivated. This cannot be undone.')) return
    setLoading(true)
    try {
      const res = JSON.parse(await adminDeleteProvider({ data: { id } }) as string)
      if (!res.success) throw new Error(res.message)
      toast.success('Provider deleted')
      navigate({ to: '/management/providers' })
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete provider')
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>


  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-xl font-semibold">API Settings</h2>
      
      <form onSubmit={handleUpdate} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Provider Name</Label>
          <Input 
            id="name" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="url">API URL</Label>
          <Input 
            id="url" 
            value={formData.api_url} 
            onChange={e => setFormData({...formData, api_url: e.target.value})} 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="version">API Version</Label>
          <select 
            id="version"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={formData.api_version}
            onChange={e => setFormData({...formData, api_version: e.target.value})}
          >
            <option value="v2">Version 2 (v2)</option>
            <option value="v3">Version 3 (v3)</option>
            <option value="v4">Version 4 (v4)</option>
            <option value="latest">Latest Supported</option>
            <option value="custom">Custom / Other</option>
          </select>
        </div>

        <div className="hidden">
          <Input 
            type="hidden"
            value="USDT" 
            onChange={e => setFormData({...formData, currency: 'USDT'})} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="key">API Key</Label>
          <Input 
            id="key" 
            type="password"
            value={formData.api_key} 
            onChange={e => setFormData({...formData, api_key: e.target.value})} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="desc">Internal Notes</Label>
          <Input 
            id="desc" 
            value={formData.notes} 
            onChange={e => setFormData({...formData, notes: e.target.value})} 
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          Update Provider
        </Button>
      </form>

      <div className="rounded-lg border border-destructive/40 p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-destructive">Danger Zone</h3>
          <p className="text-sm text-muted-foreground">Deleting this provider deactivates all of its linked services.</p>
        </div>
        <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Provider
        </Button>
      </div>
    </div>

  )
}
