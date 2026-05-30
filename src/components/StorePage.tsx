import React, { useState } from "react";
import { Star, Shield, ArrowLeft, Mail, Award, Check } from "lucide-react";
import { Store, Product } from "../types";
import { ProductCard } from "./ProductCard";

interface StorePageProps {
  store: Store;
  products: Product[];
  wishlist: string[];
  onToggleWishlist: (pId: string) => void;
  onViewProduct: (prod: Product) => void;
  onAddToCart: (prod: Product) => void;
  onGoBack: () => void;
}

export const StorePage: React.FC<StorePageProps> = ({
  store,
  products,
  wishlist,
  onToggleWishlist,
  onViewProduct,
  onAddToCart,
  onGoBack,
}) => {
  const [following, setFollowing] = useState(false);
  
  // Filter products by storeId
  const storeProducts = products.filter((p) => p.storeId === store.id);

  return (
    <div className="space-y-6 animate-fade-in" id={`store-page-${store.slug}`}>
      
      {/* 1. STORE BANNER & DETAILS */}
      <div className="relative rounded-3xl overflow-hidden border border-white/5 bg-slate-900/60 pb-6">
        {/* Mock luxury banner */}
        <div className="h-40 bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(0,209,255,0.15),transparent_60%)]"></div>
          <button
            onClick={onGoBack}
            className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/10 text-xs text-white/80 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Orqaga qaytish
          </button>
        </div>

        {/* Store Logo overlapping banner */}
        <div className="px-6 -mt-10 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <img
              src={store.logo}
              alt={store.name}
              className="w-24 h-24 rounded-2xl object-cover border-4 border-slate-950 bg-slate-950 shadow-xl"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-1.5 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-white">{store.name}</h2>
                {store.verified && (
                  <span className="bg-cyan-500/10 text-cyan-400 text-[8px] font-black border border-cyan-400/20 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3 h-3" /> Ishonchli hamkor
                  </span>
                )}
              </div>
              <p className="text-xs text-white/50">{store.ownerEmail || `${store.slug}@aimall.uz`}</p>
            </div>
          </div>

          <div className="flex gap-2 pb-2">
            <button
              onClick={() => setFollowing(!following)}
              className={`px-5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                following
                  ? "bg-white/10 text-white border-white/20"
                  : "bg-cyan-500 text-black border-cyan-400 font-extrabold"
              }`}
            >
              {following ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  Obuna Bo'lindi
                </>
              ) : (
                "Kuzatib borish"
              )}
            </button>
            <a
              href={`mailto:${store.ownerEmail || ""}`}
              className="px-3.5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs flex items-center justify-center transition"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Description & statistics metrics */}
        <div className="px-6 pt-5 grid grid-cols-1 md:grid-cols-12 gap-6 border-t border-white/5 mt-5 text-xs">
          <div className="md:col-span-8 space-y-2">
            <h4 className="font-extrabold text-white/40 uppercase tracking-widest text-[9px]">Atelier haqida tavsif</h4>
            <p className="text-white/70 leading-relaxed font-light">{store.description}</p>
          </div>

          <div className="md:col-span-4 grid grid-cols-3 gap-2 text-center md:border-l border-white/5 md:pl-6">
            <div className="bg-white/[0.01] border border-white/5 p-2 rounded-xl">
              <span className="block text-[9px] text-white/40">REYTING</span>
              <span className="text-xs font-black text-amber-500 flex items-center justify-center gap-0.5 mt-0.5">
                ★ {store.rating || "5.0"}
              </span>
            </div>
            <div className="bg-white/[0.01] border border-white/5 p-2 rounded-xl">
              <span className="block text-[9px] text-white/40">OBUNACHILAR</span>
              <span className="text-xs font-black text-white mt-0.5">{following ? (store.followers || 340) + 1 : (store.followers || 340)}</span>
            </div>
            <div className="bg-white/[0.01] border border-white/5 p-2 rounded-xl">
              <span className="block text-[9px] text-white/40">MAHSULOTLAR</span>
              <span className="text-xs font-black text-cyan-400 mt-0.5">{storeProducts.length} ta</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PRODUCT LISTING FOR THIS ATELIER */}
      <div className="space-y-4">
        <div className="border-b border-white/5 pb-3 flex justify-between items-center">
          <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
            {store.name} Atelierining to'liq kollektsiyasi ({storeProducts.length} ta)
          </h3>
          <span className="text-[10px] text-white/40 uppercase">Garanatlangan sifat sertifikati</span>
        </div>

        {storeProducts.length === 0 ? (
          <div className="p-12 glass-panel text-center text-white/40 text-xs">
            Ushbu brend uchun do'kon egasi hali mahsulot joylashtirmagan yoki mahsulotlar tugagan. Keyinroq qaytib tekshiring!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {storeProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isWishlisted={wishlist.includes(p.id)}
                onToggleWishlist={() => onToggleWishlist(p.id)}
                onViewDetails={() => onViewProduct(p)}
                onAddToCart={() => onAddToCart(p)}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
