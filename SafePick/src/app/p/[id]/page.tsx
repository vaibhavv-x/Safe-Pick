import { CheckCircle, AlertTriangle, ShieldCheck, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type PublicOrderDetails = {
  order_id: string;
  created_at: string;
  rack_number: string | null;
  qr_code_base64: string;
};

export default async function PublicTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  let order: PublicOrderDetails | null = null;
  let errorStr = null;

  try {
    // Next.js server runs on the same machine as the backend, so localhost:4000 works securely!
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const res = await fetch(`${apiUrl}/api/public/tracking/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!res.ok) {
      errorStr = "Order not found";
    } else {
      order = await res.json();
    }
  } catch (err: any) {
    errorStr = err.message || "Failed to fetch";
  }

  if (errorStr || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="glass max-w-md w-full border-destructive/20 bg-destructive/5 text-center p-8">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-destructive mb-2">Unavailable</h2>
          <p className="text-muted-foreground">This tracking link is invalid or the parcel has been removed.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="glass-card max-w-xl w-full border-white/10 glow-orange overflow-hidden">
        <div className="bg-accent/10 pt-10 pb-6 text-center border-b border-white/5">
          <div className="mx-auto h-16 w-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold font-headline">Order Successfully Secured</h1>
          <p className="text-sm text-muted-foreground mt-2 flex items-center justify-center gap-1">
            <ShieldCheck className="h-4 w-4" /> Secure ID verified and stored
          </p>
        </div>

        <CardContent className="p-8 space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">System Unique ID</p>
                <p className="font-mono font-bold text-primary">{order.order_id}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Storage Timestamp</p>
                <p className="font-medium text-sm">{new Date(order.created_at).toLocaleString()}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Storage Location</p>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium text-sm">{order.rack_number || "Awaiting Placement"}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center">
              <div className="bg-white p-2 rounded-lg mb-4">
                <img src={order.qr_code_base64} alt={`QR for ${order.order_id}`} className="w-40 h-40 object-contain" />
              </div>
              <h3 className="font-bold text-sm">Encrypted Token QR</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">LINKED TO {order.order_id}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
