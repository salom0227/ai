import React, { useState, useEffect } from "react";
import { Star, Heart, ArrowLeft, Bot, Sparkles, Layers, MessageSquare, ShieldCheck, Flame, ShoppingCart } from "lucide-react";
import { Product, Store } from "../types";

interface ProductPageProps {
  product: Product;
  stores: Store[];
  wishlist: string[];
  onToggleWishlist: () => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onOpenAiSuite: () => void;
  onNavigateToStore: (slug: string) => void;
  onGoBack: () => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({
  product,
  stores,
  wishlist,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  onOpenAiSuite,
  onNavigateToStore,
  onGoBack,
}) => {
  const [activeImage, setActiveImage] = useState(product.images[0]);
  const [analyzingReviews, setAnalyzingReviews] = useState(false);
  const [reviewAnalysis, setReviewAnalysis] = useState<{
    pros: string[];
    cons: string[];
    summary: string;
  } | null>(null);

  // Auto trigger reviews sentiment analysis on start
  useEffect(() => {
    fetchReviewAnalysis();
  }, [product.id]);

  const fetchReviewAnalysis = async () => {
    setAnalyzingReviews(true);
    try {
      const res = await fetch(`/api/ai/analyze-reviews/${product.id}`);
      if (res.ok) {
        const data = await res.json();
        setReviewAnalysis(data);
      }
    } catch (err) {
      console.error("Reviews analysis error:", err);
    } finally {
      setAnalyzingReviews(false);
    }
  };

  const getStoreOfProduct = () => {
    return stores.find((s) => s.id === product.storeId);
  };

  const store = getStoreOfProduct();
  const isWishlisted = wishlist.includes(product.id);

  return (
    <div className="space-y-6 animate-fade-in" id={`product-page-${product.id}`}>
      
      {/* Orqaga Link va do'kon sarlavhasi */}
      <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-white/5">
        <button
          onClick={onGoBack}
          className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-white/15"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Orqaga qaytish
        </button>

        {store && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/40 uppercase">Atelier:</span>
            <span
              onClick={() => onNavigateToStore(store.slug)}
              className="font-bold text-xs text-cyan-400 hover:underline hover:cursor-pointer"
            >
              {store.name}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* 1. IMAGES COLUMN (5 columns) */}
        <div className="md:col-span-5 space-y-4">
          <div className="h-96 rounded-2xl bg-white/[0.01] border border-white/5 overflow-hidden flex items-center justify-center relative">
            <img
              src={activeImage}
              alt={product.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={onToggleWishlist}
              className="absolute top-4 right-4 px-2.5 py-2.5 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/5 text-white/80 hover:text-red-400 cursor-pointer"
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-400 text-red-400" : ""}`} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {product.images.map((imgUrl, i) => (
              <div
                key={i}
                onClick={() => setActiveImage(imgUrl)}
                className={`h-24 rounded-xl overflow-hidden border cursor-pointer transition-all ${
                  activeImage === imgUrl ? "border-cyan-400 scale-95 ring-2 ring-cyan-400/30" : "border-white/5 hover:border-white/20"
                }`}
              >
                <img src={imgUrl} alt="sub" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
        </div>

        {/* 2. SPECIFICATIONS COLUMN (7 columns) */}
        <div className="md:col-span-7 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-cyan-400">
              <span className="bg-cyan-500/10 border border-cyan-400/20 px-2.5 py-0.5 rounded-full">
                {product.categoryId === "clothing" ? "Moda / Kiyimlar" : product.categoryId === "electronics" ? "Elita Elektronika" : "Exclusive tovar"}
              </span>
              <span className="text-amber-400 flex items-center gap-0.5 font-bold">
                <Star className="w-3.5 h-3.5 fill-current" /> {product.rating} (Ishonchli baholar)
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-black text-white leading-tight">{product.title}</h1>
            <p className="text-xs text-white/50 leading-relaxed font-light">{product.description}</p>
          </div>

          <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <span className="text-white/40 block text-[10px] uppercase">Haqiqiy narxi</span>
              <span className="text-xl font-black text-white">${product.price.toLocaleString()}</span>
            </div>
            <div className="text-right">
              <span className="text-white/40 block text-[10px] uppercase">Kafolatlangan yetkazish</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Bepul (O'zbekiston bo'ylab)
              </span>
            </div>
          </div>

          {/* AI INTEGRATIONS ROAD */}
          <div className="p-4 bg-gradient-to-r from-cyan-950/20 to-indigo-950/10 border border-cyan-400/20 rounded-2xl space-y-3">
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
              <Bot className="w-4.5 h-4.5 text-cyan-400 animate-pulse" /> INTEGRATSIYALASHGAN AI FUNKSIYALARI
            </span>
            <p className="text-[11px] text-white/60 leading-relaxed font-light">
              Bizning neyron tarmoqlarimiz sizning andozangiz va tana bo'ylaringizga asosan ushbu kiyimni kiygan holatingizni hisoblash va aniq razmer tavsiya qilish imkoniyatiga ega.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={onOpenAiSuite}
                className="py-2 rounded-xl bg-cyan-400/10 border border-cyan-400/30 hover:bg-cyan-400/20 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Virtual Kiyib ko'rish
              </button>
              <button
                onClick={onOpenAiSuite}
                className="py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                O'lcham Tavsiyasi
              </button>
            </div>
          </div>

          {/* AI SEMANTIC CONSENSUS REVIEWS */}
          <div className="space-y-3 border-t border-white/5 pt-5">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> AI sharhlar sentiment tahlili consensus
              </span>
              <button
                onClick={fetchReviewAnalysis}
                disabled={analyzingReviews}
                className="text-cyan-400 hover:underline cursor-pointer border border-cyan-400/20 px-2 py-0.5 rounded bg-cyan-500/5 text-[9px]"
              >
                {analyzingReviews ? "Tahlil etilmoqda..." : "Semantik tahlilni qayta bajarish"}
              </button>
            </div>

            {analyzingReviews ? (
              <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl text-center text-xs text-white/40 py-8 animate-pulse">
                Gemini unifikatsiyalangan neyron tarmog'i baholarni o'rganmoqda...
              </div>
            ) : reviewAnalysis ? (
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs space-y-3">
                <p className="text-white/80 leading-relaxed font-light italic">
                  "{reviewAnalysis.summary}"
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                  <div>
                    <span className="text-[9px] text-emerald-400 uppercase font-black block tracking-widest mb-1">
                      IJOBIY JIHALARI (YUTUQLARI)
                    </span>
                    <ul className="list-disc pl-4 text-white/60 text-[11px] leading-relaxed space-y-0.5">
                      {reviewAnalysis.pros.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-[9px] text-yellow-400 uppercase font-black block tracking-widest mb-1">
                      KAMLIKLARI / ESLATMALAR
                    </span>
                    <ul className="list-disc pl-4 text-white/60 text-[11px] leading-relaxed space-y-0.5">
                      {reviewAnalysis.cons && reviewAnalysis.cons.length > 0 ? (
                        reviewAnalysis.cons.map((c, i) => <li key={i}>{c}</li>)
                      ) : (
                        <li>Kamchiliklar aniqlanmadi. Xaridorlar mamnun.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-white/30 italic">Sharhlar hisob-kitobi yuklanmoqda...</p>
            )}
          </div>

          {/* BUY AND CART TRIGGERS */}
          <div className="flex gap-3 pt-3 border-t border-white/5">
            <button
              onClick={onAddToCart}
              className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-extrabold text-xs transition-all border border-white/10 cursor-pointer shadow-md"
            >
              Savatga qo'shish
            </button>
            <button
              onClick={onBuyNow}
              className="flex-1 py-3 rounded-xl bg-cyan-500 text-black hover:bg-cyan-400 font-extrabold text-xs hover:-translate-y-0.5 transition-all cursor-pointer shadow-lg shadow-cyan-400/30 flex items-center justify-center gap-1.5"
              id="buy-now-btn"
            >
              <ShoppingCart className="w-4 h-4" />
              Hozirda sotib olish
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};
