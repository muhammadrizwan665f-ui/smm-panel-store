import React from "react";
import QRCode from "qrcode";
import { Loader2, CheckCircle2, XCircle, Clock, Download, Copy } from "lucide-react";
import { toast } from "sonner";
import { getDepositStatus, cancelDeposit } from "@/lib/payments/payments.functions";

type Props = {
  depositId: string;
  referenceId: string;
  amount: number;
  qr: string;
  expiresAt: string;
  instructions?: string | null;
  symbol: string;
  onDone: () => void;
  onClose: () => void;
};

/** BharatPays may return a data-URI, an image URL, or a raw UPI/QR string. */
function useQrImage(qr: string) {
  const [src, setSrc] = React.useState<string | null>(null);
  React.useEffect(() => {
    let alive = true;
    const value = qr.trim();
    if (value.startsWith("data:image") || /^https?:\/\/.+\.(png|jpe?g|svg|webp)(\?.*)?$/i.test(value)) {
      setSrc(value);
      return;
    }
    if (/^[A-Za-z0-9+/=\s]{200,}$/.test(value)) {
      setSrc(`data:image/png;base64,${value.replace(/\s/g, "")}`);
      return;
    }
    QRCode.toDataURL(value, { width: 512, margin: 1 })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(null));
    return () => {
      alive = false;
    };
  }, [qr]);
  return src;
}

const POLL_SCHEDULE = [10, 20, 30, 45, 60];

export function BharatPayQr(props: Props) {
  const { depositId, referenceId, amount, qr, expiresAt, instructions, symbol, onDone, onClose } = props;
  const qrSrc = useQrImage(qr);
  const [status, setStatus] = React.useState<string>("pending");
  const [note, setNote] = React.useState<string | null>(null);
  const [remaining, setRemaining] = React.useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)),
  );

  React.useEffect(() => {
    const t = setInterval(() => {
      setRemaining(Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  React.useEffect(() => {
    let stopped = false;
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (stopped) return;
      try {
        const res = JSON.parse(await getDepositStatus({ data: { depositId } }));
        if (res.success && !stopped) {
          const s = String(res.data.status);
          setStatus(s);
          setNote(res.data.note ?? null);
          if (s === "approved") {
            toast.success(`${symbol}${amount.toFixed(2)} added to your wallet`);
            onDone();
            return;
          }
          if (s === "rejected" || s === "failed" || s === "expired" || s === "cancelled") return;
        }
      } catch {
        /* keep polling */
      }
      const delay = (POLL_SCHEDULE[attempt] ?? 15) * 1000;
      attempt += 1;
      timer = setTimeout(poll, delay);
    };

    timer = setTimeout(poll, POLL_SCHEDULE[0]! * 1000);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [depositId, amount, symbol, onDone]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const expired = remaining <= 0 || status === "expired";

  const cancel = async () => {
    await cancelDeposit({ data: { depositId } });
    onClose();
  };

  return (
    <div className="space-y-5">
      <div className="p-6 bg-secondary/30 rounded-[2rem] flex flex-col items-center gap-3 border border-white/50">
        {qrSrc ? (
          <img src={qrSrc} alt="BharatPay payment QR code" className="w-56 h-56 object-contain rounded-2xl bg-white p-3" />
        ) : (
          <div className="w-56 h-56 rounded-2xl bg-white flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={26} />
          </div>
        )}
        <p className="text-2xl font-black text-foreground tracking-tighter">
          {symbol}
          {amount.toFixed(2)}
        </p>
        <button
          onClick={() => {
            navigator.clipboard.writeText(referenceId);
            toast.success("Order ID copied");
          }}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
        >
          <Copy size={12} /> {referenceId}
        </button>
      </div>

      <div
        className={`flex items-center gap-3 p-4 rounded-[1.5rem] border ${
          status === "approved"
            ? "bg-green-500/5 border-green-500/10 text-green-700"
            : expired || status === "rejected" || status === "failed"
              ? "bg-red-500/5 border-red-500/10 text-red-600"
              : "bg-amber-500/5 border-amber-500/10 text-amber-700"
        }`}
      >
        {status === "approved" ? (
          <CheckCircle2 size={18} />
        ) : expired || status === "rejected" || status === "failed" ? (
          <XCircle size={18} />
        ) : (
          <Loader2 size={18} className="animate-spin" />
        )}
        <div className="flex-1">
          <p className="text-[11px] font-black uppercase tracking-widest">
            {status === "approved"
              ? "Payment successful"
              : status === "rejected" || status === "failed"
                ? "Payment failed"
                : expired
                  ? "QR expired"
                  : "Waiting for payment..."}
          </p>
          {note && <p className="text-[10px] font-bold opacity-70 mt-0.5">{note}</p>}
        </div>
        {!expired && status === "pending" && (
          <span className="flex items-center gap-1 text-[11px] font-black font-mono">
            <Clock size={13} /> {mm}:{ss}
          </span>
        )}
      </div>

      <div className="p-4 bg-secondary/40 rounded-[1.5rem] text-[10px] font-bold uppercase tracking-tighter text-muted-foreground leading-relaxed space-y-1">
        <p>1. Open any UPI application.</p>
        <p>2. Scan the QR code.</p>
        <p>3. Pay the exact amount shown.</p>
        <p>4. Keep this page open while payment is being verified.</p>
        {instructions && <p className="pt-1 normal-case tracking-normal">{instructions}</p>}
      </div>

      <div className="flex gap-3">
        <button onClick={cancel} className="px-6 py-4 rounded-[2rem] bg-secondary/50 text-muted-foreground font-black text-xs uppercase tracking-widest active:scale-95">
          Cancel
        </button>
        {qrSrc && (
          <a
            href={qrSrc}
            download={`${referenceId}.png`}
            className="flex-1 gradient-primary text-white py-4 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/30 active:scale-95 flex items-center justify-center gap-2"
          >
            <Download size={18} /> Download QR
          </a>
        )}
      </div>
    </div>
  );
}
