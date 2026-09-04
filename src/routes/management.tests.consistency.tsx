import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { runOrderConsistencyTest } from '@/lib/providers/test.functions';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, PlayCircle } from 'lucide-react';

export const Route = createFileRoute('/management/tests/consistency')({
  component: ConsistencyTestPage,
});

function ConsistencyTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const runTestFn = useServerFn(runOrderConsistencyTest);

  const startTest = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      // 1. Create a dummy order
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) throw new Error("Not authenticated");

      // Get any service
      const { data: services } = await supabase.from('services').select('id, name').limit(1);
      const service = services?.[0];
      if (!service) throw new Error("No services found to test with");

      const serviceId = service.id;
      const orderId = crypto.randomUUID();

      console.log(`[Test] Creating order ${orderId} for test...`);

      const { error: insertError } = await supabase.from('orders').insert({
        id: orderId,
        user_id: user.id,
        service_id: serviceId,
        service_name: "CONSISTENCY TEST",
        quantity: 100,
        price: 0,
        status: 'pending',
        link: 'https://example.com'
      });

      if (insertError) throw new Error(`Insert failed: ${insertError.message}`);

      // 2. Immediately call the server function
      const testResult = await runTestFn({ data: { orderId } });
      setResult({ ...testResult, orderId });

      // 3. Cleanup
      await supabase.from('orders').delete().eq('id', orderId);

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consistency & Retry Test</h1>
          <p className="text-muted-foreground">Verify server-side lookup reliability and retry logic.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Run Order ID Verification Test</CardTitle>
          <CardDescription>
            This test creates a temporary order and immediately asks the server to find it. 
            It verifies that the server-side `supabaseAdmin` client can see the data inserted via the client-side `supabase` client.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={startTest} 
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Test...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Start Test
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className={result.found ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
              {result.found ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
              <AlertTitle>{result.found ? "Success: Order Found" : "Simulation: Order Not Found Initially"}</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-1 text-sm">
                  <p><strong>Order ID:</strong> {result.orderId}</p>
                  <p><strong>Message:</strong> {result.message}</p>
                  <p><strong>Database Visible:</strong> {result.found ? "Yes" : "No"}</p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        <h3 className="font-semibold text-foreground mb-2">How it works:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>The client inserts a row into the <code>orders</code> table.</li>
          <li>The client immediately triggers a server function to fetch that same row.</li>
          <li>The server uses <code>supabaseAdmin</code> (service role) to query the database.</li>
          <li>This confirms the server-side environment is correctly configured to see client-inserted data.</li>
        </ul>
      </div>
    </div>
  );
}
