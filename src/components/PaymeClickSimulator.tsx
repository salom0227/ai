import React, { useState } from "react";
import { CheckCircle2, Shield, CreditCard, Send, Sparkles } from "lucide-react";

interface PaymentSimulatorProps {
  method: "payme" | "click" | "uzumbank" | "stripe";
  amount: number;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}

export const PaymeClickSimulator: React.FC<PaymentSimulatorProps> = ({
  method,
  amount,
  onSuccess,
  onCancel,
}) => {
  const [step, setStep] = useState<"details" | "sms" | "success">("details");
  const [phoneNumber, setPhoneNumber] = useState("+998 (90) ");
  const [smsCode, setSmsCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState("");

  const getMethodTheme = () => {
    switch (method) {
      case "payme":
        return {
          title: "Payme Online To'lov",
          color: "border-cyan-400 text-cyan-400",
          bg: "bg-cyan-500/10",
          accentColor: "bg-cyan-400 text-black hover:bg-cyan-300",
        };
      case "click":
        return {
          title: "Click.uz To'lov Tizimi",
          color: "border-blue-400 text-blue-400",
          bg: "bg-blue-400/10",
          accentColor: "bg-blue-500 text-white hover:bg-blue-400",
        };
      case "uzumbank":
        return {
          title: "Uzum Bank To'lov",
          color: "border-purple-400 text-purple-400",
          bg: "bg-purple-500/10",
          accentColor: "bg-purple-600 text-white hover:bg-purple-500",
        };
      case "stripe":
      default:
        return {
          title: "Stripe Halqaro To'lov",
          color: "border-indigo-400 text-indigo-400",
          bg: "bg-indigo-500/10",
          accentColor: "bg-indigo-600 text-white hover:bg-indigo-500",
        };
    }
  };

  const theme = getMethodTheme();

  const handleSendRequest = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("sms");
    }, 1200);
  };

  const handleVerifyOtp = () => {
    if (smsCode.trim().length === 0) {
      alert("Iltimos, SMS kodni kiriting (Ixtiyoriy kod, masalan: 55555)");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("success");
    }, 1500);
  };

  const handleFinish = () => {
    const mockPaymentId = `PAY-${Math.floor(Math.random() * 10000000)}`;
    onSuccess(mockPaymentId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className={`w-full max-w-md glass-panel p-6 border-t-2 ${theme.color} shadow-2xl space-y-6 relative overflow-hidden`}>
        {/* Orqa fondagi dekorativ chiziq */}
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full filter blur-[50px] opacity-20 ${theme.bg}`}></div>

        <div className="flex justify-between items-center pb-3 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-cyan-400" />
            <h3 className="font-extrabold text-sm text-white">{theme.title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-xs text-white/50 hover:text-white cursor-pointer px-2 py-1 rounded bg-white/5 transition-all"
          >
            Bekor qilish
          </button>
        </div>

        {step === "details" && (
          <div className="space-y-4 relative z-10" id="step-payment-details">
            <div className="text-center py-4 bg-white/[0.02] border border-white/5 rounded-2xl">
              <p className="text-xs text-white/40">To'lov jami summasi</p>
              <h1 className="text-2xl font-black text-white py-1">
                ${amount.toLocaleString()}
              </h1>
              <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-extrabold flex items-center justify-center gap-1">
                <Shield className="w-3 h-3 animate-pulse" /> Xavfsiz Shifrlash Faol
              </p>
            </div>

            {method === "stripe" ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] text-white/50 mb-1">Karta raqami</label>
                  <input
                    type="text"
                    placeholder="4444 8888 1111 2222"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-white/50 mb-1">Mulkdor</label>
                    <input
                      type="text"
                      placeholder="SHAHZOD ALIEV"
                      className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-white/50 mb-1">CVC / Exp</label>
                    <input
                      type="text"
                      placeholder="12/28 - 777"
                      className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] text-white/50 mb-1">
                    Telefon raqam (SMS xabarnoma uchun)
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+998 (90) 123-4567"
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
                <div className="flex items-start gap-2 p-2.5 bg-yellow-400/5 border border-yellow-400/10 rounded-lg text-[10px] text-yellow-200">
                  <span>ℹ️</span>
                  <span>
                    Simulyatsiya rejimida xavfsiz to'lov sahifasini o'tish uchun ixtiyoriy telefon raqamini kiriting.
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleSendRequest}
              disabled={loading}
              className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${theme.accentColor}`}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  To'lashni tasdiqlash
                </>
              )}
            </button>
          </div>
        )}

        {step === "sms" && (
          <div className="space-y-4 relative z-10" id="step-sms-otp">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white">Bir martalik SMS kod</h4>
              <p className="text-[11px] text-white/50 leading-relaxed">
                Biz siz kiritgan raqamga maxsus tasdiqlash kodini yubordik. To'lovni yakunlash uchun kodni kiriting.
              </p>
            </div>

            <div>
              <input
                type="text"
                placeholder="SMS kodi (masalan: 55555)"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 text-white text-center rounded-lg px-3 py-2.5 text-base font-black tracking-widest outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${theme.accentColor}`}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              ) : (
                "Kod orqali tasdiqlash"
              )}
            </button>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-5 text-center py-6 relative z-10" id="step-payment-success">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce-slow" />
            <div className="space-y-1.5">
              <h2 className="text-lg font-black text-white">To'lov Muvaffaqiyatli Yakunlandi!</h2>
              <p className="text-xs text-white/50 leading-relaxed font-light">
                Tranzaksiya muvaffaqiyatli bajarildi va tizim tomonidan tasdiqlandi. Buyurtmangiz do'kon tizimiga uzatildi.
              </p>
            </div>

            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-[11px] space-y-1 inline-block w-full text-left font-mono text-white/70">
              <div className="flex justify-between">
                <span>Tranzaksiya ID:</span>
                <span className="text-cyan-300">TXN-AIMALL-{Math.floor(Math.random() * 900000)}</span>
              </div>
              <div className="flex justify-between">
                <span>Summa:</span>
                <span className="text-emerald-400 font-bold">${amount}</span>
              </div>
              <div className="flex justify-between">
                <span>Holat:</span>
                <span className="text-green-400">Tasdiqlangan / Settled</span>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="glow-btn w-full text-black font-extrabold text-xs py-2.5 rounded-lg shadow-lg hover:shadow-cyan-400/20 cursor-pointer"
            >
              Mening buyurtmalarimga o'tish
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
