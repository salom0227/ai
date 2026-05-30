import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  Store as StoreIcon, 
  Bot, 
  Heart, 
  Trash2, 
  CheckCircle, 
  Sparkles, 
  Package, 
  Clock, 
  Key, 
  Lock, 
  Users, 
  Menu, 
  X, 
  CreditCard,
  Shield,
  HelpCircle,
  LogOut,
  User as UserIcon
} from "lucide-react";

import { 
  User, 
  Store, 
  Product, 
  Order, 
  CartItem, 
  Coupon 
} from "./types";

import { BoshSahifa } from "./components/BoshSahifa";
import { StoresCatalog } from "./components/StoresCatalog";
import { StorePage } from "./components/StorePage";
import { ProductPage } from "./components/ProductPage";
import { AISuite } from "./components/AISuite";
import { PaymeClickSimulator } from "./components/PaymeClickSimulator";
import { VendorDashboard } from "./components/VendorDashboard";
import { SuperAdminDashboard } from "./components/SuperAdminDashboard";
import { ProfilePage } from "./components/ProfilePage";

export default function App() {
  // Locale fixed to Uzbek (Solely in Uzbek)
  // Route State: home, stores, store (param=slug), product (param=id), ai-suite, cart, orders, admin, superadmin, profile
  const [route, setRoute] = useState<{ path: string; param?: string }>({ path: "home" });

  // Authentication & Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("ai_mall_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {
        return null;
      }
    }
    return null; // Guest is default!
  });

  // Database State cache
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("ai_mall_wishlist");
      return saved ? JSON.parse(saved) : [];
    } catch (_) { return []; }
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Checkout simulator & coupons state
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [showPaySimulator, setShowPaySimulator] = useState(false);

  // Administrative login fields
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Menu toggler for responsive layout
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Checkpoint auth alert modal
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [authGateReason, setAuthGateReason] = useState<"checkout" | "ai">("checkout");

  const checkAuthAndRun = (action: () => void, reason: "checkout" | "ai") => {
    if (!currentUser) {
      setAuthGateReason(reason);
      setShowAuthGate(true);
    } else {
      action();
    }
  };

  // Fetch db cache from server
  const fetchDbData = async () => {
    try {
      const prodRes = await fetch("/api/products");
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }

      const storeRes = await fetch("/api/stores");
      if (storeRes.ok) {
        const storeData = await storeRes.json();
        setStores(storeData);
      }

      // Buyurtmalarni joriy foydalanuvchiga qarab filter qilish
      const savedUser = localStorage.getItem("ai_mall_user");
      const activeUser = savedUser ? JSON.parse(savedUser) : null;
      const ordUrl = activeUser && activeUser.role === "customer"
        ? `/api/orders?userId=${activeUser.id}`
        : "/api/orders";
      const ordRes = await fetch(ordUrl);
      if (ordRes.ok) {
        const ordData = await ordRes.json();
        setOrders(ordData);
      }
    } catch (err) {
      console.error("Xatolik: db.json dan ma'lumot yuklanmadi", err);
    }
  };

  useEffect(() => {
    fetchDbData();
  }, []);

  // Wishlist localStorage sync
  useEffect(() => {
    localStorage.setItem("ai_mall_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  // Sync route on manual pathname matches (supporting /admin & /superadmin URLs)
  useEffect(() => {
    const handleUrlTracking = () => {
      const path = window.location.pathname;
      if (path === "/admin") {
        setRoute({ path: "admin" });
      } else if (path === "/superadmin") {
        setRoute({ path: "superadmin" });
      } else if (path === "/stores") {
        setRoute({ path: "stores" });
      } else if (path === "/cart") {
        setRoute({ path: "cart" });
      } else if (path === "/orders") {
        setRoute({ path: "orders" });
      } else if (path === "/ai") {
        setRoute({ path: "ai-suite" });
      } else if (path === "/profile") {
        setRoute({ path: "profile" });
      } else if (path.startsWith("/store/")) {
        const slug = path.split("/store/")[1];
        setRoute({ path: "store", param: slug });
      } else if (path.startsWith("/product/")) {
        const id = path.split("/product/")[1];
        setRoute({ path: "product", param: id });
      } else {
        setRoute({ path: "home" });
      }
    };

    window.addEventListener("popstate", handleUrlTracking);
    // initial check
    handleUrlTracking();

    return () => window.removeEventListener("popstate", handleUrlTracking);
  }, []);

  // Helper navigating function
  const navigate = (path: string, param?: string) => {
    let url = "/";
    if (path === "admin") url = "/admin";
    else if (path === "superadmin") url = "/superadmin";
    else if (path === "stores") url = "/stores";
    else if (path === "cart") url = "/cart";
    else if (path === "orders") url = "/orders";
    else if (path === "ai-suite") url = "/ai";
    else if (path === "profile") url = "/profile";
    else if (path === "store" && param) url = `/store/${param}`;
    else if (path === "product" && param) url = `/product/${param}`;

    window.history.pushState({}, "", url);
    setRoute({ path, param });
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Switch to correct specific store if logged-in user is Owner
  const getLoggedInVendorStore = () => {
    if (!currentUser || currentUser.role !== "owner") return null;
    // ownerId orqali to'g'ri qidirish
    return stores.find(s => s.ownerId === currentUser.id) || null;
  };

  // Auth logins handler
  const handleAuthLogin = async (e: React.FormEvent, requiredRole: "owner" | "admin") => {
    e.preventDefault();
    setAuthError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword })
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.user.role !== requiredRole) {
          setAuthError(`Ruxsat rad etildi. Ushbu portalga kirish uchun siz ${requiredRole === "owner" ? "Do'kon ma'muri" : "Super Admin"} bo'lishingiz kerak.`);
          return;
        }
        setCurrentUser(resData.user);
        setAdminEmail("");
        setAdminPassword("");
      } else {
        const err = await response.json();
        setAuthError(err.message || "Email yoki parol noto'g'ri kiritildi.");
      }
    } catch (err) {
      setAuthError("Tizimga kirishda xatolik yuz berdi. Aloqani tekshiring.");
    }
  };

  const handleLogout = () => {
    // Reset customer back to null (Guest)
    setCurrentUser(null);
    localStorage.removeItem("ai_mall_user");
    setAppliedCoupon(null);
    setCart([]);
    navigate("home");
  };

  // Add standard product to cart
  const handleAddToCart = (product: Product, count = 1) => {
    setCart((prev) => {
      const match = prev.find(item => item.product.id === product.id);
      if (match) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + count } : item
        );
      }
      return [...prev, { product, quantity: count, storeId: product.storeId }];
    });
  };

  // Remove item from cart completely
  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(c => c.product.id !== productId));
  };

  // Adjust Cart qty count
  const handleUpdateCartQty = (productId: string, val: number) => {
    if (val <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart((prev) => prev.map(item =>
      item.product.id === productId ? { ...item, quantity: val } : item
    ));
  };

  // Coupon validity checker
  const handleCouponCheck = async () => {
    if (!couponInput.trim()) return;
    try {
      const res = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput })
      });
      if (res.ok) {
        const data = await res.json();
        setAppliedCoupon(data.coupon);
        alert(`Kupon muvaffaqiyatli qabul qilindi! Sizga ${data.coupon.discount}% chegirirma taqdim etildi.`);
      } else {
        alert("Noto'g'ri kupon kodi yoki muddati o'tgan.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger Payme / CLICK complete order placement
  const executePaymentCheckout = async (paymentOptionSelected: string) => {
    if (cart.length === 0 || !currentUser) return;

    const payloadItems = cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      price: item.product.price,
      productTitle: item.product.title,
      productImage: item.product.images[0],
      storeId: item.product.storeId
    }));

    const rawTotal = cart.reduce((acc, c) => acc + (c.product.price * c.quantity), 0);
    const calculatedTax = rawTotal * 0.12; // 12% standard corporate rate
    const finalBill = rawTotal + calculatedTax - (appliedCoupon ? (rawTotal * (appliedCoupon.discount / 100)) : 0);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          items: payloadItems,
          totalAmount: finalBill.toFixed(2),
          paymentMethod: paymentOptionSelected
        })
      });

      if (res.ok) {
        const finalReceipt = await res.json();
        alert(`Rahmat! Buyurtmangiz muvaffaqiyatli rasmiylashtirildi. Buyurtma raqami: #${finalReceipt.orderId.toUpperCase()}. ${paymentOptionSelected.toUpperCase()} orqali to'lovingiz qabul qilindi.`);
        
        // Wipe carts
        setCart([]);
        setAppliedCoupon(null);
        setCouponInput("");
        setShowPaySimulator(false);
        fetchDbData(); // sync orders
        navigate("orders");
      }
    } catch (err) {
      alert("Buyurtma rasmiylashtirishda xatolik yuz berdi. Iltimos qayta sinab ko'ring.");
    }
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlist(prev => {
      const updated = prev.includes(productId)
        ? prev.filter(p => p !== productId)
        : [...prev, productId];
      return updated;
    });
  };

  // Computed total values
  const totalCartCost = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const totalCartTax = totalCartCost * 0.12;
  const totalCartDiscount = appliedCoupon ? (totalCartCost * (appliedCoupon.discount / 100)) : 0;
  const totalCartCheckoutValue = totalCartCost + totalCartTax - totalCartDiscount;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans antialiased text-xs">
      
      {/* 1. TOP SECURE BAR FOR PUBLIC OR LOCKED PORTS */}
      <div className="bg-slate-900 border-b border-white/5 py-2 px-6 flex justify-between items-center text-[10px] text-white/50 tracking-wider uppercase">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span>SOTIB OLUVCHILAR PORTALI ONLINE</span>
        </div>
        <div className="flex gap-4 font-mono">
          <span>YETKAZIB BERISH: 24/7 BEPUL</span>
          <span>VALYUTA: USD ($)</span>
        </div>
      </div>

      {/* 2. MAIN HEADER PLATFORM */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            onClick={() => navigate("home")}
            className="text-base font-black tracking-widest text-white hover:text-cyan-400 transition cursor-pointer select-none font-sans"
          >
            AI MALL <span className="glow-text text-cyan-400 font-bold font-sans">GLOBAL</span>
          </span>
          <span className="hidden md:block bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 rounded-full px-2.5 py-0.5 text-[8px] font-black uppercase">
            UZBEKISTAN PREMIER NO.1
          </span>
        </div>

        {/* Desktop Navigation Linkages */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold font-sans text-white/70">
          <button
            onClick={() => navigate("home")}
            className={`cursor-pointer hover:text-white transition-colors uppercase ${route.path === "home" ? "text-cyan-400" : ""}`}
          >
            Bosh Sahifa
          </button>
          <button
            onClick={() => navigate("stores")}
            className={`cursor-pointer hover:text-white transition-colors uppercase ${route.path === "stores" ? "text-cyan-400" : ""}`}
          >
            Atelierlar (Do'konlar)
          </button>
          <button
            onClick={() => navigate("ai-suite")}
            className={`cursor-pointer hover:text-white transition-colors uppercase flex items-center gap-1 ${route.path === "ai-suite" ? "text-cyan-400" : ""}`}
          >
            <Bot className="w-3.5 h-3.5" />
            AI Intellekt Suite
          </button>
          <button
            onClick={() => navigate("orders")}
            className={`cursor-pointer hover:text-white transition-colors uppercase ${route.path === "orders" ? "text-cyan-400" : ""}`}
          >
            Buyurtmalarim
          </button>
        </nav>

        {/* Right tools (Cart, mobile trigger) */}
        <div className="flex items-center gap-3 relative">
          <button
            onClick={() => navigate("cart")}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white cursor-pointer transition-all relative"
            id="header-cart-btn"
          >
            <ShoppingBag className="w-4 h-4" />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-cyan-400 text-black text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center animate-bounce">
                {cart.reduce((ac, c) => ac + c.quantity, 0)}
              </span>
            )}
          </button>

          {/* User profile / login button */}
          <button
            onClick={() => navigate("profile")}
            className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center gap-1.5 font-bold ${
              route.path === "profile"
                ? "bg-cyan-500/15 border-cyan-400 text-cyan-400 font-black"
                : "bg-white/5 border-white/10 hover:bg-white/10 text-white/90"
            }`}
            id="header-profile-btn"
          >
            {currentUser ? (
              <>
                <img
                  src={currentUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=30&q=80"}
                  alt={currentUser.fullName}
                  className="w-4.5 h-4.5 rounded-full object-cover border border-cyan-400/25"
                />
                <span className="hidden lg:inline text-[10px] font-black uppercase truncate max-w-[90px]">
                  {currentUser.fullName.split(" ")[0]}
                </span>
              </>
            ) : (
              <>
                <UserIcon className="w-4 h-4 text-cyan-400" />
                <span className="hidden lg:inline text-[10px] uppercase font-black tracking-wider">Kirish</span>
              </>
            )}
          </button>

          {/* User logout / sandbox switcher */}
          {currentUser && currentUser.role !== "customer" && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-red-400/15 border border-red-500/20 text-red-400 cursor-pointer hover:bg-red-400/20 transition-all flex items-center gap-1.5 font-bold"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline text-[10px]">Chiqish</span>
            </button>
          )}

          {/* Mobile responsive hamburger menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
          </button>
        </div>
      </header>

      {/* MOBILE EXPANDED NAVIGATION */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-white/5 p-4 flex flex-col gap-4 text-xs font-bold uppercase tracking-wide">
          <button onClick={() => navigate("home")} className="text-left py-2 hover:text-cyan-400 cursor-pointer">Bosh Sahifa</button>
          <button onClick={() => navigate("stores")} className="text-left py-2 hover:text-cyan-400 cursor-pointer">Atelierlar</button>
          <button onClick={() => navigate("ai-suite")} className="text-left py-2 hover:text-cyan-400 cursor-pointer flex items-center gap-2">
            <Bot className="w-4 h-4 text-cyan-400" /> AI Intellekt Suite
          </button>
          <button onClick={() => navigate("orders")} className="text-left py-2 hover:text-cyan-400 cursor-pointer">Buyurtmalarim</button>
          <button onClick={() => navigate("profile")} className="text-left py-2 hover:text-cyan-400 cursor-pointer flex items-center gap-2 border-t border-white/5 pt-3">
            <UserIcon className="w-4 h-4 text-cyan-400" /> Profil / Akkaunt
          </button>
        </div>
      )}

      {/* 3. MAIN WORKSPACE */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
        
        {/* PUBLIC ROUTING SWITCHBOARD */}

        {route.path === "home" && (
          <BoshSahifa
            products={products}
            stores={stores}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            onViewProduct={(p) => navigate("product", p.id)}
            onAddToCart={handleAddToCart}
            onNavigateToStore={(slug) => navigate("store", slug)}
          />
        )}

        {route.path === "stores" && (
          <StoresCatalog
            stores={stores}
            onNavigateToStore={(slug) => navigate("store", slug)}
          />
        )}

        {route.path === "store" && route.param && (() => {
          const matchedStore = stores.find(s => s.slug === route.param);
          return matchedStore ? (
            <StorePage
              store={matchedStore}
              products={products}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
              onViewProduct={(p) => navigate("product", p.id)}
              onAddToCart={handleAddToCart}
              onGoBack={() => navigate("home")}
            />
          ) : (
            <p className="text-center py-12 text-white/50">Atelier ma'lumoti topilmadi.</p>
          );
        })()}

        {route.path === "product" && route.param && (() => {
          const matchedProduct = products.find(p => p.id === route.param);
          return matchedProduct ? (
            <ProductPage
              product={matchedProduct}
              stores={stores}
              wishlist={wishlist}
              onToggleWishlist={() => handleToggleWishlist(matchedProduct.id)}
              onAddToCart={() => handleAddToCart(matchedProduct)}
              onBuyNow={() => {
                handleAddToCart(matchedProduct);
                navigate("cart");
              }}
              onOpenAiSuite={() => navigate("ai-suite")}
              onNavigateToStore={(slug) => navigate("store", slug)}
              onGoBack={() => navigate("home")}
            />
          ) : (
            <p className="text-center py-12 text-white/50">Kiyim ma'lumoti topilmadi.</p>
          );
        })()}

        {route.path === "ai-suite" && (
          currentUser ? (
            <AISuite
              products={products}
              selectedProductContext={route.param ? (products.find(p => p.id === route.param) || null) : null}
              onClearContext={() => navigate("ai-suite")}
              onAddToCart={handleAddToCart}
              onViewProduct={(p) => navigate("product", p.id)}
            />
          ) : (
            <div className="max-w-2xl mx-auto my-12 glass-panel p-8 text-center space-y-6 animate-fade-in">
              <div className="inline-block p-4 rounded-3xl bg-cyan-500/15 border border-cyan-400/20 text-cyan-400">
                <Bot className="w-10 h-10 animate-bounce" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase tracking-wider text-white">AI Intellekt Suite Qulflangan 🔒</h3>
                <p className="text-xs text-white/50 max-w-md mx-auto leading-relaxed">
                  Virtual kiyim-kechak kiyib ko'rish (Virtual Try-On), tana o'lchamlarini masofaviy aniqlash va premium shaxsiy AI Stilist bilan suhbat qurish xizmati faqat ro'yxatdan o'tgan a'zolarimiz uchun bepul ruxsat qilingan.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-4">
                <button
                  onClick={() => navigate("profile")}
                  className="px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-black uppercase text-[11px] tracking-wide transition cursor-pointer"
                >
                  Profilga o'tish va Ro'yxatdan o'tish
                </button>
                <button
                  onClick={() => navigate("home")}
                  className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold uppercase text-[11px] tracking-wide transition cursor-pointer"
                >
                  Asosiy katalog
                </button>
              </div>
            </div>
          )
        )}

        {route.path === "cart" && (
          <div className="space-y-6 animate-fade-in" id="cart-workspace">
            <h2 className="text-lg font-black uppercase tracking-wider text-cyan-400">Hashamatli xarid savatingiz</h2>

            {cart.length === 0 ? (
              <div className="p-12 glass-panel text-center text-white/40 space-y-4">
                <ShoppingBag className="w-12 h-12 text-white/20 mx-auto" />
                <p>Savatingiz hozircha bo'sh. Moda katalogidan o'zingizga munosib kiyimlarni toping.</p>
                <button
                  onClick={() => navigate("home")}
                  className="glow-btn px-6 py-2 rounded-xl text-xs font-bold text-black cursor-pointer"
                >
                  Xarid qilishni boshlash
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ITEMS SECTION */}
                <div className="lg:col-span-8 space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="glass-panel p-4 flex gap-4 items-center justify-between"
                    >
                      <div className="flex gap-4 items-center min-w-0">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.title}
                          className="w-16 h-16 object-cover rounded-xl border border-white/5"
                        />
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-xs text-white truncate max-w-[200px]">{item.product.title}</h4>
                          <span className="text-[10px] text-cyan-400 block mt-1">
                            Do'kon: {stores.find(s => s.id === item.product.storeId)?.name || "Nomalum"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-950 border border-white/10 rounded-lg p-1">
                          <button
                            onClick={() => handleUpdateCartQty(item.product.id, item.quantity - 1)}
                            className="w-5 h-5 flex items-center justify-center text-white/50 hover:text-white cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-[11px] font-bold">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateCartQty(item.product.id, item.quantity + 1)}
                            className="w-5 h-5 flex items-center justify-center text-white/50 hover:text-white cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <span className="text-xs font-black text-white w-14 text-right">
                          ${(item.product.price * item.quantity).toLocaleString()}
                        </span>

                        <button
                          onClick={() => handleRemoveFromCart(item.product.id)}
                          className="text-red-400 hover:text-red-300 p-2 cursor-pointer"
                          id={`remove-item-${item.product.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* SUMMARY checkout FORM */}
                <div className="lg:col-span-4 glass-panel p-6 space-y-4 h-fit">
                  <h3 className="font-black text-xs text-white uppercase border-b border-white/5 pb-2">Jami kvitansiya hisobi</h3>
                  
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between text-white/50">
                      <span>Mahsulotlar jami:</span>
                      <span className="font-bold text-white">${totalCartCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-white/50">
                      <span>Litsenziya QQS (12%):</span>
                      <span className="font-bold text-white">${totalCartTax.toLocaleString()}</span>
                    </div>

                    {appliedCoupon ? (
                      <div className="flex justify-between text-cyan-400 font-bold">
                        <span>Chegirma ({appliedCoupon.code}):</span>
                        <span>-${totalCartDiscount.toLocaleString()}</span>
                      </div>
                    ) : (
                      <div className="pt-2">
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Promo-kodingiz..."
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value)}
                            className="flex-1 bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                          />
                          <button
                            onClick={handleCouponCheck}
                            className="px-3 bg-white/10 border border-white/10 text-white font-bold rounded-lg hover:bg-white/15 cursor-pointer text-xs"
                          >
                            Kupon kiritish
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="border-t border-white/5 pt-3 flex justify-between font-black text-xs text-cyan-300">
                      <span>To'lov jami ($):</span>
                      <span>${totalCartCheckoutValue.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => checkAuthAndRun(() => setShowPaySimulator(true), "checkout")}
                    className="w-full glow-btn font-black text-xs py-3 rounded-xl cursor-pointer mt-4"
                  >
                    Xaridni rasmiylashtirish
                  </button>
                </div>
              </div>
            )}

            {showPaySimulator && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-lg">
                  <PaymeClickSimulator
                    method="payme"
                    amount={totalCartCheckoutValue}
                    onSuccess={executePaymentCheckout}
                    onCancel={() => setShowPaySimulator(false)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {route.path === "orders" && (
          <div className="space-y-6 animate-fade-in" id="orders-summary-panel">
            <h2 className="text-lg font-black uppercase tracking-wider text-cyan-400">Buyurtmalarim jurnali</h2>

            {orders.length === 0 ? (
              <div className="p-12 glass-panel text-center text-white/40">
                Siz hozircha buyurtma amalga oshirmagansiz. Savatda kiyimlarni tasdiqlang!
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="glass-panel p-6 space-y-4"
                  >
                    <div className="flex justify-between items-center border-b border-white/5 pb-3 flex-wrap gap-2 text-xs">
                      <div>
                        <span className="font-black text-cyan-400 mr-2">BUYURTMA KOD: #{ord.id.substring(4, 12).toUpperCase()}</span>
                        <span className="text-white/40">{new Date(ord.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full uppercase tracking-wider font-extrabold text-[10px] border ${
                        ord.orderStatus === "delivered"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : ord.orderStatus === "shipped"
                          ? "bg-cyan-500/10 text-cyan-400 border-cyan-400/20"
                          : "bg-amber-400/10 text-amber-400 border-amber-400/20"
                      }`}>
                        {ord.orderStatus === "pending"
                          ? "Kutilmoqda ⏱️"
                          : ord.orderStatus === "processing"
                          ? "Kompilyatsiya qilinmoqda ⌛"
                          : ord.orderStatus === "shipped"
                          ? "Yo'lda 🚚 (Kuryer)"
                          : "Etkazilgan ✓ (Muvaffaqiyat)"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Products */}
                      <div className="space-y-2">
                        {(ord.items || []).map((item, idx) => (
                          <div key={idx} className="flex gap-3 items-center text-xs">
                            <img src={item.productImage} className="w-10 h-10 object-cover rounded-lg" />
                            <div>
                              <h5 className="font-extrabold text-white">{item.productTitle}</h5>
                              <span className="text-[10px] text-white/50">{item.quantity} dona • ${item.price} dan</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Summary details */}
                      <div className="flex flex-col justify-center items-end text-xs space-y-1">
                        <span className="text-white/40">Faktura To'langan (CLICK / PAYME):</span>
                        <span className="text-base font-black text-white">${ord.totalAmount}</span>
                        <span className="text-emerald-400 text-[10px] font-bold">✓ To'lov to'liq qabul qilindi</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. PRIVATE LOCKED ADMIN PORTAL */}
        {route.path === "admin" && (() => {
          const isOwner = currentUser && currentUser.role === "owner";
          const loggedStore = getLoggedInVendorStore();

          return isOwner ? (
            <VendorDashboard
              vendorStore={loggedStore}
              products={products}
              orders={orders}
              onFetchLatestDb={fetchDbData}
              onLogoutAdmin={handleLogout}
            />
          ) : (
            <div className="max-w-md mx-auto my-12 glass-panel p-8 space-y-6">
              <div className="text-center space-y-2">
                <Lock className="w-10 h-10 text-cyan-400 mx-auto animate-pulse" />
                <h3 className="font-black text-sm text-white uppercase">Do'kon ma'muri (Atelier) kirishi</h3>
                <p className="text-[11px] text-white/50">O'zingizga tegishli savdo do'konini boshqarish uchun ruxsat loginingizni kiriting.</p>
              </div>

              {authError && (
                <p className="p-3 bg-red-950/20 text-red-400 border border-red-500/20 rounded-lg text-center text-xs">
                  {authError}
                </p>
              )}

              <form onSubmit={(e) => handleAuthLogin(e, "owner")} className="space-y-4 text-xs">
                <div>
                  <label className="block text-white/50 mb-1">Ruxsat etilgan elektron manzil (Email)</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. vendor@aimall.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-white/50 mb-1">Maxfiy ruxsat paroli</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition-all cursor-pointer"
                >
                  Hamkor hisobiga kirish
                </button>
              </form>
            </div>
          );
        })()}

        {/* 5. PRIVATE LOCKED SUPERADMIN PORTAL */}
        {route.path === "superadmin" && (() => {
          const isAdmin = currentUser && currentUser.role === "admin";

          return isAdmin ? (
            <SuperAdminDashboard
              stores={stores}
              products={products}
              orders={orders}
              onFetchLatestDb={fetchDbData}
              onLogoutAdmin={handleLogout}
            />
          ) : (
            <div className="max-w-md mx-auto my-12 glass-panel p-8 space-y-6">
              <div className="text-center space-y-2">
                <Shield className="w-10 h-10 text-amber-500 mx-auto animate-bounce" />
                <h3 className="font-black text-sm text-white uppercase">Super Adminstrator kirishi</h3>
                <p className="text-[11px] text-white/50">Global tahrirlash huquqiga ega boshqaruv kalit kiritishingiz shart.</p>
              </div>

              {authError && (
                <p className="p-3 bg-red-950/20 text-red-400 border border-red-500/20 rounded-lg text-center text-xs font-bold">
                  {authError}
                </p>
              )}

              <form onSubmit={(e) => handleAuthLogin(e, "admin")} className="space-y-4 text-xs">
                <div>
                  <label className="block text-white/50 mb-1">Bosh ma'mur elektron manzili</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. admin@aimall.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-white/50 mb-1">Maxfiy boshqaruv paroli</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all cursor-pointer"
                >
                  Administrator hisobiga kirish
                </button>
              </form>
            </div>
          );
        })()}

        {route.path === "profile" && (
          <ProfilePage
            currentUser={currentUser}
            orders={orders}
            onLogin={(user) => {
              setCurrentUser(user);
              localStorage.setItem("ai_mall_user", JSON.stringify(user));
              setShowAuthGate(false);
              if (authGateReason === "checkout") {
                navigate("cart");
              } else {
                navigate("ai-suite");
              }
            }}
            onLogout={handleLogout}
            onNavigateHome={() => navigate("home")}
          />
        )}

      </main>

      {/* 5. PLATFORM PREMIUM FOOTER */}
      <footer className="bg-slate-950 border-t border-white/5 py-10 px-6 mt-12 text-xs text-white/40">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <span className="text-sm font-black text-white tracking-widest font-sans uppercase">
              AI MALL <span className="text-cyan-400 font-sans">GLOBAL</span>
            </span>
            <p className="text-[11px] leading-relaxed font-light">
              Marg'ilon ipaklari, Bukhara premium to'plamlari va an'anaviy o'zbek kiyim-kechaklarining dunyodagi birinchi sun'iy intellekt tomonidan tahlillanadigan premium online bozori.
            </p>
          </div>

          <div>
            <h5 className="font-extrabold text-white/80 uppercase tracking-wider mb-3 select-none">Mijozlar Portali</h5>
            <ul className="space-y-2 text-[11px]">
              <li><button onClick={() => navigate("home")} className="hover:text-white cursor-pointer transition">Bosh sahifa</button></li>
              <li><button onClick={() => navigate("stores")} className="hover:text-white cursor-pointer transition">Hamkor barcha do'konlar</button></li>
              <li><button onClick={() => navigate("ai-suite")} className="hover:text-white cursor-pointer transition flex items-center gap-1"><Sparkles className="w-3 h-3 text-cyan-400" /> AI sinov xonasi</button></li>
              <li><button onClick={() => navigate("cart")} className="hover:text-white cursor-pointer transition">Savatni nazorat qilish</button></li>
            </ul>
          </div>

          <div>
            <h5 className="font-extrabold text-white/80 uppercase tracking-wider mb-3 select-none">Xizmat ko'rsatish</h5>
            <ul className="space-y-2 text-[11px]">
              <li><span>Faqat tasdiqlangan o'zbek hunarmandlari</span></li>
              <li><span>Xavfsiz Payme & Click to'lovlari</span></li>
              <li><span>Premium tana o'lchovlarini kashf eting</span></li>
              <li><span>24 soat ichida butunlay yetkazish kafolati</span></li>
            </ul>
          </div>

          <div>
            <h5 className="font-extrabold text-white/80 uppercase tracking-wider mb-3 select-none">Ma'muriy kirish dahlizlari</h5>
            <div className="space-y-3">
              <p className="text-[10px] leading-relaxed">
                Tizim sozlari orqali litsenziyalangan hamkorlar va super administratorlar o'z ishlarini boshqarishi mumkin.
              </p>
              <div className="flex gap-2.5">
                <button
                  onClick={() => navigate("admin")}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-[10px] cursor-pointer"
                >
                  Sotuvchi kirishi (/admin)
                </button>
                <button
                  onClick={() => navigate("superadmin")}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-text text-amber-400 font-bold text-[10px] cursor-pointer"
                >
                  Super Admin (/superadmin)
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-white/5 pt-6 mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] font-mono uppercase">
          <span>© 2026 AI MALL GLOBAL CO. ALL SORTS PROTECTED BY COURIER SYSTEMS</span>
          <span>AUTHORIZED NODE: TASHKENT, UZBEKISTAN</span>
        </div>
      </footer>

      {showAuthGate && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel p-6 space-y-6 border border-cyan-500/20 shadow-2xl shadow-cyan-500/5 text-center">
            <div className="space-y-3">
              <div className="inline-block p-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-400">
                <Lock className="w-6 h-6 animate-pulse mx-auto" />
              </div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Tizimga kirish talab etiladi ⚠️</h3>
              <p className="text-[11px] text-white/50 leading-relaxed max-w-xs mx-auto">
                {authGateReason === "checkout" 
                  ? "Savatdagi hashamatli kiyimlarni sotib olish (buyurtma) uchun tizimdan ro'yxatdan o'tishingiz yoki hisobingizga kirishingiz lozim." 
                  : "Virtual kiyib ko'rish, tana o'lchamlarini moslashtirish va shaxsiy AI Stilistdan foydalanish uchun ro'yxatdan o'tishingiz lozim."}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAuthGate(false);
                  navigate("profile");
                }}
                className="flex-1 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-black text-[10px] uppercase tracking-wide transition cursor-pointer text-center"
              >
                Profil / Ro'yxatdan o'tish
              </button>
              <button
                onClick={() => setShowAuthGate(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-[10px] uppercase tracking-wide transition cursor-pointer text-center"
              >
                Orqaga qaytish
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
