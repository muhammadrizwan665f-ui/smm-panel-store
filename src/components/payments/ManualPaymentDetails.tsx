import React from "react";
import { Download, Copy, Check, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";

interface ManualPaymentDetailsProps {
  gateway: any;
  amount: number;
  symbol: string;
  referenceId: string;
  onClose: () => void;
  onSubmitUtr: (utr: string) => Promise<void>;
}

export function ManualPaymentDetails({
  gateway,
  amount,
  symbol,
  referenceId,
  onClose,
  onSubmitUtr
}: ManualPaymentDetailsProps) {
  const [copied, setCopied] = React.useState<string | null>(null);
  const [utr, setUtr] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = async () => {
    if (!gateway.qr_image_url) return;
    try {
      const response = await fetch(gateway.qr_image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment-qr-${gateway.name}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Download failed. Long press the image to save.");
    }
  };

  const handleSubmit = async () => {
    if (!utr.trim()) {
      toast.error("Please enter the transaction UTR/ID");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmitUtr(utr.trim());
      toast.success("Payment proof submitted. Admin will verify it shortly.");
    } catch (err: any) {
      toast.error(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-black text-foreground tracking-tight uppercase">{gateway.name}</h3>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Manual Transfer</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <div className="bg-primary/5 rounded-3xl p-6 text-center space-y-1">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Pay Exactly</span>
            <div className="text-3xl font-black text-foreground tracking-tighter">{symbol}{amount.toFixed(2)}</div>
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Ref:</span>
              <span className="text-[9px] font-black text-foreground tracking-widest">{referenceId}</span>
            </div>
          </div>

          {gateway.qr_image_url && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-48 h-48 bg-white border-2 border-dashed border-gray-100 rounded-3xl p-2 flex items-center justify-center overflow-hidden">
                <img src={gateway.qr_image_url} alt="Payment QR" className="w-full h-full object-contain" />
              </div>
              <button 
                onClick={handleDownload}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
              >
                <Download size={14} /> Download QR
              </button>
            </div>
          )}

          <div className="space-y-3">
            {gateway.account_number && (
              <div className="glass-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Account Number</div>
                  <div className="text-sm font-black text-foreground">{gateway.account_number}</div>
                </div>
                <button 
                  onClick={() => handleCopy(gateway.account_number, "Account Number")}
                  className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors"
                >
                  {copied === "Account Number" ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            )}
            {gateway.iban && (
              <div className="glass-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">IBAN / Details</div>
                  <div className="text-sm font-black text-foreground">{gateway.iban}</div>
                </div>
                <button 
                  onClick={() => handleCopy(gateway.iban, "IBAN")}
                  className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors"
                >
                  {copied === "IBAN" ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            )}
            {gateway.mobile_number && (
              <div className="glass-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Mobile Number</div>
                  <div className="text-sm font-black text-foreground">{gateway.mobile_number}</div>
                </div>
                <button 
                  onClick={() => handleCopy(gateway.mobile_number, "Mobile Number")}
                  className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors"
                >
                  {copied === "Mobile Number" ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Enter Transaction UTR / ID</label>
              <input 
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                placeholder="Paste UTR here after payment"
                className="w-full bg-secondary/50 border-none rounded-2xl p-4 text-xs font-black placeholder:text-muted-foreground/30 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button 
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full gradient-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "I've Paid — Submit Proof"}
            </button>
          </div>
          
          <p className="text-[9px] text-center text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
            Payment will be verified manually by our team within 30-60 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
