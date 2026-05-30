import React, { useState, useEffect } from "react";
import { Sparkles, Bot, Trash2, Edit, AlertCircle, TrendingUp, DollarSign, Package, Check, Clipboard, Clock, RefreshCw } from "lucide-react";
import { Store, Product, Order } from "../types";

interface VendorDashboardProps {
  vendorStore: Store | null;
  products: Product[];
  orders: Order[];
  onFetchLatestDb: () => void;
  onLogoutAdmin: () => void;
}

export const VendorDashboard: React.FC<VendorDashboardProps> = ({
  vendorStore,
  products,
  orders,
  onFetchLatestDb,
  onLogoutAdmin,
}) => {
  // Statics
  const [vendorProducts, setVendorProducts] = useState<Product[]>([]);
  const [vendorOrders, setVendorOrders] = useState<Order[]>([]);

  // Product submission forms
  const [newProd, setNewProd] = useState({
    title: "",
    categoryId: "clothing",
    price: "",
    stock: "",
    imageUrl: "",
    description: "",
  });

  // AI Copywriter generator States
  const [rawTitleInput, setRawTitleInput] = useState("");
  const [copywriterCategory, setCopywriterCategory] = useState("clothing");
  const [copywriterLoading, setCopywriterLoading] = useState(false);
  const [copywriterResult, setCopywriterResult] = useState<{
    title: string;
    description: string;
    keywords: string[];
  } | null>(null);

  useEffect(() => {
    if (vendorStore) {
      // Filter products & orders matching store ID
      setVendorProducts(products.filter((p) => p.storeId === vendorStore.id));
      setVendorOrders(
        orders.filter((ord) => ord.items && ord.items.some((item) => item.storeId === vendorStore.id))
      );
    }
  }, [products, orders, vendorStore]);

  // Try trigger AI copywriter generator API
  const handleGenerateCopywriting = async () => {
    if (!rawTitleInput.trim()) {
      alert("Iltimos, mahsulotning xomaki nomini kiriting. Masalan: 'Ipak kiyim' ");
      return;
    }
    setCopywriterLoading(true);
    try {
      const response = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: rawTitleInput, category: copywriterCategory }),
      });
      if (!response.ok) throw new Error("Copywriter API xatosi");
      const resData = await response.json();
      setCopywriterResult(resData.generated);

      // Autofill form
      setNewProd((p) => ({
        ...p,
        title: resData.generated.title,
        description: resData.generated.description,
        categoryId: copywriterCategory,
      }));
    } catch (err) {
      console.error(err);
      // Fallback
      const fallbackCopy = {
        title: `Elita Lux ${rawTitleInput}`,
        description: `Bizning premium ${rawTitleInput} mahsulotimiz yuqori sifatli andozalar asosida, milliy an'analarni saqlagan holda tayyorlandi. Kundalik qulaylik va elita moslik kafolatlanadi.`,
        keywords: ["ipak", "chiroyli", "milliy", "modern", "elita"],
      };
      setCopywriterResult(fallbackCopy);
      setNewProd((p) => ({
        ...p,
        title: fallbackCopy.title,
        description: fallbackCopy.description,
        categoryId: copywriterCategory,
      }));
    } finally {
      setCopywriterLoading(false);
    }
  };

  // Submit product Creation to server API
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorStore) return;

    if (Number(newProd.price) <= 0 || Number(newProd.stock) <= 0) {
      alert("Narx va ombor miqdori 0 dan yuqori bo'lishi shart.");
      return;
    }

    // Set mockup fallback image from unsplash if left empty 
    const fallbackImage = newProd.imageUrl || (newProd.categoryId === "clothing" 
      ? "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=400&q=80"
      : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80");

    try {
      const payload = {
        title: newProd.title,
        description: newProd.description,
        price: Number(newProd.price),
        categoryId: newProd.categoryId,
        images: [fallbackImage],
        stock: Number(newProd.stock),
        storeId: vendorStore.id,
      };

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Mahsulot qo'shish xatosi");
      alert("Yangi mahsulot omborga muvaffaqiyatli saqlandi!");
      
      // Clear forms
      setNewProd({
        title: "",
        categoryId: "clothing",
        price: "",
        stock: "",
        imageUrl: "",
        description: "",
      });
      setCopywriterResult(null);
      setRawTitleInput("");
      
      onFetchLatestDb();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete matching product
  const handleDeleteProduct = async (pId: string) => {
    if (!confirm("Haqiqatan ham ushbu tovar kodini o'chirib tashlamoqchimisiz?")) return;
    try {
      const res = await fetch(`/api/products/${pId}`, { method: "DELETE" });
      if (res.ok) {
        alert("Tovar katalogdan butunlay olib tashlandi.");
        onFetchLatestDb();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Modify Order delivery Status
  const handleUpdateOrderStatus = async (orderId: string, currentStatus: string) => {
    const nextStatusMap: Record<string, string> = {
      pending: "processing",
      processing: "shipped",
      shipped: "delivered",
      delivered: "processing",
    };
    const newStatus = nextStatusMap[currentStatus] || "processing";

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      if (response.ok) {
        alert("Buyurtma holati muvaffaqiyatli o'zgartirildi!");
        onFetchLatestDb();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Turnovers compute
  const totalTurnover = vendorProducts.reduce((sum, p) => sum + (p.price * (p.salesCount || 0)), 0);

  return (
    <div className="space-y-6 animate-fade-in" id="vendor-dashboard-panel">
      
      {/* 1. SELLER STATUS HEADER */}
      {vendorStore ? (
        <div className="p-6 bg-gradient-to-r from-indigo-950/40 to-slate-900/60 border border-indigo-500/20 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-85 h-85 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="flex gap-4 items-center relative z-10">
            <img
              src={vendorStore.logo}
              alt={vendorStore.name}
              className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">{vendorStore.name} (Atelier boshqaruvi)</h2>
                <span className="bg-emerald-500 text-black text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                  FAOL SOTUVCHI
                </span>
              </div>
              <p className="text-xs text-white/50">{vendorStore.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 relative z-10">
            <span className="text-[10px] bg-indigo-500/10 text-indigo-300 font-mono border border-indigo-500/20 px-3 py-1.5 rounded-full font-bold">
              PLATFORMA KOMISSIYASI: {vendorStore.commissionRate}%
            </span>
            <button
              onClick={onLogoutAdmin}
              className="px-4 py-1.5 rounded-xl bg-red-400/10 hover:bg-red-400/20 text-red-400 text-xs font-bold transition border border-red-500/20 cursor-pointer"
            >
              Chiqish
            </button>
          </div>
        </div>
      ) : (
        <div className="p-5 bg-red-950/20 border border-red-500/20 rounded-2xl text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <h4 className="font-bold text-xs text-white">Do'koningiz ruxsati aniqlanmadi</h4>
          <p className="text-xs text-white/50">Iltimos, tizimga ruxsat kodi orqali qayta kiring.</p>
        </div>
      )}

      {/* 2. MAIN FINANCIAL STATISTICS METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 space-y-1">
          <div className="flex justify-between items-center text-white/40">
            <span className="text-[9px] uppercase tracking-wider font-bold">Umumiy Savdo aylanmasi</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-indigo-300">${totalTurnover.toLocaleString()}</p>
          <span className="text-[10px] text-emerald-400 font-bold block">✓ Tranzaksiya to'lovlaridan olingan</span>
        </div>

        <div className="glass-panel p-5 space-y-1">
          <div className="flex justify-between items-center text-white/40">
            <span className="text-[9px] uppercase tracking-wider font-bold">Ombor inventarlari soni</span>
            <Package className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white">{vendorProducts.length} xil kiyim</p>
          <span className="text-[10px] text-white/40">Sotuvga tayyor tahlillar faol</span>
        </div>

        <div className="glass-panel p-5 space-y-1">
          <div className="flex justify-between items-center text-white/40">
            <span className="text-[9px] uppercase tracking-wider font-bold">Kutilayotgan sof foyda</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-cyan-300">
            ${(totalTurnover * (1 - (vendorStore?.commissionRate || 10) / 100)).toLocaleString()}
          </p>
          <span className="text-[10px] text-indigo-400">Komissiya chegirib tashlangan</span>
        </div>
      </div>

      {/* 3. GEMINI AI ACTION COPYWRITER */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <Bot className="w-5 h-5 text-indigo-400 animate-pulse" />
          <div>
            <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">Gemini Sun'iy intellekt tovar yozuvchisi (Sotuvchini Qo'llab-Quvvatlash)</h4>
            <p className="text-[10px] text-white/50">Tovar nomidan bitta kalit kirsangiz, AI sizga premium nom, batafsil tavsif va SEO kalit so'zlarni tayyorlaydi.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder=" raw so'zni kiriting, masalan: 'oq atlas ipak ro'mol'..."
              value={rawTitleInput}
              onChange={(e) => setRawTitleInput(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2.5 text-xs outline-none focus:border-indigo-400"
            />
          </div>

          <div className="w-full md:w-44">
            <select
              value={copywriterCategory}
              onChange={(e) => setCopywriterCategory(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none focus:border-indigo-400"
            >
              <option value="clothing">Kiyim-kechaklar (Fashion)</option>
              <option value="electronics">Elita Elektronika</option>
              <option value="footwear">Nafis Poyabzallar</option>
              <option value="home">Premium Uy jihozlari</option>
            </select>
          </div>

          <button
            onClick={handleGenerateCopywriting}
            disabled={copywriterLoading}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 cursor-pointer transition flex items-center gap-1.5"
          >
            {copywriterLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Kopinat tayyorlanmoqda...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Matn generatorini chaqirish
              </>
            )}
          </button>
        </div>

        {copywriterResult && (
          <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-xl space-y-3.5 text-xs animate-fade-in">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-indigo-300">
              <span>SINOV TIZIMI TAHLIL NATIJALARI</span>
              <span>Gemini taklifi</span>
            </div>
            
            <div className="space-y-2">
              <div>
                <strong className="text-white text-xs block mb-0.5">Tavsiya etiladigan elita nomi:</strong>
                <span className="font-mono text-indigo-300 text-xs">{copywriterResult.title}</span>
              </div>
              <div>
                <strong className="text-white text-xs block mb-0.5">Batafsil premium tavsif:</strong>
                <p className="text-white/70 leading-relaxed font-light italic bg-black/25 p-2.5 rounded-lg border border-white/5">
                  "{copywriterResult.description}"
                </p>
              </div>
              <div>
                <strong className="text-white text-xs block mb-1">SEO kalit so'zlari:</strong>
                <div className="flex flex-wrap gap-1.5">
                  {copywriterResult.keywords.map((kw, i) => (
                    <span key={i} className="text-[9px] bg-slate-900 border border-white/5 text-slate-400 px-2.5 py-1 rounded">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. SUBMIT REAL PRODUCT INVENTORY CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* FORM FORM ADDS PRODUCT (5 columns) */}
        <div className="lg:col-span-5 glass-panel p-6 space-y-4">
          <h3 className="font-extrabold text-xs text-indigo-300 border-b border-white/5 pb-2 uppercase tracking-widest">
            Ushbu do'konga tovar joylashtirish formasi
          </h3>

          <form onSubmit={handleSubmitProduct} className="space-y-3 text-xs">
            <div>
              <label className="block text-white/50 mb-1">Dizayn/Tovar nomi</label>
              <input
                type="text"
                required
                value={newProd.title}
                onChange={(e) => setNewProd((p) => ({ ...p, title: e.target.value }))}
                className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white/50 mb-1">Narxi ($ USD)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 150"
                  value={newProd.price}
                  onChange={(e) => setNewProd((p) => ({ ...p, price: e.target.value }))}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-white/50 mb-1">Ombor miqdori (Soni)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 20"
                  value={newProd.stock}
                  onChange={(e) => setNewProd((p) => ({ ...p, stock: e.target.value }))}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/50 mb-1">Ulanadigan rasm URL manzili (Unsplash)</label>
              <input
                type="text"
                placeholder="https://..."
                value={newProd.imageUrl}
                onChange={(e) => setNewProd((p) => ({ ...p, imageUrl: e.target.value }))}
                className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-white/50 mb-1">Batafsil kiyim andozaviy tavsif matni</label>
              <textarea
                rows={4}
                required
                value={newProd.description}
                onChange={(e) => setNewProd((p) => ({ ...p, description: e.target.value }))}
                className="w-full bg-slate-950 border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none focus:border-cyan-400"
              />
            </div>

            <button
              type="submit"
              className="w-full glow-btn text-black font-extrabold text-xs py-2.5 rounded-xl cursor-pointer"
            >
              Ushbu tovar kodini sotuvga qo'shish
            </button>
          </form>
        </div>

        {/* LIST COMMODITY IN CURRENT ATELIER (7 columns) */}
        <div className="lg:col-span-7 glass-panel p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-xs text-indigo-300 border-b border-white/5 pb-2 uppercase tracking-widest mb-4">
              Faol do'kon inventarlari ({vendorProducts.length} ta kiyim turi)
            </h3>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {vendorProducts.length === 0 ? (
                <p className="text-center py-12 text-white/40 text-xs">Ushbu atelierda hozircha mahsulot to'ldirilmagan.</p>
              ) : (
                vendorProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between items-center rounded-xl bg-white/[0.01] border border-white/5 p-3 hover:bg-white/[0.02] transition"
                  >
                    <div className="flex gap-3 items-center min-w-0">
                      <img src={p.images[0]} alt="prod" className="w-10 h-10 object-cover rounded-lg" />
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-xs text-white truncate max-w-[200px]">{p.title}</h4>
                        <span className="text-[10px] text-white/40 font-mono block">Omborda: {p.stock} dona • Savdolar soni: {p.salesCount || 0} ta</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-indigo-300">${p.price}</span>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="text-red-400 hover:text-red-300 p-2 bg-white/5 rounded-lg cursor-pointer"
                        id={`delete-prod-${p.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 5. VENDOR ASSIGNED ACTIVE SYSTEM ORDERS */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="font-extrabold text-xs text-indigo-300 border-b border-white/5 pb-2 uppercase tracking-widest">
          Sizning do'koningizga biriktirilgan buyurtmalar ({vendorOrders.length} ta kvitansiya)
        </h3>

        <div className="space-y-4">
          {vendorOrders.length === 0 ? (
            <p className="text-center text-white/40 text-xs py-8">Hali do'koningiz mahsulotlariga xarid amalga oshirilmagan.</p>
          ) : (
            vendorOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 bg-white/[0.01] border border-white/5 rounded-xl space-y-3 text-xs"
              >
                <div className="flex justify-between items-center flex-wrap gap-2 text-xs">
                  <div>
                    <span className="font-black text-indigo-400 mr-2">BUH-ID: #{ord.id.substring(4, 12).toUpperCase()}</span>
                    <span className="text-white/40">{new Date(ord.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40">ZAKAZ HOLATI:</span>
                    <button
                      onClick={() => handleUpdateOrderStatus(ord.id, ord.orderStatus)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                        ord.orderStatus === "delivered"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : ord.orderStatus === "shipped"
                          ? "bg-cyan-500/10 text-cyan-400 border border-cyan-400/20"
                          : ord.orderStatus === "processing"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                      }`}
                      id={`status-ord-${ord.id}`}
                    >
                      {ord.orderStatus === "pending"
                        ? "Kutilmoqda ⏱️"
                        : ord.orderStatus === "processing"
                        ? "Tayyorlanmoqda ⌛"
                        : ord.orderStatus === "shipped"
                        ? "Yuborilgan 🚚"
                        : "Etkazilgan ✓"}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 border-t border-b border-white/5 py-2.5">
                  <span className="text-[10px] text-indigo-300 font-extrabold uppercase block select-none">Mulk ro'yxati (Ushbu sotuv uchun):</span>
                  {(ord.items || [])
                    .filter((i) => i.storeId === vendorStore?.id)
                    .map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-white/70 font-light truncate max-w-[220px]">{item.productTitle}</span>
                        <span className="text-white/40 font-mono">X{item.quantity} dona</span>
                        <span className="font-extrabold text-white">${item.price}</span>
                      </div>
                    ))}
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-emerald-400">✓ CLICK / PAYME simulator yechib olindi</span>
                  <div className="text-right">
                    <span className="text-white/40 mr-1">Faktura jami:</span>
                    <span className="font-black text-indigo-400">
                      ${(ord.items || [])
                        .filter((i) => i.storeId === vendorStore?.id)
                        .reduce((tot, i) => tot + i.price * i.quantity, 0)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
