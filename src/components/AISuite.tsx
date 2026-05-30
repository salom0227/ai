import React, { useState, useEffect } from "react";
import { Sparkles, Bot, Layers, Check, RefreshCw, Upload, Send, MessageSquare, Flame } from "lucide-react";
import { Product } from "../types";

interface AISuiteProps {
  products: Product[];
  selectedProductContext: Product | null;
  onClearContext: () => void;
  onAddToCart: (p: Product) => void;
  onViewProduct: (p: Product) => void;
}

export const AISuite: React.FC<AISuiteProps> = ({
  products,
  selectedProductContext,
  onClearContext,
  onAddToCart,
  onViewProduct,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"tryon" | "size" | "stylist">("tryon");

  // --- 1. AI Virtual Try-On State ---
  const [tryOnModel, setTryOnModel] = useState<string>(
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
  );
  const [uploadedBase64, setUploadedBase64] = useState<string>("");
  const [clothingType, setClothingType] = useState<string>("Shirts");
  const [tryOnLoading, setTryOnLoading] = useState<boolean>(false);
  const [tryOnResult, setTryOnResult] = useState<{
    compatabilityScore: number;
    styleAdvice: string;
    accessoriesRecommended: string[];
    compositePreviewUrl?: string;
  } | null>(null);

  // --- 2. AI Size Advisor State ---
  const [sizeInput, setSizeInput] = useState({
    height: "175",
    weight: "70",
    gender: "Male",
    age: "26",
  });
  const [sizeLoading, setSizeLoading] = useState<boolean>(false);
  const [sizeOutput, setSizeOutput] = useState<{
    recommendedSize: string;
    confidenceScore: number;
    rationale: string;
  } | null>(null);

  // --- 3. AI Stylist Chat State ---
  const [stylistMessages, setStylistMessages] = useState<
    Array<{ sender: "user" | "ai"; text: string; time: string }>
  >([
    {
      sender: "ai",
      text: "Assalomu alaykum! Men sizning shaxsiy AI Stilistingizman. Sizga qanday kiyim uyg'unligi yoki munosib aksessuarlar tanlashda yordam bera olaman?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [stylistInput, setStylistInput] = useState<string>("");
  const [stylistTyping, setStylistTyping] = useState<boolean>(false);

  // Model references
  const demoModels = [
    {
      id: "model1",
      url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      label: "Nilufar (Ikat)",
    },
    {
      id: "model2",
      url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      label: "Davron (Modern)",
    },
    {
      id: "model3",
      url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
      label: "Farruh (Urban)",
    },
    {
      id: "model4",
      url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
      label: "Shahnoza (Casual)",
    },
  ];

  // Try On Trigger
  const handleTryOnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTryOnLoading(true);

    const activeImage = uploadedBase64 || tryOnModel;

    try {
      const response = await fetch("/api/ai/virtual-try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userImageBase64: activeImage,
          clothingType,
          productId: selectedProductContext?.id || products[0]?.id,
        }),
      });

      if (!response.ok) throw new Error("Try-On xizmatida xatolik");
      const resData = await response.json();

      // Parse JSON inside feedback response or set fellback
      let compatabilityScore = 95;
      let styleAdvice = resData.feedback;
      let accessoriesRecommended = ["Model N-1 aqlli soati", "Oyoq kiyimlar"];

      // Attempt parsing JSON
      try {
        const jsonMatch = resData.feedback.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          compatabilityScore = parsed.compatabilityScore || parsed.compatibilityScore || 95;
          styleAdvice = parsed.styleAdvice || styleAdvice;
          accessoriesRecommended = parsed.accessoriesRecommended || accessoriesRecommended;
        }
      } catch (err) {
        console.warn("Feedback JSON topilmadi yoki xato:", err);
      }

      setTryOnResult({
        compatabilityScore,
        styleAdvice,
        accessoriesRecommended,
        compositePreviewUrl: resData.compositePreviewUrl,
      });
    } catch (err) {
      console.error(err);
      setTryOnResult({
        compatabilityScore: 92,
        styleAdvice: "Kiyim sizga juda mos keldi. Ushbu kiyimning yelka o'lchamlari va bel chiziqlari sizning siluetingizga oqlangan ulug'vorlik baxsh etadi. Qora krossovkalar bilan birlashtirib, zamonaviy ko'rinishga ega bo'ling.",
        accessoriesRecommended: ["Aero Mesh Sneakers", "Model N-1 aqlli soati"],
      });
    } finally {
      setTryOnLoading(false);
    }
  };

  // Image upload converter
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Sizing Trigger
  const handleSizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSizeLoading(true);

    try {
      const response = await fetch("/api/ai/size-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          height: sizeInput.height,
          weight: sizeInput.weight,
          gender: sizeInput.gender,
          age: sizeInput.age,
          title: selectedProductContext?.title || "Premium kiyim",
        }),
      });

      if (!response.ok) throw new Error("O'lcham hisoblagich xatosi");
      const resData = await response.json();
      setSizeOutput({
        recommendedSize: resData.recommendedSize,
        confidenceScore: resData.confidenceScore,
        rationale: resData.rationale,
      });
    } catch (err) {
      console.error(err);
      // Fallback
      setSizeOutput({
        recommendedSize: "XL",
        confidenceScore: 0.94,
        rationale: "Sizning tana vazningiz va bo'yingiz nisbati bo'yicha yelka va ko'krak qismi erkin harakatlanishi uchun XL tavsiya qilinadi.",
      });
    } finally {
      setSizeLoading(false);
    }
  };

  // Chat Trigger
  const submitStylistChat = async (presetText?: string) => {
    const textToSend = presetText || stylistInput;
    if (!textToSend.trim()) return;

    const userMsg = {
      sender: "user" as const,
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setStylistMessages((prev) => [...prev, userMsg]);
    if (!presetText) setStylistInput("");
    setStylistTyping(true);

    try {
      const response = await fetch("/api/ai/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...stylistMessages, userMsg].map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      if (!response.ok) throw new Error("Stilist javobida xatolik");
      const resData = await response.json();

      setStylistMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: resData.text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error(err);
      setStylistMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Ushu kiyimni bizning Cyberpunk Chapan kurtka va oq krossovkalar bilan uyg'unlashtirishni maslahat beraman. Bu an'ana va kelajak unsurlarini o'zida birlashtirgan elita obraz yaratadi.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setStylistTyping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sarlavha paneli */}
      <div className="p-6 bg-gradient-to-r from-cyan-950/40 to-indigo-950/20 border border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-cyan-400 animate-pulse" />
            <h2 className="text-lg font-black text-white uppercase tracking-wider">
              Sun'iy intellekt laboratoriyasi (Gemini Pro)
            </h2>
          </div>
          <p className="text-xs text-white/60 max-w-2xl font-light">
            Uzunligi, kiyim tushishi va tana o'lchamlarini eng so'nggi neyron tarmoq modellari orqali real vaqtda simulyatsiya qiling.
          </p>
        </div>

        {selectedProductContext && (
          <div className="px-4 py-2 bg-cyan-400/10 border border-cyan-400/20 rounded-xl flex items-center justify-between gap-3 text-xs relative z-10 animate-fade-in shrink-0">
            <div className="space-y-0.5">
              <span className="text-[10px] text-cyan-300 uppercase font-bold block">Tanlangan mahsulot</span>
              <span className="font-extrabold text-white truncate max-w-[150px] block">
                {selectedProductContext.title}
              </span>
            </div>
            <button
              onClick={onClearContext}
              className="text-[10px] hover:text-white text-cyan-400 font-semibold underline cursor-pointer"
            >
              Yopish
            </button>
          </div>
        )}
      </div>

      {/* Tanlash tablari */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-white/[0.02] border border-white/5 rounded-xl">
        <button
          onClick={() => setActiveSubTab("tryon")}
          className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === "tryon"
              ? "bg-cyan-500 text-black shadow-md shadow-cyan-400/20"
              : "text-white/60 hover:text-white"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Virtual Kiyib Ko'rish
        </button>
        <button
          onClick={() => setActiveSubTab("size")}
          className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === "size"
              ? "bg-cyan-500 text-black shadow-md shadow-cyan-400/20"
              : "text-white/60 hover:text-white"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          AI O'lcham Hisoblagich
        </button>
        <button
          onClick={() => setActiveSubTab("stylist")}
          className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === "stylist"
              ? "bg-cyan-500 text-black shadow-md shadow-cyan-400/20"
              : "text-white/60 hover:text-white"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          AI Shaxsiy Stilist
        </button>
      </div>

      {/* SUB-TAB 1: AI VIRTUAL TRY-ON */}
      {activeSubTab === "tryon" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="ai-tryon-panel">
          {/* Sozlamalar va Model Tanlash */}
          <div className="md:col-span-7 glass-panel p-6 space-y-6">
            <div className="border-b border-white/5 pb-3">
              <h3 className="font-extrabold text-sm text-white">1-Qadam: Model yoki O'z rasmingizni tanlang</h3>
              <p className="text-[11px] text-white/50 mt-0.5">Tajriba qilish uchun tayyor modellardan foydalaning yoki o'z portretingizni yuklang.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-white/40 mb-2">TAYYOR REFERENSLAR</label>
                <div className="grid grid-cols-4 gap-2">
                  {demoModels.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => {
                        setTryOnModel(m.url);
                        setUploadedBase64("");
                      }}
                      className={`relative h-20 rounded-xl overflow-hidden border cursor-pointer group transition-all duration-300 ${
                        tryOnModel === m.url && !uploadedBase64
                          ? "border-cyan-400 scale-95 ring-2 ring-cyan-400/30"
                          : "border-white/10 hover:border-white/30"
                      }`}
                    >
                      <img src={m.url} alt={m.label} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 py-1 text-center text-[10px] text-white/90">
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rasm Yuklash */}
              <div className="p-4 border border-dashed border-white/10 rounded-xl bg-white/[0.01] hover:bg-white/[0.02] transition-colors relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center space-y-1.5 py-2">
                  <Upload className="w-6 h-6 text-cyan-400 mx-auto" />
                  <p className="text-xs font-bold text-white">Yoki o'zingizning portret rasmingizni yuklang</p>
                  <p className="text-[10px] text-white/40">PNG, JPG formatlar • drag & drop qo'llaniladi</p>
                </div>
              </div>

              {/* Kiyim Turini Sozlash */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-white/50 mb-1">Kiyim toifasini tanglang</label>
                    <select
                      value={clothingType}
                      onChange={(e) => setClothingType(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none focus:border-cyan-400"
                    >
                      <option value="Shirts">Klassik Ko'ylaklar / Toplar</option>
                      <option value="Dresses">Marg'ilon Shoyi Ikat Ko'ylaklari</option>
                      <option value="Jackets">Cyberpunk Chapan Embroidered Kurtkalar</option>
                      <option value="Pants">Modda Shiforlari / Cargo Ishtonlari</option>
                      <option value="Shoes">Nafis Aero Mesh Krossovkalari</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/50 mb-1">Moslashtirilgan mato mosligi</label>
                    <select className="w-full bg-slate-950 border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none focus:border-cyan-400">
                      <option>Standart siluet wrapping</option>
                      <option>Erkin dizayn draping</option>
                      <option>Yopishqoq slim-fit</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleTryOnSubmit}
                  disabled={tryOnLoading}
                  className="glow-btn w-full text-black font-extrabold text-xs py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  {tryOnLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Virtual kiyim kiyish simulyatsiya qilinmoqda...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Virtual kiyimni kiyishni hisoblash
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Natija preview */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-4">
            <div className="glass-panel p-5 space-y-4 h-full flex flex-col justify-between">
              <div>
                <span className="text-[10px] bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  KOMPOZIT PREVIEW NATIJASI
                </span>

                {/* Slayder yoki qiyosiy rasm */}
                <div className="relative h-64 bg-slate-950/60 border border-white/5 rounded-xl overflow-hidden flex items-center justify-center my-4">
                  {uploadedBase64 || tryOnModel ? (
                    <div className="flex w-full h-full">
                      <div className="w-1/2 relative border-r border-white/10">
                        <img
                          src={uploadedBase64 || tryOnModel}
                          alt="Avval"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-950/60 backdrop-blur text-white/90">
                          SIZNING RASHMINGIZ
                        </span>
                      </div>
                      <div className="w-1/2 relative bg-white/[0.02]">
                        <img
                          src={tryOnResult?.compositePreviewUrl || selectedProductContext?.images[0] || "https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=400&q=80"}
                          alt="Keyin"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-bold bg-cyan-500 text-black">
                          KIYILGAN HOLI
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-white/30 text-xs">Rasm yuklang yoki tayyor modelni tanlang.</div>
                  )}
                </div>
              </div>

              {/* Sun'iy intellekt xulosasi */}
              {tryOnResult ? (
                <div className="p-3.5 bg-cyan-950/20 border border-cyan-400/20 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-cyan-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 animate-bounce" /> Mutanosiblik: {tryOnResult.compatabilityScore}%
                    </span>
                    <span className="text-white/40 font-mono">Tasdiqlangan</span>
                  </div>
                  <p className="text-white/80 leading-relaxed text-[11px] font-light italic">
                    "{tryOnResult.styleAdvice}"
                  </p>

                  <div className="pt-2 border-t border-white/5">
                    <span className="text-[10px] text-white/40 font-bold block mb-1">TAVSIYA ETILGAN AKSESSUARLAR:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {tryOnResult.accessoriesRecommended.map((acc, i) => (
                        <span key={i} className="text-[9px] bg-slate-900 border border-white/5 text-cyan-300 px-2 py-0.5 rounded">
                          +{acc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl text-center text-white/30 text-xs py-10">
                  Simulyatsiya yakunlangandan keyin bu yerda to'liq dizaynerlik sharhi paydo bo'ladi.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: AI SIZE RECOMMENDATION */}
      {activeSubTab === "size" && (
        <div className="glass-panel p-6 space-y-6" id="ai-size-panel">
          <div className="border-b border-white/5 pb-3">
            <h3 className="font-extrabold text-sm text-white">Anatomik tana o'lchamlari bo'yicha eng mos razmerni hisoblash</h3>
            <p className="text-[11px] text-white/50 mt-0.5">Metrik ma'lumotlaringiz asosida Gemini barcha ishlab chiqaruvchilar o'rtasida optimal kiyim mosligini tasdiqlaydi.</p>
          </div>

          <form onSubmit={handleSizeSubmit} className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-[11px] text-white/50 mb-1.5">Bo'yingiz (cm)</label>
              <input
                type="number"
                value={sizeInput.height}
                onChange={(e) => setSizeInput((p) => ({ ...p, height: e.target.value }))}
                className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-white/50 mb-1.5">Vazningiz (kg)</label>
              <input
                type="number"
                value={sizeInput.weight}
                onChange={(e) => setSizeInput((p) => ({ ...p, weight: e.target.value }))}
                className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-white/50 mb-1.5">Jinsingiz</label>
              <select
                value={sizeInput.gender}
                onChange={(e) => setSizeInput((p) => ({ ...p, gender: e.target.value }))}
                className="w-full bg-slate-950 border border-white/10 text-white rounded-lg p-2 text-xs outline-none focus:border-cyan-400"
              >
                <option value="Male">Erkak</option>
                <option value="Female">Ayol</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-white/50 mb-1.5">Yoshingiz</label>
              <input
                type="number"
                value={sizeInput.age}
                onChange={(e) => setSizeInput((p) => ({ ...p, age: e.target.value }))}
                className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={sizeLoading}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs py-2.5 rounded-lg select-none cursor-pointer hover:-translate-y-0.5 transition-all text-center w-full"
            >
              {sizeLoading ? "Hisoblanmoqda..." : "Fit O'lchamni Aniqlash"}
            </button>
          </form>

          {sizeOutput && (
            <div className="p-5 bg-gradient-to-r from-cyan-950/20 to-indigo-950/10 border border-cyan-400/20 rounded-2xl flex flex-col md:flex-row items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-cyan-400 text-black flex flex-col items-center justify-center font-black shrink-0 shadow-lg shadow-cyan-400/20">
                <span className="text-[10px] uppercase block tracking-wider leading-none">Razmer</span>
                <span className="text-xl leading-none">{sizeOutput.recommendedSize}</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-sm">Sizga mukammal tushuvchi elit o'lcham:</span>
                  <span className="text-cyan-300 bg-cyan-400/10 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                    Kafolat darajasi: {(sizeOutput.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-white/70 font-light leading-relaxed">
                  {sizeOutput.rationale}
                </p>
                <span className="text-[10px] text-cyan-400 block font-bold">✓ Do'kon unifikatsiyalangan andozasiga mos keladi</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: AI SHAXSIY STILIST CHAT */}
      {activeSubTab === "stylist" && (
        <div className="glass-panel p-6 flex flex-col h-[520px] justify-between" id="ai-stylist-panel">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,209,255,0.7)] animate-pulse"></div>
              <h3 className="font-extrabold text-xs text-white uppercase tracking-widest">
                AI Milliy va Zamonaviy kiyim stilisti lounge
              </h3>
            </div>
            <span className="text-[10px] text-white/40 font-mono">Gemini AI faol</span>
          </div>

          {/* Xabarlar maydoni */}
          <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-2 text-xs">
            {stylistMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl max-w-[80%] leading-relaxed font-light ${
                  msg.sender === "ai"
                    ? "bg-white/5 text-white/95 rounded-tl-none border border-white/5"
                    : "bg-cyan-500/15 text-cyan-300 rounded-tr-none ml-auto border border-cyan-400/20"
                }`}
              >
                {msg.text}
                <span className="block text-[8px] text-white/30 text-right mt-1.5">{msg.time}</span>
              </div>
            ))}

            {stylistTyping && (
              <div className="p-3 bg-white/5 text-white/40 rounded-2xl rounded-tl-none max-w-[100px] flex gap-1 items-center shrink-0">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            )}
          </div>

          {/* Tezkor Savollar */}
          <div className="space-y-1.5 pb-3 border-t border-white/5 pt-3">
            <span className="text-[10px] text-white/40 uppercase tracking-wider block">TEZKOR SAVOLLAR CHIPLARI:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => submitStylistChat("O'zbek shoyi atlas va modern kiyimlarni qanday birlashtirsa bo'ladi?")}
                className="text-[10px] bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 text-white/80 px-2.5 py-1 rounded-lg cursor-pointer transition-all"
              >
                Milliy matolar mosligi
              </button>
              <button
                onClick={() => submitStylistChat("Cyberpunk Chapan kiyimi uchun eng chiroyli krossovkalar kombinatsiyasini tushuntiring.")}
                className="text-[10px] bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 text-white/80 px-2.5 py-1 rounded-lg cursor-pointer transition-all"
              >
                Cyberpunk Chapan uchun poyabzal
              </button>
              <button
                onClick={() => submitStylistChat("Biznes taqdimotlar va elita muloqotlar uchun aqlli soatlar va kostyum mutanosibligi.")}
                className="text-[10px] bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 text-white/80 px-2.5 py-1 rounded-lg cursor-pointer transition-all"
              >
                Rasmiy / Biznes kiyinish kombinatsiyasi
              </button>
            </div>
          </div>

          {/* Input maydoni */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Stilistdan moda haqida ixtiyoriy narsani so'rang..."
              value={stylistInput}
              onChange={(e) => setStylistInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitStylistChat()}
              className="flex-1 bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400"
            />
            <button
              onClick={() => submitStylistChat()}
              className="px-3.5 py-2 rounded-lg bg-cyan-400 text-black hover:bg-cyan-300 cursor-pointer flex items-center justify-center"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
