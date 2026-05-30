import React, { useState } from "react";
import { Search, Bot, Star, ArrowUpDown, Filter, Sparkles, Upload, Image as ImageIcon, CheckCircle, Flame, Eye, ShoppingCart, RefreshCw } from "lucide-react";
import { Product, Store } from "../types";
import { ProductCard } from "./ProductCard";

interface BoshSahifaProps {
  products: Product[];
  stores: Store[];
  wishlist: string[];
  onToggleWishlist: (pId: string) => void;
  onViewProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onNavigateToStore: (slug: string) => void;
}

export const BoshSahifa: React.FC<BoshSahifaProps> = ({
  products,
  stores,
  wishlist,
  onToggleWishlist,
  onViewProduct,
  onAddToCart,
  onNavigateToStore,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [useAiSemanticSearch, setUseAiSemanticSearch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular"); // popular, price-asc, price-desc, rating
  const [maxPrice, setMaxPrice] = useState(1000);
  const [searching, setSearching] = useState(false);

  // AI assistant recommendations mapped by product dynamic IDs
  const [aiMatches, setAiMatches] = useState<Record<string, string>>({});
  const [aiExplanationUsed, setAiExplanationUsed] = useState(false);

  // Image search State
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [uploadedSearchImage, setUploadedSearchImage] = useState<string>("");
  const [imageSearching, setImageSearching] = useState(false);
  const [imageSearchMatches, setImageSearchMatches] = useState<string[]>([]);
  const [imageSearchFeedback, setImageSearchFeedback] = useState("");

  // Handle Search submit
  const handleSearchCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setAiMatches({});
      setAiExplanationUsed(false);
      return;
    }

    if (useAiSemanticSearch) {
      setSearching(true);
      try {
        const response = await fetch("/api/ai/shopping-assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchTerm }),
        });
        if (response.ok) {
          const res = await response.json();
          const matchMap: Record<string, string> = {};
          if (res.matches && res.matches.length > 0) {
            res.matches.forEach((item: { id: string; reason: string }) => {
              matchMap[item.id] = item.reason;
            });
            setAiMatches(matchMap);
            setAiExplanationUsed(true);
          } else {
            setAiMatches({});
            setAiExplanationUsed(false);
            alert("Siz kiritgan so'rov bo'yicha AI tavsiyalar topilmadi.");
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    } else {
      setAiMatches({});
      setAiExplanationUsed(false);
    }
  };

  // Real Visual Image Search with Gemini
  const handleImageSearchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageSearching(true);
    setImageSearchMatches([]);
    setImageSearchFeedback("");
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      setUploadedSearchImage(base64Data);
      
      try {
        const response = await fetch("/api/ai/visual-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64Data }),
        });
        
        if (response.ok) {
          const res = await response.json();
          if (res.success && res.matches) {
            const matchesIds = res.matches.map((item: any) => item.id);
            setImageSearchMatches(matchesIds);
            setImageSearchFeedback(res.feedback || "Tahlil yakunlandi.");
            
            // Build additional notes
            let notes = "";
            res.matches.forEach((m: any) => {
              const prod = products.find(p => p.id === m.id);
              if (prod) {
                notes += `• ${prod.title} (Moslik: ${m.score}%) - ${m.reason}\n`;
              }
            });
            if (notes) {
              setImageSearchFeedback(prev => prev + "\n\n" + notes);
            }
          } else {
            setImageSearchFeedback("Server tahlil natijasini qaytara olmadi. Iltimos boshqa rasm yuklab ko'ring.");
          }
        } else {
          setImageSearchFeedback("API orqali tahlil qilishda xatolik yuz berdi.");
        }
      } catch (err) {
        console.error("Visual-search error:", err);
        setImageSearchFeedback("Server ulanishida kutilmagan xatolik. Qaytadan urinib ko'ring.");
      } finally {
        setImageSearching(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const getStoreNameOfProduct = (p: Product) => {
    const s = stores.find(st => st.id === p.storeId);
    return s ? s.name : "Nomalum do'kon";
  };

  // Filter and sort products
  const filteredProducts = products.filter(prod => {
    // Search filter
    const matchesSearch = prod.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          prod.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = selectedCategory === "all" || prod.categoryId === selectedCategory;
    
    // Price filter
    const matchesPrice = prod.price <= maxPrice;

    // If AI semantic search is active, match either normal search or AI matches list
    if (aiExplanationUsed) {
      return (prod.id in aiMatches) && matchesCategory && matchesPrice;
    }

    // If Image Search is active, filter matches
    if (imageSearchMatches.length > 0 && showImageSearch) {
      return imageSearchMatches.includes(prod.id) && matchesCategory && matchesPrice;
    }

    return matchesSearch && matchesCategory && matchesPrice;
  });

  // Sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    if (sortBy === "rating") return b.rating - a.rating;
    return b.salesCount - a.salesCount; // popular
  });

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. HERO SLIDER SECTION */}
      <section className="relative rounded-3xl overflow-hidden border border-white/5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 md:p-12 flex flex-col justify-between h-[360px] md:h-[400px]">
        {/* Lights back and effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-gradient-to-l from-cyan-400/10 via-cyan-500/5 to-transparent rounded-full filter blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full filter blur-[80px] pointer-events-none"></div>

        <div className="absolute top-5 right-5 z-10 hidden md:block">
          <span className="px-3.5 py-1.5 rounded-full text-[9px] font-black bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
            <Flame className="w-3.5 h-3.5" /> MILLION LAB FOYDALANUVCHILAR UCHUN ELITA SIFAT
          </span>
        </div>

        <div className="space-y-4 max-w-2xl relative z-10 my-auto">
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
            An'anaviy Milliy Modda <br />
            <span className="glow-text font-black">Sun'iy Intellekt Bilashuvida</span>
          </h1>
          <p className="text-xs md:text-sm text-white/60 leading-relaxed font-light">
            O'zbekistondagi ilk AI asosidagi Multi-Vendor bozori. Marg'ilon ipaklari, an'anaviy chaponlar va kelajak texnologiyalari bitta premium ekotizimda mujassam.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                const suiteEl = document.getElementById("ai-search-entry");
                suiteEl?.scrollIntoView({ behavior: "smooth" });
              }}
              className="glow-btn px-6 py-2.5 rounded-xl text-black text-xs font-extrabold shadow-lg hover:cursor-pointer flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              AI bilan mahsulot topish
            </button>
            <button
              onClick={() => setShowImageSearch(!showImageSearch)}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 rounded-xl transition-all cursor-pointer flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              Rasm bo'yicha qidirish
            </button>
          </div>
        </div>

        <div className="border-t border-white/5 pt-4 text-[10px] md:text-xs text-white/40 flex justify-between tracking-wide font-mono uppercase">
          <span>TASHKENT AUTHORIZED SITE</span>
          <span>PLATFORM VERIFIED EXCLUSIVE MERCHANTS: {stores.length} TA</span>
        </div>
      </section>

      {/* 2. IMAGE SEARCH EXPANDABLE SECTION */}
      {showImageSearch && (
        <div className="glass-panel p-6 border-cyan-400/20 animate-fade-in space-y-4" id="image-search-panel">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-cyan-400" />
              <h3 className="font-extrabold text-sm text-white">Visual qidiruv (Rasm bo'yicha kiyim topish)</h3>
            </div>
            <button
              onClick={() => {
                setShowImageSearch(false);
                setUploadedSearchImage("");
                setImageSearchMatches([]);
              }}
              className="text-[11px] text-white/50 hover:text-white underline cursor-pointer"
            >
              Yopish
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 border border-dashed border-white/10 rounded-xl bg-white/[0.01] hover:bg-white/[0.02] flex flex-col items-center justify-center space-y-3 relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSearchUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-cyan-400" />
              <p className="text-xs font-bold text-white">Xarid qilmoqchi bo'lgan kiyimingiz rasmini yuklang</p>
              <p className="text-[10px] text-white/40">Tizim uni bazadagi eng mos mahsulotlar bilan solishtiradi</p>
            </div>

            <div className="flex flex-col justify-center space-y-3 p-4 bg-white/[0.01] border border-white/5 rounded-xl">
              {imageSearching ? (
                <div className="text-center py-6 space-y-2">
                  <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
                  <p className="text-xs text-white/60">Yuklangan rasmning ranglar va andozalari tahlil qilinmoqda...</p>
                </div>
              ) : uploadedSearchImage ? (
                <div className="space-y-3 text-xs">
                  <p className="text-cyan-300 font-bold flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-emerald-400" /> Tahlil muvaffaqiyatli yakunlandi!
                  </p>
                  <p className="text-white/75 leading-relaxed italic whitespace-pre-line">{imageSearchFeedback}</p>
                  <div className="flex items-center gap-3">
                    <img src={uploadedSearchImage} className="w-14 h-14 object-cover rounded-lg border border-white/20" />
                    <span className="text-cyan-400">⚡</span>
                    <span className="text-[10px] text-white/40 font-mono">3 ta eng yaqin mahsulot katalogda aniqlandi</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-white/30 text-center py-8">Rasm yuklashingiz bilan ushbu bo'limda sun'iy intellekt tahlili sharhi chop etiladi.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. SEARCH AND FILTERS */}
      <div className="space-y-4" id="ai-search-entry">
        <form onSubmit={handleSearchCommit} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="w-4.5 h-4.5 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={useAiSemanticSearch ? "AI ga qidiruv bering, masalan: '200 dollargacha qora chapon chiroyli dizayndagi'..." : "Katalog bo'yicha tezkor qidiruv..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 text-xs outline-none focus:border-cyan-400 transition-all font-light"
            />
          </div>

          <button
            type="button"
            onClick={() => setUseAiSemanticSearch(!useAiSemanticSearch)}
            className={`px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              useAiSemanticSearch
                ? "bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-400/20"
                : "bg-white/5 border-white/10 text-white hover:bg-white/10"
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>AI Qidiruv: {useAiSemanticSearch ? "Faol (Gemini)" : "O'chiq"}</span>
          </button>

          <button
            type="submit"
            disabled={searching}
            className="glow-btn px-6 rounded-xl hover:cursor-pointer text-black font-extrabold text-xs"
          >
            {searching ? "Qidirilmoqda..." : "Yuborish"}
          </button>
        </form>

        {/* AI Shopping Semantic indicator */}
        {aiExplanationUsed && (
          <div className="p-3.5 bg-cyan-950/30 border border-cyan-400/35 rounded-xl text-xs flex justify-between items-center text-cyan-300">
            <p className="flex items-center gap-2">
              <Bot className="w-4 h-4 animate-bounce" />
              <span>Sun'iy Intellekt qidiruvi qo'llanilgan, asosan quyidagi mahsulotlar mos deb topildi. Matn va narxdan tashqari semantik bog'liqliklar tahlil qilingan.</span>
            </p>
            <button
              onClick={() => {
                setAiMatches({});
                setAiExplanationUsed(false);
                setSearchTerm("");
              }}
              className="text-xs text-cyan-300 font-bold hover:text-white px-2 py-1 bg-cyan-500/10 rounded cursor-pointer border border-cyan-400/20"
            >
              Filterni Yopish
            </button>
          </div>
        )}

        {/* Categories, Sort, Range */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-3 border-t border-white/5">
          {/* Categories select tabs */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "Barchasi" },
              { id: "clothing", label: "Kiyim-kechaklar" },
              { id: "electronics", label: "Elita Elektronika" },
              { id: "footwear", label: "Nafis Poyabzallar" },
              { id: "home", label: "Premium Uy jihozlari" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setImageSearchMatches([]); // clear image search filters on category change
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-white/10 text-white border border-white/20"
                    : "text-white/40 hover:text-white/80"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 border border-white/5 rounded-xl">
              <ArrowUpDown className="w-3.5 h-3.5 text-white/40" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-none text-white outline-none cursor-pointer text-xs"
              >
                <option value="popular">Ommabopligi bo'yicha</option>
                <option value="price-asc">Narxi: O'sish tartibida</option>
                <option value="price-desc">Narxi: Kamayish tartibida</option>
                <option value="rating">Reytingi bo'yicha</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white/40">Maks. Narx:</span>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="accent-cyan-400 bg-white/20 h-1 rounded-lg outline-none cursor-pointer"
              />
              <span className="font-bold text-cyan-400">${maxPrice}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PRODUCT GRID */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
            Sizga munosib premium mahsulotlar ({sortedProducts.length} ta)
          </h3>
          <span className="text-[10px] font-mono text-white/40">UZBEKISTAN INSURED SHIPPING CERTIFIED</span>
        </div>

        {sortedProducts.length === 0 ? (
          <div className="p-12 glass-panel text-center text-white/40 text-xs">
             Tanlangan parametrlar bo'yicha kiyim yoki tovar topilmadi. Filtorlarni tozalab ko'ring.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                storeName={getStoreNameOfProduct(p)}
                isWishlisted={wishlist.includes(p.id)}
                onToggleWishlist={() => onToggleWishlist(p.id)}
                onViewDetails={() => onViewProduct(p)}
                onAddToCart={() => onAddToCart(p)}
                aiReason={aiMatches[p.id]}
              />
            ))}
          </div>
        )}
      </div>

      {/* 5. SEED STORES DYNAMIC LIST */}
      <section className="space-y-4">
        <div className="border-t border-white/5 pt-6 flex justify-between items-center">
          <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
            Platformadagi elita do'konlar (Atelierlar)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stores.slice(0, 4).map((store) => (
            <div
              key={store.id}
              onClick={() => onNavigateToStore(store.slug)}
              className="glass-panel p-4 flex gap-4 cursor-pointer hover:border-cyan-400/30 transition-all duration-300"
            >
              <img
                src={store.logo}
                alt={store.name}
                className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-xs text-white truncate">{store.name}</h4>
                  {store.verified && (
                    <span className="bg-cyan-500/10 text-cyan-400 text-[8px] font-black border border-cyan-400/20 px-1.5 py-0.5 rounded uppercase">
                      Tekshirilgan do'kon
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed">
                  {store.description}
                </p>
                <div className="text-[10px] text-amber-400 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> {store.rating || "5.0"} • {store.followers || 150} ta obunachilar
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
