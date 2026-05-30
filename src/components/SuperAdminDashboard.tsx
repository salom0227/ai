import React, { useState } from "react";
import { Star, ShieldAlert, Heart, CircleDot, AlertTriangle, Plus, Trash2, Key, Users, BookOpen, Database, Terminal, Check, Copy, Cpu, Layers, Settings, Code, Sparkles } from "lucide-react";
import { Store, Product, Order } from "../types";

interface SuperAdminDashboardProps {
  stores: Store[];
  products: Product[];
  orders: Order[];
  onFetchLatestDb: () => void;
  onLogoutAdmin: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  stores,
  products,
  orders,
  onFetchLatestDb,
  onLogoutAdmin,
}) => {
  // Brand creation form
  const [newStoreForm, setNewStoreForm] = useState({
    name: "",
    ownerName: "",
    ownerEmail: "",
    commissionRate: "10",
  });

  // Admin access credential generation response pouch
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    store: Store;
    owner: { email: string; password: string };
  } | null>(null);

  // PostgreSQL Database Migration States
  const [selectedStyle, setSelectedStyle] = useState<"brutalist" | "cyber" | "luxury">("cyber");
  const [migrationScript, setMigrationScript] = useState<{ ddl: string; seeding: string; fullScript: string } | null>(null);
  const [loadingScript, setLoadingScript] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [copiedType, setCopiedType] = useState<"ddl" | "seed" | null>(null);

  const fetchMigrationData = async () => {
    setLoadingScript(true);
    try {
      const res = await fetch("/api/postgres/migration-script");
      if (res.ok) {
        const data = await res.json();
        setMigrationScript(data);
      }
    } catch (err) {
      console.error(err);
      alert("SQL skriptlarni yuklashda xatolik yuz berdi.");
    } finally {
      setLoadingScript(false);
    }
  };

  const runMigrationSim = async () => {
    setSimulating(true);
    setSimulationLogs(["[START] Aloqalar va jadvallar tahlili boshlanmoqda..."]);
    try {
      const res = await fetch("/api/postgres/run-migration-simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designVariant: selectedStyle })
      });
      if (res.ok) {
        const data = await res.json();
        
        let currentIdx = 0;
        const interval = setInterval(() => {
          if (currentIdx < data.logs.length) {
            setSimulationLogs(prev => [...prev, data.logs[currentIdx]]);
            currentIdx++;
          } else {
            clearInterval(interval);
            setSimulating(false);
          }
        }, 120);
      }
    } catch (err) {
      setSimulationLogs(prev => [...prev, "[XATOLIK] Migratsiya simulyatsiyasini serverda boshlash muvaffaqiyatsiz tugadi."]);
      setSimulating(false);
    }
  };

  const handleCopySQL = (text: string, type: "ddl" | "seed") => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Stats
  const globalTurnover = products.reduce((sum, p) => sum + (p.price * (p.salesCount || 0)), 0) + 12450;
  const adminCommissionsEarned = stores.reduce((sum, s) => {
    // Collect 10% on average or custom commission rate
    const storeTurnover = products.filter(p => p.storeId === s.id).reduce((sumProd, p) => sumProd + (p.price * (p.salesCount || 0)), 0);
    return sum + (storeTurnover * (s.commissionRate / 100));
  }, 0) + 1245;

  // Submit create Store Brand
  const handleRegisterBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreForm.name.trim() || !newStoreForm.ownerEmail.trim()) {
      alert("Iltimos, kompaniya nomi va egasining elektron manzilini kiriting.");
      return;
    }

    try {
      const response = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStoreForm.name,
          ownerName: newStoreForm.ownerName,
          ownerEmail: newStoreForm.ownerEmail,
          commissionRate: Number(newStoreForm.commissionRate),
        }),
      });

      if (!response.ok) throw new Error("Gildiya registratsiya xatosi");
      const resData = await response.json();

      setGeneratedCredentials({
        store: resData.store,
        owner: resData.owner,
      });

      // Clear form
      setNewStoreForm({
        name: "",
        ownerName: "",
        ownerEmail: "",
        commissionRate: "10",
      });

      // Refresh DB data
      onFetchLatestDb();
      alert("Yangi brend muvaffaqiyatli ro'yxatdan o'tkazildi!");
    } catch (err) {
      console.error(err);
    }
  };

  // Suspend / Delete store
  const handleSuspendStore = async (storeId: string) => {
    if (!confirm("Ushbu brendni platformadan butunlay chetlatmoqchimisiz? Do'kon mahsulotlari ham o'chib ketadi.")) return;
    try {
      const response = await fetch(`/api/stores/${storeId}`, { method: "DELETE" });
      if (response.ok) {
        alert("Brend hamkorligi bekor qilindi va barcha bloklar olib tashlandi.");
        onFetchLatestDb();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="superadmin-panel">
      
      {/* 1. HEADER */}
      <div className="p-6 bg-gradient-to-r from-amber-950/45 to-slate-900 border border-amber-500/20 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-white">Super Admin boshqaruv konsoli</h2>
            <span className="bg-amber-500 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-full select-none">
              Tizim Bosh Ruxsati
            </span>
          </div>
          <p className="text-xs text-white/50 font-light">
            Platforma moliyaviy barqarorligi, do'konlarni litsenziyalash va ularning komissiya hisobotlarini global tahrirlash konsoli.
          </p>
        </div>

        <button
          onClick={onLogoutAdmin}
          className="px-4 py-1.5 rounded-xl bg-red-400/10 hover:bg-red-400/20 border border-red-500/20 text-red-400 text-xs font-bold transition ml-auto cursor-pointer shrink-0"
        >
          Tizimdan chiqish
        </button>
      </div>

      {/* 2. STATS ANALYTICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 text-center space-y-1">
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Platforma yalpi aylanmasi</span>
          <p className="text-xl font-black text-amber-500">${globalTurnover.toLocaleString()}</p>
        </div>
        <div className="glass-panel p-4 text-center space-y-1">
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Sotib olinganlar jami</span>
          <p className="text-xl font-black text-white">{orders.length + 42} ta buyurtma</p>
        </div>
        <div className="glass-panel p-4 text-center space-y-1">
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Tizim elita do'konlari</span>
          <p className="text-xl font-black text-white">{stores.length} ta brend</p>
        </div>
        <div className="glass-panel p-4 text-center space-y-1">
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Ma'muriy sof komissiya</span>
          <p className="text-xl font-black text-emerald-400">${adminCommissionsEarned.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* REGISTER A NEW BRAND ATELIER (5 columns) */}
        <div className="lg:col-span-5 glass-panel p-6 space-y-4">
          <h3 className="font-extrabold text-xs text-amber-500 border-b border-white/5 pb-2 uppercase tracking-widest">
            Yangi brend / Do'konni litsenziyalash
          </h3>
          <p className="text-[11px] text-white/50">Yuridik shaxs yoki yakka tartibdagi hunarmandni ro'yxatdan o'tkazing. Tizim ularga faoliyat boshlashi uchun sandbox parolini avtomatik tayyorlab beradi.</p>

          <form onSubmit={handleRegisterBrand} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-white/50 mb-1">Brend yoki do'kon nomi</label>
              <input
                type="text"
                required
                placeholder="e.g. Bukhara Silks Luxury"
                value={newStoreForm.name}
                onChange={(e) => setNewStoreForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-white/50 mb-1">Kompaniya egasining to'liq ismi</label>
              <input
                type="text"
                required
                placeholder="e.g. Dilshod Karimov"
                value={newStoreForm.ownerName}
                onChange={(e) => setNewStoreForm((p) => ({ ...p, ownerName: e.target.value }))}
                className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white/50 mb-1">E_mail manzili</label>
                <input
                  type="email"
                  required
                  placeholder="dilshod@gmail.com"
                  value={newStoreForm.ownerEmail}
                  onChange={(e) => setNewStoreForm((p) => ({ ...p, ownerEmail: e.target.value }))}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-white/50 mb-1">Komissiya stavkasi (%)</label>
                <input
                  type="number"
                  min="2"
                  max="40"
                  value={newStoreForm.commissionRate}
                  onChange={(e) => setNewStoreForm((p) => ({ ...p, commissionRate: e.target.value }))}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs transition cursor-pointer"
            >
              Yangi brendini tasdiqlash
            </button>
          </form>

          {/* CREDENTIAL PACK OUTPUT BOX */}
          {generatedCredentials && (
            <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl space-y-3.5 text-xs animate-fade-in" id="auth-code-output">
              <span className="text-amber-400 font-black flex items-center gap-1.5 uppercase text-[10px] leading-none">
                <Key className="w-4.5 h-4.5 text-amber-500 animate-bounce" /> AVTOMATIK SOTUVCHI AVTORIZATSIYA PAKETI
              </span>
              <div className="space-y-1 bg-black/25 p-2.5 rounded-lg border border-white/5">
                <p className="text-white">Do'kon nomi: <strong className="text-amber-400">{generatedCredentials.store.name}strong</strong></p>
                <p className="text-white">Admin login (Elektron manzil): <span className="font-mono text-amber-300 font-bold">{generatedCredentials.owner.email}</span></p>
                <p className="text-white">Himoyalangan parol: <span className="font-mono text-amber-300 font-bold">{generatedCredentials.owner.password}</span></p>
              </div>
              <p className="text-[10px] text-white/40 leading-relaxed font-light">
                Ushbu ma'lumotlarni do'kon ma'muriga xavfsiz tarzda yetkazing. Ular /admin bo'limida tizimga kirib o'z tovarlarini boshqarishi mumkin.
              </p>
            </div>
          )}
        </div>

        {/* ACTIVE BRANDS MANAGE LISTING (7 columns) */}
        <div className="lg:col-span-7 glass-panel p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-xs text-amber-500 border-b border-white/5 pb-2 uppercase tracking-widest mb-4">
              Litsenziyalangan do'konlarni nazorat qilish va chetlatish
            </h3>

            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
              {stores.map((st) => (
                <div
                  key={st.id}
                  className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-3.5 rounded-xl hover:bg-white/[0.02]"
                >
                  <div className="flex gap-3 items-center min-w-0">
                    <img src={st.logo} alt="logo" className="w-9 h-9 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-xs text-white truncate max-w-[150px]">{st.name}</h4>
                        <span className="font-mono text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          {st.commissionRate}%
                        </span>
                      </div>
                      <span className="text-[10px] text-white/40 block leading-none mt-1">Komissar: {st.ownerName} ({st.ownerEmail})</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSuspendStore(st.id)}
                    className="px-3 py-1 bg-red-400/10 hover:bg-red-400/20 text-red-400 text-[10px] font-bold border border-red-500/20 rounded-lg cursor-pointer"
                    id={`suspend-store-${st.id}`}
                  >
                    Birlashuvni bekor qilish
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 4. POSTGRESQL ENTERPRISE MIGRATION SUITE */}
      <div className={`transition-all duration-500 border mt-6 ${
        selectedStyle === "brutalist" 
          ? "border-4 border-white bg-black p-6 font-mono rounded-none" 
          : selectedStyle === "luxury"
          ? "bg-zinc-950 border border-amber-500/30 p-6 rounded-3xl"
          : "glass-panel p-6 border-cyan-400/20"
      }`}>
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Database className={`w-5 h-5 ${selectedStyle === 'brutalist' ? 'text-emerald-400' : selectedStyle === 'luxury' ? 'text-amber-400' : 'text-cyan-400'}`} />
              <h3 className={`font-black text-sm tracking-widest uppercase ${
                selectedStyle === 'brutalist' ? 'text-white' : selectedStyle === 'luxury' ? 'text-amber-400' : 'glow-text text-white'
              }`}>
                PostgreSQL Enterprise Migratsiya Markazi
              </h3>
            </div>
            <p className="text-[11px] text-white/50 font-light max-w-2xl">
              Platforma JSON modelini (`db.json`) to'liq relatsion PostgreSQL ma'lumotlar bazasiga o'tkazish markazi. Maxsus jadvallar, indeks va kaskadli bog'lanishlar bilan jihozlangan.
            </p>
          </div>

          {/* Style variant selector widget */}
          <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10 shrink-0">
            <button
              onClick={() => setSelectedStyle("cyber")}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                selectedStyle === "cyber" ? "bg-cyan-500 text-black shadow-md" : "text-white/60 hover:text-white"
              }`}
            >
              <Cpu className="w-3 h-3" /> Cyber Glass
            </button>
            <button
              onClick={() => setSelectedStyle("luxury")}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                selectedStyle === "luxury" ? "bg-amber-600 text-white shadow-md" : "text-white/60 hover:text-white"
              }`}
            >
              <Sparkles className="w-3 h-3" /> Gold Luxury
            </button>
            <button
              onClick={() => setSelectedStyle("brutalist")}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                selectedStyle === "brutalist" ? "bg-white text-black shadow-md" : "text-white/60 hover:text-white"
              }`}
            >
              <Terminal className="w-3 h-3" /> Tech Brutalist
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
          
          {/* Simulation & Operations Panel */}
          <div className="space-y-4">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${
              selectedStyle === 'brutalist' ? 'text-emerald-400' : selectedStyle === 'luxury' ? 'text-amber-300' : 'text-cyan-400'
            }`}>
              Migratsiya simulyatori va holati
            </h4>
            <p className="text-[11px] text-white/50 leading-relaxed font-light">
              Yangi PostgreSQL ma'lumotlar klasteriga ulanishni, mantiqiy jadvallarni va xavfsizlik cheklovlarini sinovdan o'tkazing. Ushbu simulyatsiya haqiqiy SQL jurnallarini yaratadi hamda ma'lumotlar butunligini tahlil qiladi.
            </p>

            <div className="flex gap-3">
              <button
                onClick={fetchMigrationData}
                disabled={loadingScript}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
                  selectedStyle === 'brutalist' 
                    ? 'border-2 border-white text-white bg-black hover:bg-neutral-900 rounded-none' 
                    : selectedStyle === 'luxury'
                    ? 'bg-amber-800/20 hover:bg-amber-800/30 text-amber-300 border border-amber-500/20'
                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                {loadingScript ? "Yuklanmoqda..." : "SQL jadvallarni generatsiya qilish"}
              </button>

              <button
                onClick={runMigrationSim}
                disabled={simulating}
                className={`px-5 py-2 text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-2 ${
                  selectedStyle === 'brutalist'
                    ? 'bg-emerald-500 text-black border-2 border-white rounded-none'
                    : selectedStyle === 'luxury'
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold shadow-cyan-500/20'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                {simulating ? "Simulyatsiya qilinmoqda..." : "Migratsiya Sinovini Boshlash"}
              </button>
            </div>

            {/* Diagnostic Logs Screen */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-cyan-400" /> Diagnostika konsol jurnali
              </span>
              <div className="bg-black/90 p-3.5 rounded-xl border border-white/5 font-mono text-[10px] h-[210px] overflow-y-auto space-y-1.5 leading-relaxed text-slate-300 select-text">
                {simulationLogs.length === 0 ? (
                  <p className="text-white/30 italic text-center py-16">Diagnostika jurnali bo'sh. Migratsiya sinovini boshlash uchun tugmani bosing.</p>
                ) : (
                  simulationLogs.map((log, idx) => {
                    let color = "text-slate-300";
                    if (log.includes("[XATOLIK]")) color = "text-red-400 font-bold";
                    if (log.includes("[SUCCESS]")) color = "text-emerald-400 font-extrabold";
                    if (log.includes("[DDL]")) color = "text-cyan-400";
                    if (log.includes("[SEED]")) color = "text-amber-400";
                    return <p key={idx} className={color}>{log}</p>;
                  })
                )}
              </div>
            </div>
          </div>

          {/* Generated SQL Code Viewer */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-1.5">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${
                selectedStyle === 'brutalist' ? 'text-emerald-400' : selectedStyle === 'luxury' ? 'text-amber-300' : 'text-cyan-400'
              }`}>
                Real PostgreSQL Skripti va DDL ifodalari
              </h4>
              <p className="text-[11px] text-white/50 leading-relaxed font-light">
                Bizning bazamiz ushbu SQL skripti orqali PostgreSQL-ga to'laqonli ko'chadi. Mahsulotlar, do'konlar va buyurtmalar jadvali o'rtasidagi munosabatlarni tasdiqlash uchun ushbu transactional SQL kodidan foydalaning.
              </p>
            </div>

            {migrationScript ? (
              <div className="grid grid-cols-1 gap-4">
                {/* 1. Schema DLL */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] bg-white/[0.02] px-3 py-1.5 border border-white/5 rounded-lg">
                    <span className="font-mono text-cyan-300 font-black">1. TABLE SCHEMAS (DDL)</span>
                    <button
                      onClick={() => handleCopySQL(migrationScript.ddl, "ddl")}
                      className="text-[9px] text-white/40 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copiedType === "ddl" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedType === "ddl" ? "Nusxalandi!" : "Nusxa olish"}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 font-mono text-[9px] h-[100px] overflow-y-auto rounded-lg text-white/70 border border-white/5 select-all">
                    {migrationScript.ddl}
                  </pre>
                </div>

                {/* 2. INSERT SEEDS */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] bg-white/[0.02] px-3 py-1.5 border border-white/5 rounded-lg">
                    <span className="font-mono text-amber-300 font-black">2. ACTIVE INVENTORY SEEDS (SQL)</span>
                    <button
                      onClick={() => handleCopySQL(migrationScript.seeding, "seed")}
                      className="text-[9px] text-white/40 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copiedType === "seed" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedType === "seed" ? "Nusxalandi!" : "Nusxa olish"}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 font-mono text-[9px] h-[100px] overflow-y-auto rounded-lg text-white/70 border border-white/5 select-all">
                    {migrationScript.seeding}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-8 border border-dashed border-white/10 rounded-2xl bg-white/[0.01] flex flex-col items-center justify-center text-center space-y-2 py-16">
                <Terminal className="w-8 h-8 text-white/20" />
                <p className="text-xs text-white/60">PostgreSQL relatsion SQL jadvallari yuklanmagan</p>
                <button
                  onClick={fetchMigrationData}
                  className="mt-2 px-3 py-1 text-[10px] bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg cursor-pointer transition"
                >
                  Skriptni generatsiya qilish
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
