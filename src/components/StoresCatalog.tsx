import React from "react";
import { Star, Shield, ArrowRight, Store as StoreIcon } from "lucide-react";
import { Store } from "../types";

interface StoresCatalogProps {
  stores: Store[];
  onNavigateToStore: (slug: string) => void;
}

export const StoresCatalog: React.FC<StoresCatalogProps> = ({
  stores,
  onNavigateToStore,
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sarlavha */}
      <div className="p-5 bg-gradient-to-r from-cyan-950/20 to-black/30 rounded-2xl border border-white/5 flex justify-between items-center">
        <div>
          <h3 className="font-extrabold text-sm text-cyan-400">Atelierlar va brendlar katalogi</h3>
          <p className="text-xs text-white/50 mt-1">AI MALL GLOBAL ruxsati ostida faoliyat yuritadigan elita brendlari va hunarmandlar bo'limi</p>
        </div>
        <span className="text-[11px] bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 px-3 py-1 rounded-full font-bold">
          {stores.length} ta ro'yxatdan o'tgan hamkorlar
        </span>
      </div>

      {/* Do'konlar ro'yxati */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stores.map((st) => (
          <div
            key={st.id}
            className="glass-panel p-6 flex flex-col justify-between hover:border-cyan-400/30 transition-all group"
            id={`store-card-${st.slug}`}
          >
            <div className="flex gap-4 items-start">
              <img
                src={st.logo}
                alt={st.name}
                className="w-16 h-16 rounded-2xl object-cover border border-white/10 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm text-white group-hover:text-cyan-400 transition-colors">
                    {st.name}
                  </h4>
                  {st.verified && (
                    <span className="bg-cyan-500/15 border border-cyan-400/30 text-cyan-400 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5" /> VERIFIED
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/60 leading-relaxed font-light">{st.description}</p>
                
                <div className="flex gap-3 items-center mt-3 text-[11px] text-white/40 font-mono">
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" /> {st.rating || "5.0"}
                  </span>
                  <span>•</span>
                  <span>{st.followers || "340"} Obunachilar</span>
                  <span>•</span>
                  <span>Komissiya stavkasi: {st.commissionRate}%</span>
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 mt-5 flex justify-between items-center text-xs">
              <span className="text-[10px] text-white/30 font-mono">ID BREND: S-{st.id.substring(6, 12).toUpperCase()}</span>
              
              <button
                onClick={() => onNavigateToStore(st.slug)}
                className="px-4 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-400/20 transition-all flex items-center gap-1.5 cursor-pointer hover:translate-x-1"
              >
                Atelierga kirish
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
