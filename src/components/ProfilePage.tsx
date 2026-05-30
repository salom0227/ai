import React, { useState } from "react";
import { User, Shield, Phone, Mail, UserCheck, Calendar, LogOut, ArrowRight, Sparkles, Bot, CheckCircle } from "lucide-react";
import { User as UserType, Order } from "../types";

interface ProfilePageProps {
  currentUser: UserType | null;
  orders: Order[];
  onLogin: (user: UserType) => void;
  onLogout: () => void;
  onNavigateHome: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser,
  orders,
  onLogin,
  onLogout,
  onNavigateHome,
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "owner">("customer");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (isRegisterMode) {
        // Register Call
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName, email, phone, password, role }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setSuccessMsg("Ro'yxatdan o'tish muvaffaqiyatli yakunlandi! Tizimga kirilmoqda...");
          setTimeout(() => {
            onLogin(data.user);
          }, 1500);
        } else {
          setError(data.message || "Ro'yxatdan o'tishda xatolik yuz berdi.");
        }
      } else {
        // Login Call
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setSuccessMsg("Tizimga muvaffaqiyatli kirdingiz!");
          setTimeout(() => {
            onLogin(data.user);
          }, 1000);
        } else {
          setError(data.message || "Elektron pochta yoki parol noto'g'ri.");
        }
      }
    } catch (err) {
      setError("Server bilan aloqa o'rnatib bo'lmadi. Keyinroq qayta urining.");
    } finally {
      setLoading(false);
    }
  };

  // Filter client's orders
  const userOrders = currentUser ? orders.filter(o => o.userId === currentUser.id) : [];

  return (
    <div className="max-w-4xl mx-auto my-6 animate-fade-in" id="profile-auth-workspace">
      {currentUser ? (
        // LOGGED IN USER VIEW
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Profile Card Info */}
          <div className="md:col-span-5 glass-panel p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                <img
                  src={currentUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80"}
                  alt={currentUser.fullName}
                  className="w-16 h-16 rounded-full border border-cyan-400 object-cover shadow-lg shadow-cyan-500/10"
                />
                <div>
                  <h3 className="font-black text-sm text-white tracking-wide uppercase">{currentUser.fullName}</h3>
                  <div className="flex items-center gap-1.5 mt-1 text-cyan-400 font-mono text-[9px] uppercase tracking-wider">
                    <Shield className="w-3 h-3" />
                    <span>{currentUser.role === "admin" ? "Sistem Ma'muri" : currentUser.role === "owner" ? "Atelier Hamkori" : "Mijoz (VIP)"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-xs font-light text-white/70">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-cyan-400">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-white/40 uppercase font-bold tracking-wider">Elektron Pochta</span>
                    <span className="text-white font-mono">{currentUser.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-cyan-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-white/40 uppercase font-bold tracking-wider">Telefon Raqam</span>
                    <span className="text-white font-mono">{currentUser.phone || "Kiritilmagan"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-cyan-400">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-white/40 uppercase font-bold tracking-wider">A'zolik Sanasi</span>
                    <span className="text-white font-mono">{new Date(currentUser.createdAt || "").toLocaleDateString("uz-UZ")}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-bold tracking-wider uppercase transition cursor-pointer text-xs"
              >
                <LogOut className="w-4 h-4" />
                Hisobdan Chiqish
              </button>
            </div>
          </div>

          {/* Orders / Activity history */}
          <div className="md:col-span-7 space-y-6">
            <div className="glass-panel p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h4 className="font-black text-xs text-uppercase tracking-wider text-cyan-400 uppercase">Buyurtmalarim tarixi</h4>
                <span className="bg-cyan-500/10 text-cyan-400 rounded-full px-2 py-0.5 font-mono font-bold text-[9px]">
                  {userOrders.length} TA
                </span>
              </div>

              {userOrders.length === 0 ? (
                <div className="py-12 text-center text-white/40 space-y-3">
                  <Bot className="w-10 h-10 text-white/20 mx-auto" />
                  <p>Sizda hali hech qanday xarid buyurtmasi mavjud emas.</p>
                  <button
                    onClick={onNavigateHome}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-white transition text-xs font-bold"
                  >
                    Bosh sahifaga qaytish
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {userOrders.map((ord) => (
                    <div key={ord.id} className="p-3 bg-slate-950/40 rounded-xl border border-white/5 flex gap-3 items-center justify-between">
                      <div className="flex gap-3 items-center min-w-0">
                        <img
                          src={ord.items?.[0]?.productImage || "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=150&q=80"}
                          className="w-10 h-10 object-cover rounded-lg"
                        />
                        <div className="min-w-0">
                          <h5 className="font-bold text-white text-[11px] truncate">
                            {ord.items?.[0]?.productTitle || "Xarid mahsuloti"} 
                            {ord.items && ord.items.length > 1 && ` + ${ord.items.length - 1} mahsulot`}
                          </h5>
                          <span className="text-[9px] text-white/40 block font-mono">{new Date(ord.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block font-black text-cyan-400 font-mono">${ord.totalAmount}</span>
                        <span className="text-[8px] uppercase font-black text-emerald-400">Tasdiqlangan</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-panel p-6 bg-gradient-to-r from-cyan-950/20 to-slate-950 border border-cyan-500/10 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h4 className="font-black text-xs text-white uppercase">Sizda eksklyuziv AI Suite ruxsati bor!</h4>
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed">
                Akkauntingiz faollashtirilganligi sababli, virtual kiyib ko'rish, ipak uyg'unligini tekshirish va shaxsiy stilist maslahatlaridan cheksiz foydalanishingiz mumkin.
              </p>
            </div>
          </div>

        </div>
      ) : (
        // AUTHENTICATION LOGIN / REGISTER CARD
        <div className="max-w-md mx-auto glass-panel p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-block p-3 rounded-2xl bg-cyan-500/15 border border-cyan-400/20 text-cyan-400 mb-2">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="font-black text-sm text-white uppercase">
              {isRegisterMode ? "AI MALL AKKAUNT yaratish" : "Mijozlar portaliga kirish"}
            </h3>
            <p className="text-[11px] text-white/50">
              {isRegisterMode 
                ? "Dunyodagi eng hashamatli o'zbek moda online bozorida premium AI imkoniyatlardan foydalanish uchun ro'yxatdan o'ting" 
                : "Buyurtmalarni rasmiylashtirish va aqlli AI stilistlari bilan ishlash uchun profilingizga kiring"}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-center text-red-400 text-xs font-bold font-mono">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-center text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4 text-xs">
            {isRegisterMode && (
              <>
                <div>
                  <label className="block text-white/50 mb-1 font-bold uppercase tracking-wider text-[10px]">To'liq Ism-Familiyangiz</label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Shahzod Qalandarov"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400 font-sans transition-all"
                  />
                </div>

                <div>
                  <label className="block text-white/50 mb-1 font-bold uppercase tracking-wider text-[10px]">Telefon Raqam</label>
                  <input
                    type="tel"
                    required
                    placeholder="Masalan: +998 91 234 56 78"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400 font-sans transition-all"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-white/50 mb-1 font-bold uppercase tracking-wider text-[10px]">Elektron Pochta manzili (Email)</label>
              <input
                type="email"
                required
                placeholder="e.g. customer@aimall.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400 font-mono transition-all"
              />
            </div>

            <div>
              <label className="block text-white/50 mb-1 font-bold uppercase tracking-wider text-[10px]">Maxfiy Parol</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400 font-sans transition-all"
              />
            </div>

            {isRegisterMode && (
              <div>
                <label className="block text-white/50 mb-1 font-bold uppercase tracking-wider text-[10px]">Sizning rolingiz (Hisob turi)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "customer" | "owner")}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400 font-sans cursor-pointer"
                >
                  <option value="customer">Sotib oluvchi Mijoz</option>
                  <option value="owner">Sotuvchi (Do'kon va Atelier egasi)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide disabled:opacity-50"
            >
              {loading ? "Jarayon bajarilmoqda..." : isRegisterMode ? "Hisobni Ro'yxatdan O'tkazish" : "Tizimga Kirish"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="border-t border-white/5 pt-4 text-center">
            <button
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setError("");
              }}
              className="text-cyan-400 hover:text-cyan-300 font-bold transition text-[11px]"
            >
              {isRegisterMode 
                ? "Sizda allaqachon akkaunt bormi? Tizimga kiring" 
                : "Hali ro'yxatdan o'tmaganmisiz? Bepul akkaunt yarating"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
