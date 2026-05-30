import React from "react";
import { Star, Heart, ShoppingBag } from "lucide-react";
import { Product, Store } from "../types";

interface ProductCardProps {
  product: Product;
  storeName?: string;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  onViewDetails: () => void;
  onAddToCart: () => void;
  aiReason?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  storeName,
  isWishlisted,
  onToggleWishlist,
  onViewDetails,
  onAddToCart,
  aiReason,
}) => {
  return (
    <div className="glass-panel p-4 flex flex-col h-[390px] relative group border border-white/5 hover:border-cyan-500/30 transition-all duration-300">
      {/* AI Qidiruv bo'yicha tavsiya tushuntirishi */}
      {aiReason && (
        <div className="absolute inset-x-2 top-2 z-20 p-2.5 bg-cyan-950/95 border border-cyan-400/40 rounded-xl text-[11px] text-cyan-300 shadow-xl leading-normal animate-pulse">
          <span className="font-bold">AI Izohi: </span>
          {aiReason}
        </div>
      )}

      {/* Mahsulot Rasmi */}
      <div className="relative h-44 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center overflow-hidden mb-3">
        <img
          src={product.images[0]}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
          referrerPolicy="no-referrer"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist();
          }}
          className="absolute top-2.5 right-2 px-2 py-2 rounded-full bg-slate-950/60 backdrop-blur-md text-white/70 hover:text-red-400 border border-white/5 transition-all duration-300"
          id={`wishlist-${product.id}`}
        >
          <Heart
            className={`w-4 h-4 ${
              isWishlisted ? "fill-red-400 text-red-400" : ""
            }`}
          />
        </button>

        {product.stock <= 3 && product.stock > 0 && (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[8px] font-black bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-widest">
            Kam qoldi! {product.stock} dona
          </span>
        )}
      </div>

      {/* Mahsulot ma'lumotlari */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px]">
            {storeName ? (
              <span className="text-cyan-400 font-bold truncate max-w-[120px] hover:underline" onClick={(e) => { e.stopPropagation(); onViewDetails(); }}>
                {storeName}
              </span>
            ) : (
              <span className="text-white/40 font-mono">KOD: P-{product.id.substring(5, 10)}</span>
            )}
            <span className="text-amber-400 flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-current" /> {product.rating || "5.0"}
            </span>
          </div>

          <h4
            onClick={onViewDetails}
            className="font-bold text-sm text-white/95 truncate hover:text-cyan-400 transition-colors cursor-pointer"
          >
            {product.title}
          </h4>
          <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Narx va Savatga Qo'shish */}
        <div className="pt-3 border-t border-white/5 flex justify-between items-center mt-3">
          <div>
            <p className="text-[10px] text-white/40">Narxi</p>
            <span className="text-sm font-black text-white">
              ${product.price.toLocaleString()}
            </span>
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={onViewDetails}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white font-semibold transition-all cursor-pointer"
            >
              Batafsil
            </button>
            <button
              onClick={onAddToCart}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 text-black hover:bg-cyan-400 font-bold text-[11px] hover:-translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-cyan-400/20"
              id={`add-${product.id}`}
            >
              <ShoppingBag className="w-3 h-3" />
              Savatga
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
