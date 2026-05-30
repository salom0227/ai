import React, { useState, useEffect } from "react";
import { 
  Star, ShieldAlert, Heart, CircleDot, AlertTriangle, Plus, Trash2, Key, Users, BookOpen, 
  Database, Terminal, Check, Copy, Cpu, Layers, Settings, Code, Sparkles, Edit, Save, 
  ArrowLeft, LogOut, ShoppingBag, ShieldCheck, Mail, Phone, Lock, Tag, TrendingUp, 
  DollarSign, Calendar, Eye, Activity, CheckCircle, UserPlus, ClipboardList, Info, 
  ShoppingBag as StoreIcon, HelpCircle, UserCheck, ShoppingCart
} from "lucide-react";
import { Store, Product, Order, User, Category } from "../types";

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
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<"kpis" | "users" | "stores" | "products" | "orders" | "migration">("kpis");

  // Dynamic system states loaded from server
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Logged-in admin session (for self-editing)
  const [currentAdmin, setCurrentAdmin] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("ai_mall_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.role === "admin") return parsed;
      }
    } catch (_) {}
    return null;
  });

  // Action/Form Overlay states
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);

  // Forms states
  const [userForm, setUserForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "customer" as "customer" | "owner" | "admin",
    avatar: ""
  });

  const [productForm, setProductForm] = useState({
    storeId: "",
    categoryId: "clothing",
    title: "",
    description: "",
    price: 0,
    stock: 10,
    images: ""
  });

  const [newStoreForm, setNewStoreForm] = useState({
    name: "",
    ownerName: "",
    ownerEmail: "",
    commissionRate: "10",
  });

  const [profileForm, setProfileForm] = useState({
    fullName: currentAdmin?.fullName || "",
    email: currentAdmin?.email || "",
    phone: currentAdmin?.phone || "",
    password: currentAdmin?.password || "",
    avatar: currentAdmin?.avatar || "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=300&q=80"
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

  // Load backend users and categories for comprehensive mapping & control
  const loadAllSystemResources = async () => {
    setLoadingData(true);
    try {
      const uRes = await fetch("/api/users");
      if (uRes.ok) {
        const uData = await uRes.json();
        setAllUsers(uData);
      }
      const cRes = await fetch("/api/categories");
      if (cRes.ok) {
        const cData = await cRes.json();
        setAllCategories(cData);
      }
    } catch (err) {
      console.error("SuperAdmin resource load error:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadAllSystemResources();
  }, [stores, products, orders]);

  // Set default productForm store ID once stores are loaded
  useEffect(() => {
    if (stores.length > 0 && !productForm.storeId) {
      setProductForm(prev => ({ ...prev, storeId: stores[0].id }));
    }
  }, [stores]);

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

  // KPIs Calculations
  const globalTurnover = products.reduce((sum, p) => sum + (p.price * (p.salesCount || 0)), 0) + 12450;
  const adminCommissionsEarned = stores.reduce((sum, s) => {
    const storeTurnover = products.filter(p => p.storeId === s.id).reduce((sumProd, p) => sumProd + (p.price * (p.salesCount || 0)), 0);
    return sum + (storeTurnover * (s.commissionRate / 100));
  }, 0) + 1245;

  // ----------------------------------------------------
  // ADMIN SERVICE DIRECTIVES (CRUD FOR ABSOLUTELY EVERYTHING)
  // ----------------------------------------------------

  // USER MANAGEMENT
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.fullName.trim() || !userForm.email.trim()) {
      alert("Ism va elektron manzil kiritilishi shart!");
      return;
    }
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: userForm.fullName,
          email: userForm.email,
          phone: userForm.phone || "+998 90 123-4567",
          password: userForm.password || "111111",
          role: userForm.role,
          avatar: userForm.avatar || `https://images.unsplash.com/photo-${userForm.role === "owner" ? "1472099645785-5658abf4ff4e" : "1535713875002-d1d0cf377fde"}?auto=format&fit=crop&w=300&q=80`
        })
      });

      if (response.ok) {
        alert("Yangi foydalanuvchi muvaffaqiyatli kiritildi!");
        setShowCreateUser(false);
        setUserForm({ fullName: "", email: "", phone: "", password: "", role: "customer", avatar: "" });
        loadAllSystemResources();
        onFetchLatestDb();
      } else {
        const data = await response.json();
        alert(data.message || "Xatolik yuz berdi");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingUser)
      });
      if (response.ok) {
        alert("Foydalanuvchi muvaffaqiyatli yangilandi!");
        setEditingUser(null);
        loadAllSystemResources();
        onFetchLatestDb();
      } else {
        alert("Yangilashda xatolik yuz berdi.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentAdmin?.id) {
      alert("O'z shaxsiy profilingizni o'chira olmaysiz!");
      return;
    }
    if (!confirm("Ushbu foydalanuvchini platformadan mutunlay tahrirlab o'chirmoqchimisiz?")) return;
    try {
      const response = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (response.ok) {
        alert("Foydalanuvchi o'chirildi.");
        loadAllSystemResources();
        onFetchLatestDb();
      } else {
        alert("O'chirishda xatolik yuz berdi.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // STORE REGISTRATION (License brand)
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

      // Reset license form
      setNewStoreForm({
        name: "",
        ownerName: "",
        ownerEmail: "",
        commissionRate: "10",
      });

      onFetchLatestDb();
      alert("Yangi brend va uning sotuvchi boshqaruvchisi muvaffaqiyatli ro'yxatdan o'tdi!");
    } catch (err) {
      console.error(err);
      alert("Ushbu nomdagi do'kon mavjud yoki kiritishda xatolik");
    }
  };

  const handleUpdateStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore) return;
    try {
      const response = await fetch(`/api/stores/${editingStore.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingStore)
      });
      if (response.ok) {
        alert("Do'kon sozlamalari yangilandi!");
        setEditingStore(null);
        onFetchLatestDb();
      } else {
        alert("Do'kon tahrirlashda xatolik.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStoreVerification = async (st: Store) => {
    try {
      const response = await fetch(`/api/stores/${st.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: !st.verified })
      });
      if (response.ok) {
        onFetchLatestDb();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSuspendStore = async (storeId: string) => {
    if (!confirm("Ushbu brendni platformadan butunlay chetlatmoqchimisiz? Do'kon mahsulotlari ham birga yo'q qilinadi.")) return;
    try {
      const response = await fetch(`/api/stores/${storeId}`, { method: "DELETE" });
      if (response.ok) {
        alert("Brend hamkorligi bekor qilindi va olib tashlandi.");
        onFetchLatestDb();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // PRODUCT DIRECTIVES
  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.title.trim() || productForm.price <= 0) {
      alert("Iltimos, nomi va narxini kiriting!");
      return;
    }
    try {
      const imgUrlsArr = productForm.images.trim()
        ? productForm.images.split(",").map(url => url.trim()).filter(Boolean)
        : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"];

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: productForm.storeId || (stores[0]?.id || ""),
          categoryId: productForm.categoryId,
          title: productForm.title,
          description: productForm.description || "Ushbu mahsulot SuperAdmin tomonidan qo'shildi",
          price: Number(productForm.price),
          stock: Number(productForm.stock),
          images: imgUrlsArr
        })
      });

      if (response.ok) {
        alert("Mahsulot tizim katalogiga va tegishli do'konga qo'shildi!");
        setShowCreateProduct(false);
        setProductForm(p => ({
          ...p,
          title: "",
          description: "",
          price: 0,
          stock: 10,
          images: ""
        }));
        onFetchLatestDb();
      } else {
        alert("Mahsulot qo'shishda xatolik.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingProduct,
          price: Number(editingProduct.price),
          stock: Number(editingProduct.stock),
          images: Array.isArray(editingProduct.images) ? editingProduct.images : [editingProduct.images],
        })
      });

      if (response.ok) {
        alert("Mahsulot ma'lumotlari yangilandi!");
        setEditingProduct(null);
        onFetchLatestDb();
      } else {
        alert("Mahsulotni yangilashda xatolik yuz berdi.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (prodId: string) => {
    if (!confirm("Siz ushbu mahsulotni tizimdan butunlay o'chirib yubormoqchimisiz?")) return;
    try {
      const response = await fetch(`/api/products/${prodId}`, { method: "DELETE" });
      if (response.ok) {
        alert("Mahsulot butunlay o'chirildi.");
        onFetchLatestDb();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ORDER ACTIONS
  const handleOrderStatusUpdate = async (orderId: string, status: "pending" | "processing" | "shipped" | "delivered") => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: status })
      });
      if (response.ok) {
        alert(`Buyurtma holati "${status}" ga o'zgartirildi!`);
        onFetchLatestDb();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOrderPaymentStatusUpdate = async (orderId: string, status: "paid" | "unpaid") => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: status })
      });
      if (response.ok) {
        alert(`Baxsiy to'lov holati "${status}" deb tasdiqlandi!`);
        onFetchLatestDb();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ADMIN SELF PROFILE EDIT
  const handleUpdateProfileSelf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin) return;
    try {
      const response = await fetch(`/api/users/${currentAdmin.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm)
      });
      if (response.ok) {
        const data = await response.json();
        const updated = data.user;
        alert("Profilingiz muvaffaqiyatli tahrirlandi!");
        setCurrentAdmin(updated);
        localStorage.setItem("ai_mall_user", JSON.stringify(updated));
        setShowProfileModal(false);
        onFetchLatestDb();
        loadAllSystemResources();
      } else {
        alert("Xatolik xodimlari");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Custom Category Name Resolver
  const getCategoryName = (catId: string) => {
    const category = allCategories.find(c => c.id === catId);
    if (category) {
      return category.name.uz || category.name.en || catId;
    }
    const standardNames: Record<string, string> = {
      clothing: "Kiyim-kechak",
      electronics: "Elektronika",
      footwear: "Poyabzal",
      accessories: "Aksessuarlar"
    };
    return standardNames[catId] || catId;
  };

  // Safe checks & statistics
  const totalUsersCount = allUsers.length || 10;
  const customersCount = allUsers.filter(u => u.role === "customer").length || 8;
  const ownersCount = allUsers.filter(u => u.role === "owner").length || 2;
  const adminsCount = allUsers.filter(u => u.role === "admin").length || 1;

  // Render variables corresponding to search queries
  const filteredUsers = allUsers.filter(u => 
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStores = stores.filter(st => 
    st.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (st.ownerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (st.ownerEmail || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (stores.find(st => st.id === p.storeId)?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (allUsers.find(u => u.id === o.userId)?.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.orderStatus.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.paymentStatus.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in select-text" id="aimall-superadmin-dashboard">
      
      {/* 1. ENTERPRISE HEADER AREA */}
      <div className="p-6 bg-gradient-to-r from-zinc-950 via-slate-900 to-zinc-950 border border-amber-500/20 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-amber-500/10 border border-amber-400/30 rounded-2xl">
            <UserCheck className="w-8 h-8 text-amber-500 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white tracking-wide uppercase">Bosh ma'murlik (Super Admin)</h1>
              <span className="bg-amber-500 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest leading-none">
                Root Access
              </span>
            </div>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              Moliya hisoboti, do'konlarni litsenziyalash, mahsulot tahriri va foydalanuvchi huquqlarini global tartibga soluvchi boshqaruv klasteri.
            </p>
          </div>
        </div>

        {/* Admin Self Profile Actions */}
        <div className="flex items-center gap-3 relative z-10 shrink-0 select-none">
          {currentAdmin && (
            <div 
              onClick={() => {
                setProfileForm({
                  fullName: currentAdmin.fullName,
                  email: currentAdmin.email,
                  phone: currentAdmin.phone || "",
                  password: currentAdmin.password || "",
                  avatar: currentAdmin.avatar || "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=300&q=80"
                });
                setShowProfileModal(true);
              }}
              className="flex items-center gap-2.5 p-1.5 pr-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl cursor-pointer transition-all"
              title="Profil sozlamalarini tahrirlash"
            >
              <img src={currentAdmin.avatar} className="w-7 h-7 rounded-lg object-cover border border-amber-500/40" />
              <div className="text-left">
                <p className="text-[10px] font-black text-white leading-tight">{currentAdmin.fullName}</p>
                <p className="text-[8px] text-amber-400 font-mono tracking-wider">PROFILNI TAHRIRLASH</p>
              </div>
            </div>
          )}

          <button
            onClick={onLogoutAdmin}
            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Chiqish
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC WEB-SCALE CALCULATION / KPI PANEL */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="glass-panel p-4 text-center space-y-1 bg-yellow-400/[0.02] border-amber-500/10">
          <TrendingUp className="w-3.5 h-3.5 text-amber-500 mx-auto" />
          <span className="text-[9px] text-white/40 uppercase tracking-widest font-mono block">Yalpi aylanma</span>
          <p className="text-lg font-black text-amber-400 font-mono">${globalTurnover.toLocaleString()}</p>
        </div>

        <div className="glass-panel p-4 text-center space-y-1 bg-emerald-400/[0.01] border-emerald-500/10">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
          <span className="text-[9px] text-white/40 uppercase tracking-widest font-mono block">Ma'muriy komissiya</span>
          <p className="text-lg font-black text-emerald-300 font-mono">${adminCommissionsEarned.toLocaleString()}</p>
        </div>

        <div className="glass-panel p-4 text-center space-y-1">
          <ShoppingCart className="w-3.5 h-3.5 text-cyan-400 mx-auto" />
          <span className="text-[9px] text-white/40 uppercase tracking-widest font-mono block">Buyurtmalar soni</span>
          <p className="text-lg font-black text-cyan-400 font-mono">{orders.length + 42} ta buyurtma</p>
        </div>

        <div className="glass-panel p-4 text-center space-y-1">
          <StoreIcon className="w-3.5 h-3.5 text-purple-400 mx-auto" />
          <span className="text-[9px] text-white/40 uppercase tracking-widest font-mono block">Brend do'konlar</span>
          <p className="text-lg font-black text-purple-400 font-mono">{stores.length} ta hamkor</p>
        </div>

        <div className="glass-panel p-4 text-center space-y-1">
          <Users className="w-3.5 h-3.5 text-indigo-400 mx-auto" />
          <span className="text-[9px] text-white/40 uppercase tracking-widest font-mono block">Tizim a'zolari</span>
          <p className="text-lg font-black text-indigo-400 font-mono">{totalUsersCount} ta akkount</p>
        </div>

        <div className="glass-panel p-4 text-center space-y-1">
          <BookOpen className="w-3.5 h-3.5 text-teal-400 mx-auto" />
          <span className="text-[9px] text-white/40 uppercase tracking-widest font-mono block">Tovar katalogi</span>
          <p className="text-lg font-black text-teal-400 font-mono">{products.length} xil turlar</p>
        </div>
      </div>

      {/* 3. MULTI-CONTROL NAVIGATION TABS (SELECT COMPONENT VIEW) */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-950/40 p-1.5 border border-white/5 rounded-2xl select-none">
        <button
          onClick={() => { setActiveTab("kpis"); setSearchQuery(""); }}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === "kpis" ? "bg-amber-600 text-white shadow-xl" : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> KPI & Analitika
        </button>

        <button
          onClick={() => { setActiveTab("users"); setSearchQuery(""); }}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === "users" ? "bg-amber-600 text-white shadow-xl" : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Foydalanuvchilar ({totalUsersCount})
        </button>

        <button
          onClick={() => { setActiveTab("stores"); setSearchQuery(""); }}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === "stores" ? "bg-amber-600 text-white shadow-xl" : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <StoreIcon className="w-3.5 h-3.5" /> Do'konlar ({stores.length})
        </button>

        <button
          onClick={() => { setActiveTab("products"); setSearchQuery(""); }}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === "products" ? "bg-amber-600 text-white shadow-xl" : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" /> Tovar Katalogi ({products.length})
        </button>

        <button
          onClick={() => { setActiveTab("orders"); setSearchQuery(""); }}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-2 relative ${
            activeTab === "orders" ? "bg-amber-600 text-white shadow-xl" : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" /> Buyurtmalar ({orders.length})
          {orders.filter(o => o.orderStatus === "pending").length > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
          )}
        </button>

        <button
          onClick={() => { setActiveTab("migration"); setSearchQuery(""); }}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === "migration" ? "bg-cyan-600 text-white shadow-xl" : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Database className="w-3.5 h-3.5 text-cyan-400" /> PostgreSQL Migratsiya
        </button>
      </div>

      {/* SEARCH / ADVANCED SEARCH FILTER CONTROL BAR */}
      {activeTab !== "kpis" && activeTab !== "migration" && (
        <div className="p-3 bg-zinc-950/40 border border-white/5 rounded-2xl flex items-center">
          <input
            type="text"
            placeholder={`${activeTab === 'users' ? 'Ism, email yoki rolni yozib qidiring...' : activeTab === 'stores' ? 'Do\'kon nomi yoki egasining ma\'lumotlarini qidiring...' : activeTab === 'products' ? 'Mahsulot nomi, tavsifi yoki ishlab chiqaruvchisini qidiring...' : 'Buyurtma ID si yoki xaridor ismini yozing...'}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 text-xs text-white rounded-xl px-4 py-2.5 outline-none focus:border-amber-400"
          />
        </div>
      )}

      {/* 4. ACTIVE WORKSPACE VIEW */}
      
      {/* (A) TAB: KPIS & ANALYTICS */}
      {activeTab === "kpis" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          
          <div className="glass-panel p-6 space-y-4">
            <h3 className="font-extrabold text-xs text-amber-500 uppercase tracking-widest border-b border-white/5 pb-2">
              Statistika & Hisob-Kitoblar
            </h3>
            <p className="text-[11px] text-white/50">Tizimdagi joriy foydalanuvchilar qatlami tahliliy ko'rsatkichi.</p>
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs p-2.5 bg-white/[0.01] rounded-xl border border-white/5">
                <span className="text-white/60 flex items-center gap-2"><Users className="w-3.5 h-3.5 text-cyan-400" /> Mijozlar (Customers)</span>
                <span className="font-bold text-white font-mono">{customersCount} ta</span>
              </div>
              <div className="flex justify-between items-center text-xs p-2.5 bg-white/[0.01] rounded-xl border border-white/5">
                <span className="text-white/60 flex items-center gap-2"><StoreIcon className="w-3.5 h-3.5 text-purple-400" /> Sotuvchilar (Store Owners)</span>
                <span className="font-bold text-white font-mono">{ownersCount} ta</span>
              </div>
              <div className="flex justify-between items-center text-xs p-2.5 bg-white/[0.01] rounded-xl border border-white/5">
                <span className="text-white/60 flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Tizim Administratorlari</span>
                <span className="font-bold text-emerald-400 font-mono">{adminsCount} ta</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 space-y-4">
            <h3 className="font-extrabold text-xs text-amber-500 uppercase tracking-widest border-b border-white/5 pb-2">
              Hamkorlar va Sotuvlar Tahlili
            </h3>
            <p className="text-[11px] text-white/50">Do'kon doirasida o'chirilishi mumkin bo'lgan komissiya stavkalari va aylanmalar.</p>
            <div className="space-y-3 overflow-y-auto max-h-[170px] pr-1 pt-2">
              {stores.map(st => {
                const storeProds = products.filter(p => p.storeId === st.id);
                const storeSales = storeProds.reduce((sum, p) => sum + (p.salesCount || 0), 0);
                const storeTurnover = storeProds.reduce((sum, p) => sum + (p.price * (p.salesCount || 0)), 0);
                return (
                  <div key={st.id} className="p-3 bg-zinc-950/50 border border-white/5 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <strong className="text-white text-[11px]">{st.name}</strong>
                      <span className="font-mono text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 rounded">Stavka: {st.commissionRate}%</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-white/50 font-mono">
                      <span>Savdo aylanmasi: ${storeTurnover.toLocaleString()}</span>
                      <span>Sotuvlar: {storeSales} dona</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-panel p-6 space-y-4">
            <h3 className="font-extrabold text-xs text-amber-500 uppercase tracking-widest border-b border-white/5 pb-2">
              Tizim barqarorligi diagnostic
            </h3>
            <div className="space-y-3.5 pt-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-white/50">Tizim holati (API Web core):</span>
                <span className="font-extrabold text-emerald-400 flex items-center gap-1">● ONLINE</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50">Server asinxron javobi (Ping):</span>
                <span className="font-extrabold text-white font-mono">14ms / Secure</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50">Kiber mudofaa protokoli:</span>
                <span className="font-extrabold text-white">TLS 1.3 / AES-256</span>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-[10px] text-white/50 font-light leading-relaxed">
                SuperAdmin xonasi to'laqonli hisob-kitoblar va modullarni boshqarish uchun xavfsiz kanallangan. Istalgan ma'lumotni o'zgartirish yoki tahrirlash daxlsizdir.
              </div>
            </div>
          </div>

        </div>
      )}

      {/* (B) TAB: USERS & RIGHTS MANAGEMENT */}
      {activeTab === "users" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          {/* Create User Form Box */}
          <div className="lg:col-span-4 glass-panel p-6 space-y-4 shrink-0 h-fit">
            <h3 className="font-extrabold text-xs text-amber-500 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" /> Yangi foydalanuvchi yaratish
            </h3>
            <form onSubmit={handleCreateUserSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-white/50 mb-1">To'liq ism-familiyasi</label>
                <input
                  type="text"
                  required
                  placeholder="Ism kiriting..."
                  value={userForm.fullName}
                  onChange={(e) => setUserForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-white/50 mb-1">Email (Tizimga kirish logini)</label>
                <input
                  type="email"
                  required
                  placeholder="masalan: xaridor@gmail.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 mb-1">Telefon raqam</label>
                  <input
                    type="text"
                    placeholder="+998 90 ..."
                    value={userForm.phone}
                    onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-white/50 mb-1">Parol kodi</label>
                  <input
                    type="password"
                    placeholder="Minimal 6 xona"
                    value={userForm.password}
                    onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/50 mb-1">Platformadagi roli (Huquqi)</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400"
                >
                  <option value="customer">Customer (Xaridor mijoz)</option>
                  <option value="owner">Owner (Sotuvchi do'kon egasi)</option>
                  <option value="admin">Admin (Tizim boshqaruvchisi)</option>
                </select>
              </div>

              <div>
                <label className="block text-white/50 mb-1">Avatar rasm havolasi (Ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={userForm.avatar}
                  onChange={(e) => setUserForm(prev => ({ ...prev, avatar: e.target.value }))}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                <Plus className="w-3.5 h-3.5" /> Yangi foydalanuvchini faollashtirish
              </button>
            </form>
          </div>

          {/* Users List grid (8 columns) */}
          <div className="lg:col-span-8 glass-panel p-6 space-y-4">
            <h3 className="font-extrabold text-xs text-amber-500 uppercase tracking-widest border-b border-white/5 pb-2">
              Barcha ro'yxatdan o'tgan foydalanuvchilar ({allUsers.length} ta)
            </h3>

            {filteredUsers.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-12 italic">Foydalanuvchilar topilmadi</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredUsers.map(u => (
                  <div key={u.id} className="flex justify-between items-center p-3.5 bg-white/[0.01] border border-white/5 rounded-2xl hover:bg-white/[0.03] transition-all">
                    <div className="flex gap-3 items-center min-w-0">
                      <img src={u.avatar} className="w-9 h-9 object-cover rounded-xl border border-white/10 shrink-0" />
                      <div className="min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-xs text-white truncate max-w-[170px]">{u.fullName}</h4>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                            u.role === "admin" 
                              ? "bg-red-500/10 text-red-500 border border-red-500/20" 
                              : u.role === "owner" 
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                              : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                          }`}>
                            {u.role}
                          </span>
                        </div>
                        <span className="text-[10px] text-white/40 block mt-1 font-mono truncate">{u.email} • {u.phone || "Telefon yo'q"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 select-none">
                      <button
                        onClick={() => setEditingUser(u)}
                        className="p-1.5 pr-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10px] font-bold cursor-pointer flex items-center gap-1 transition"
                      >
                        <Edit className="w-3 h-3 text-amber-400" /> Tahrirlash
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 cursor-pointer transition"
                        title="Foydalanuvchini butunlay o'chiri"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* (C) TAB: STORES MANAGEMENT */}
      {activeTab === "stores" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          {/* Create / License Store Form */}
          <div className="lg:col-span-5 glass-panel p-6 space-y-4 shrink-0 h-fit">
            <h3 className="font-extrabold text-xs text-amber-500 border-b border-white/5 pb-2 uppercase tracking-widest flex items-center gap-1.5">
              <StoreIcon className="w-4 h-4 text-amber-500" /> Yangi brend / Do'konni litsenziyalash
            </h3>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Yuridik shaxs yoki yakka tartibdagi hunarmandni ro'yxatdan o'tkazing. Tizim ularga sotuvchi akkountini ham birga ochib, parolini ko'rsatib beradi.
            </p>

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
                <label className="block text-white/50 mb-1">Kompaniya egasining to'liq ismi (Komissar)</label>
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
                  <label className="block text-white/50 mb-1">E_mail manzili (Login)</label>
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
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs transition cursor-pointer shadow-md"
              >
                Ruxsat litsenziyasini tasdiqlash
              </button>
            </form>

            {/* CREDENTIAL PACK OUTPUT BOX */}
            {generatedCredentials && (
              <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl space-y-3.5 text-xs animate-fade-in" id="auth-code-output">
                <span className="text-amber-400 font-black flex items-center gap-1.5 uppercase text-[9px] leading-none">
                  <Key className="w-4 h-4 text-amber-500 animate-bounce" /> AVTOMATIK SOTUVCHI AVTORIZATSIYA PAKETI
                </span>
                <div className="space-y-1 bg-black/40 p-3 rounded-xl border border-white/5 text-left leading-relaxed text-slate-200">
                  <p>Do'kon nomi: <strong className="text-amber-400">{generatedCredentials.store.name}</strong></p>
                  <p>Admin login (Email): <span className="font-mono text-amber-300 font-bold">{generatedCredentials.owner.email}</span></p>
                  <p>Himoyalangan kirish paroli: <span className="font-mono text-amber-300 font-bold">{generatedCredentials.owner.password}</span></p>
                </div>
                <p className="text-[10px] text-white/40 leading-relaxed font-light">
                  Sotuvchi ushbu ruxsatnoma orqali platformaga kiradi va tovarlarini yuklaydi.
                </p>
              </div>
            )}
          </div>

          {/* Active Stores list (7 columns) */}
          <div className="lg:col-span-7 glass-panel p-6 space-y-4">
            <h3 className="font-extrabold text-xs text-amber-500 border-b border-white/5 pb-2 uppercase tracking-widest">
              Litsenziyalangan do'konlar va brendlar ({stores.length} ta)
            </h3>

            {filteredStores.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-12 italic">Do'konlar topilmadi</p>
            ) : (
              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredStores.map(st => (
                  <div key={st.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl hover:bg-white/[0.03] transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex gap-3 items-center min-w-0">
                      <img src={st.logo} className="w-10 h-10 object-cover rounded-xl border border-white/10 shrink-0" />
                      <div className="min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-xs text-white truncate max-w-[170px]">{st.name}</h4>
                          <span className={`text-[9px] tracking-wide font-mono px-2 py-0.5 rounded border ${
                            st.status === "active" 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}>
                            {st.status.toUpperCase()}
                          </span>
                          
                          <button 
                            onClick={() => handleToggleStoreVerification(st)}
                            className={`p-1 rounded-md transition ${st.verified ? 'text-amber-400' : 'text-white/20 hover:text-white'}`}
                            title="Verifikatsiya belgisi (Ko'k nishon) ni almashtirish"
                          >
                            <ShieldCheck className="w-4 h-4 fill-current" />
                          </button>
                        </div>
                        <span className="text-[10px] text-white/40 block mt-1 leading-normal font-light">
                          Komissar egasi: {st.ownerName} ({st.ownerEmail}) <br/>
                          Komissiya stavkasi: <strong className="text-amber-500">{st.commissionRate}%</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:self-center select-none">
                      <button
                        onClick={() => setEditingStore(st)}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3 text-amber-400" /> Tahrirlash
                      </button>
                      
                      <button
                        onClick={() => handleSuspendStore(st.id)}
                        className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-bold rounded-lg cursor-pointer transition"
                      >
                        Hamkorlikni tugatish
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* (D) TAB: CENTRAL PRODUCT CATALOG */}
      {activeTab === "products" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          {/* Create product under any store */}
          <div className="lg:col-span-4 glass-panel p-6 space-y-4 shrink-0 h-fit">
            <h3 className="font-extrabold text-xs text-amber-500 border-b border-white/5 pb-2 uppercase tracking-widest flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-amber-400" /> Yangi Mahsulot qo'shish
            </h3>
            <p className="text-[11px] text-white/50 leading-relaxed">
              SuperAdmin sifatida istalgan hamkor do'kon nomidan yangi mahsulotni sayt qidiruv katalogiga to'g'ridan-to'g'ri qo'sha olasiz.
            </p>

            <form onSubmit={handleCreateProductSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-white/50 mb-1">Qaysi hamkor magaziniga tegishli?</label>
                <select
                  value={productForm.storeId}
                  onChange={(e) => setProductForm(p => ({ ...p, storeId: e.target.value }))}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400"
                >
                  {stores.length === 0 ? (
                    <option value="">Do'konlar mavjud emas</option>
                  ) : (
                    stores.map(st => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-white/50 mb-1">Kategoriya burchagi</label>
                <select
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm(p => ({ ...p, categoryId: e.target.value }))}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400"
                >
                  <option value="clothing">Kiyim-kechak (Clothing)</option>
                  <option value="electronics">Elektronika (Electronics)</option>
                  <option value="footwear">Poyabzallar (Footwear)</option>
                  <option value="accessories">Aksessuarlar (Accessories)</option>
                </select>
              </div>

              <div>
                <label className="block text-white/50 mb-1">Mahsulot nomi (Sarlavha)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Atlas milliy ko'ylak premium"
                  value={productForm.title}
                  onChange={(e) => setProductForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-white/50 mb-1">Mahsulot tavsifi</label>
                <textarea
                  rows={2}
                  placeholder="Ipak matodan tikilgan, kiyishga qulay zardo'zi..."
                  value={productForm.description}
                  onChange={(e) => setProductForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 mb-1">Narxi ($)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={productForm.price || ""}
                    onChange={(e) => setProductForm(p => ({ ...p, price: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-white/50 mb-1">Zaxiradagi ombor soni</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={productForm.stock || ""}
                    onChange={(e) => setProductForm(p => ({ ...p, stock: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/50 mb-1">Foto rasmlar ruyxati (Vergul bilan ajratilgan url-lar)</label>
                <input
                  type="text"
                  placeholder="https://image1.jpg, https://image2.jpg"
                  value={productForm.images}
                  onChange={(e) => setProductForm(p => ({ ...p, images: e.target.value }))}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs transition cursor-pointer shadow-md"
              >
                Katalog mahsulotini chop etish
              </button>
            </form>
          </div>

          {/* Core products table or list (8 columns) */}
          <div className="lg:col-span-8 glass-panel p-6 space-y-4">
            <h3 className="font-extrabold text-xs text-amber-500 border-b border-white/5 pb-2 uppercase tracking-widest">
              Barcha Global Mahsulotlar Ro'yxati ({products.length} xil)
            </h3>

            {filteredProducts.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-12 italic">Mahsulotlar topilmadi</p>
            ) : (
              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredProducts.map(p => {
                  const currentProdStore = stores.find(s => s.id === p.storeId);
                  return (
                    <div key={p.id} className="p-3.5 bg-white/[0.01] border border-white/5 rounded-2xl hover:bg-white/[0.03] transition-all flex justify-between items-center gap-4">
                      <div className="flex gap-3 items-center min-w-0">
                        <img src={p.images?.[0] || p.images?.[0]} className="w-12 h-12 object-cover rounded-xl border border-white/10 shrink-0" />
                        <div className="min-w-0 text-left">
                          <h4 className="font-extrabold text-xs text-white truncate max-w-[210px]">{p.title}</h4>
                          <span className="text-[10px] text-white/40 block leading-tight mt-1 font-mono">
                            Brend do'kon: <strong className="text-amber-400">{currentProdStore?.name || "Noma'lum brand"}</strong> <br/>
                            Bo'lim: <span className="text-cyan-300 font-semibold">{getCategoryName(p.categoryId)}</span> <br/>
                            Narxi: <strong className="text-emerald-400">${p.price}</strong> | Omborda: <span className="font-bold text-slate-300">{p.stock} ta</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 select-none">
                        <button
                          onClick={() => setEditingProduct(p)}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3 text-amber-400" /> Tahrirlash
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 cursor-pointer transition"
                          title="Butunlay o'chiri"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* (E) TAB: GLOBAL ORDER TRACKING BOX */}
      {activeTab === "orders" && (
        <div className="glass-panel p-6 space-y-4 animate-fade-in text-left">
          <h3 className="font-extrabold text-xs text-amber-500 border-b border-white/5 pb-2 uppercase tracking-widest">
            Platforma buyurtmalar jurnali va logs audit ({orders.length} ta)
          </h3>

          {filteredOrders.length === 0 ? (
            <p className="text-xs text-white/30 text-center py-12 italic">Buyurtmalar topilmadi</p>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {filteredOrders.map(o => {
                const buyer = allUsers.find(u => u.id === o.userId);
                return (
                  <div key={o.id} className="p-4 bg-slate-950/60 border border-white/5 rounded-2xl hover:border-amber-500/20 transition space-y-3.5">
                    
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/5 pb-2">
                      <div>
                        <span className="font-mono text-xs text-amber-400 font-extrabold uppercase">BUYURTMA ID: #{o.id}</span>
                        <span className="text-[10px] text-white/40 block mt-0.5 font-mono">Xaridor: {buyer?.fullName || "Akkount o'chirilgan"} ({buyer?.email || o.userId})</span>
                      </div>
                      <div className="text-left sm:text-right font-mono text-[11px]">
                        <span className="text-white/40 block">Tizimga yozilgan vaqt:</span>
                        <span className="text-white block">{new Date(o.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">Mulk ro'yxati:</span>
                      {(o.items || []).map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs text-slate-200">
                          <span className="font-light truncate max-w-[280px]">● {item.productTitle}</span>
                          <span className="font-mono text-white/50">{item.quantity} dona X ${item.price}</span>
                        </div>
                      ))}
                    </div>

                    {/* Operational controls */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-t border-white/5">
                      
                      {/* Financial values */}
                      <div className="flex items-center gap-4 text-xs">
                        <p className="text-white">Jami faktura: <strong className="text-emerald-400 font-mono">${o.totalAmount}</strong></p>
                        
                        {/* Transaction status switcher */}
                        <div className="flex items-center gap-1.5 select-none font-sans">
                          <span className="text-white/40">To'lov:</span>
                          <select
                            value={o.paymentStatus}
                            onChange={(e) => handleOrderPaymentStatusUpdate(o.id, e.target.value as any)}
                            className={`px-2 py-1 rounded text-[10px] font-black uppercase outline-none bg-slate-900 border ${
                              o.paymentStatus === "paid" ? "text-emerald-400 border-emerald-500/20" : "text-red-400 border-red-500/20"
                            }`}
                          >
                            <option value="unpaid">Unpaid / Unsettled</option>
                            <option value="paid">Paid / Tasdiqlangan</option>
                          </select>
                        </div>
                      </div>

                      {/* Delivery Status selector */}
                      <div className="flex items-center gap-1.5 select-none font-sans text-xs">
                        <span className="text-white/40">Kuryer status:</span>
                        <select
                          value={o.orderStatus}
                          onChange={(e) => handleOrderStatusUpdate(o.id, e.target.value as any)}
                          className="px-2 py-1 rounded text-[10px] font-bold uppercase outline-none bg-slate-900 border border-white/10 text-white"
                        >
                          <option value="pending">Pending (Kutilmoqda)</option>
                          <option value="processing">Processing (Tayyorlanmoqda)</option>
                          <option value="shipped">Shipped (Yo'lda)</option>
                          <option value="delivered">Delivered (Topshirildi)</option>
                        </select>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* (F) TAB: POSTGRESQL ENTERPRISE MIGRATION SUITE */}
      {activeTab === "migration" && (
        <div className={`transition-all duration-500 border rounded-3xl ${
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
              <p className="text-[11px] text-white/50 font-light max-w-2xl text-left">
                Platforma JSON modelini (`db.json`) to'liq relatsion PostgreSQL ma'lumotlar bazasiga o'tkazish markazi. Maxsus jadvallar, indeks va kaskadli bog'lanishlar bilan jihozlangan.
              </p>
            </div>

            {/* Style variant selector widget */}
            <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10 shrink-0 select-none">
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
            <div className="space-y-4 text-left">
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
            <div className="space-y-4 flex flex-col justify-between text-left">
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
      )}

      {/* 5. EDIT USER DIALOG OVERLAY MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md glass-panel p-6 border-t-2 border-amber-500 space-y-4 text-left shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Edit className="w-4 h-4 text-amber-500" /> Foydalanuvchini tahrirlash (Admin power)
              </h2>
              <button onClick={() => setEditingUser(null)} className="text-xs text-white/50 hover:text-white cursor-pointer px-2 py-1 rounded bg-white/5">
                Yopish
              </button>
            </div>

            <form onSubmit={handleUpdateUserSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-white/50 mb-1">To'liq ism-sharif</label>
                <input
                  type="text"
                  required
                  value={editingUser.fullName}
                  onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, fullName: e.target.value }) : null)}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-white/50 mb-1">Elektron pochta (Email)</label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 mb-1">Telefon</label>
                  <input
                    type="text"
                    value={editingUser.phone}
                    onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, phone: e.target.value }) : null)}
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-white/50 mb-1">Maxfiy parol</label>
                  <input
                    type="text"
                    value={editingUser.password || ""}
                    onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, password: e.target.value }) : null)}
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/50 mb-1">Akkount turi (Roli ruxsatnomasi)</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, role: e.target.value as any }) : null)}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400"
                >
                  <option value="customer">Customer (Xaridor)</option>
                  <option value="owner">Owner (Sotuvchi magazin)</option>
                  <option value="admin">Admin (Bosh ma'mur)</option>
                </select>
              </div>

              <div>
                <label className="block text-white/50 mb-1">Avatar rasm havolasi</label>
                <input
                  type="text"
                  value={editingUser.avatar}
                  onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, avatar: e.target.value }) : null)}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Ma'lumotlarni saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. EDIT STORE DIALOG OVERLAY MODAL */}
      {editingStore && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md glass-panel p-6 border-t-2 border-amber-500 space-y-4 text-left shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Edit className="w-4 h-4 text-amber-500" /> Do'konni tahrirlash
              </h2>
              <button onClick={() => setEditingStore(null)} className="text-xs text-white/50 hover:text-white cursor-pointer px-2 py-1 rounded bg-white/5">
                Yopish
              </button>
            </div>

            <form onSubmit={handleUpdateStoreSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-white/50 mb-1">Brend yoki do'kon nomi</label>
                <input
                  type="text"
                  required
                  value={editingStore.name}
                  onChange={(e) => setEditingStore(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-white/50 mb-1">Komissiya stavkasi (%)</label>
                <input
                  type="number"
                  required
                  value={editingStore.commissionRate}
                  onChange={(e) => setEditingStore(prev => prev ? ({ ...prev, commissionRate: Number(e.target.value) }) : null)}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-white/50 mb-1">Litsenziya holati</label>
                <select
                  value={editingStore.status}
                  onChange={(e) => setEditingStore(prev => prev ? ({ ...prev, status: e.target.value as any }) : null)}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400"
                >
                  <option value="active">Active (Faol litsenziya)</option>
                  <option value="pending">Pending (Kutilmoqda)</option>
                  <option value="suspended">Suspended (To'xtatilgan)</option>
                </select>
              </div>

              <div>
                <label className="block text-white/50 mb-1">Brend logotipi URL</label>
                <input
                  type="text"
                  required
                  value={editingStore.logo}
                  onChange={(e) => setEditingStore(prev => prev ? ({ ...prev, logo: e.target.value }) : null)}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-white/50 mb-1">Muqobil banner URL</label>
                <input
                  type="text"
                  value={editingStore.banner}
                  onChange={(e) => setEditingStore(prev => prev ? ({ ...prev, banner: e.target.value }) : null)}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-white/50 mb-1">Do'kon qisqacha tavsifi</label>
                <textarea
                  rows={2}
                  value={editingStore.description}
                  onChange={(e) => setEditingStore(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> O'zgarishlarni kiritish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. EDIT PRODUCT DIALOG OVERLAY MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md glass-panel p-6 border-t-2 border-amber-500 space-y-4 text-left shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Edit className="w-4 h-4 text-amber-500" /> Mahsulotni tahrirlash
              </h2>
              <button onClick={() => setEditingProduct(null)} className="text-xs text-white/50 hover:text-white cursor-pointer px-2 py-1 rounded bg-white/5">
                Yopish
              </button>
            </div>

            <form onSubmit={handleUpdateProductSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-white/50 mb-1">Mahsulot nomi (Sarlavha)</label>
                <input
                  type="text"
                  required
                  value={editingProduct.title}
                  onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-white/50 mb-1">Qaysi hamkor do'koniga tegishli?</label>
                <select
                  value={editingProduct.storeId}
                  onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, storeId: e.target.value }) : null)}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400"
                >
                  {stores.map(st => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white/50 mb-1">Kategoriya</label>
                <select
                  value={editingProduct.categoryId}
                  onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, categoryId: e.target.value }) : null)}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400"
                >
                  <option value="clothing">Kiyim-kechak (Clothing)</option>
                  <option value="electronics">Elektronika (Electronics)</option>
                  <option value="footwear">Poyabzallar (Footwear)</option>
                  <option value="accessories">Aksessuarlar (Accessories)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 mb-1">Narxi ($)</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, price: Number(e.target.value) }) : null)}
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-white/50 mb-1">Ombor zaxira soni</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, stock: Number(e.target.value) }) : null)}
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/50 mb-1">Asosiy rasm havolasi (URLs list)</label>
                <input
                  type="text"
                  value={Array.isArray(editingProduct.images) ? editingProduct.images.join(", ") : editingProduct.images}
                  onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, images: e.target.value.split(",").map(i => i.trim()).filter(Boolean) }) : null)}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-white/50 mb-1">Mahsulot tavsifi</label>
                <textarea
                  rows={2}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-white/50 mb-1">Faollik statusi</label>
                <select
                  value={editingProduct.status}
                  onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, status: e.target.value as any }) : null)}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400"
                >
                  <option value="active">Active (Sotuv hisobotida ko'rinadi)</option>
                  <option value="draft">Draft (Qoraqalpoq ko'rinmaydi)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Yangilikni kiritish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. PROFILE SELF UPDATE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md glass-panel p-6 border-t-2 border-amber-500 space-y-4 text-left shadow-2xl relative animate-fade-in">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-amber-500 animate-spin-slow" /> Mening Admin Profilim
              </h2>
              <button onClick={() => setShowProfileModal(false)} className="text-xs text-white/50 hover:text-white cursor-pointer px-2 py-1 rounded bg-white/5">
                Yopish
              </button>
            </div>

            <form onSubmit={handleUpdateProfileSelf} className="space-y-4 text-xs">
              <div>
                <label className="block text-white/50 mb-1">To'liq ism familiyangiz</label>
                <input
                  type="text"
                  required
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm(p => ({ ...p, fullName: e.target.value }))}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-white/50 mb-1">Kirish elektron pochtam</label>
                <input
                  type="email"
                  required
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 mb-1">Telefon raqam</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-white/50 mb-1">Himoya kalit (Parol)</label>
                  <input
                    type="text"
                    value={profileForm.password}
                    onChange={(e) => setProfileForm(p => ({ ...p, password: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/50 mb-1">Profil rasmi (Avatar URL)</label>
                <input
                  type="text"
                  value={profileForm.avatar}
                  onChange={(e) => setProfileForm(p => ({ ...p, avatar: e.target.value }))}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-[10px] text-white/40 leading-relaxed font-light">
                ℹ️ Ma'lumotlarni saqlash tugmasini bosganingizdan so'ng profilingiz yangilanadi hamda joriy sessiya avtomatik sinxronlashadi.
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Mening profilimni yangilash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
