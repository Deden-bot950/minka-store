import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Store, 
  Settings as SettingsIcon, 
  Plus, 
  Trash2, 
  Menu, 
  X,
  ShoppingCart,
  Send,
  LogIn,
  LogOut,
  ChevronRight,
  CheckCircle2,
  Download,
  Printer,
  FileText,
  Package,
  Edit,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  getDocs,
  limit
} from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { db, auth } from './lib/firebase';
import type { Product, Setting, CartItem, Order } from './types';

// Add type for Midtrans Snap
declare global {
  interface Window {
    snap: any;
  }
}
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Navbar = ({ cartCount, onOpenCart, isAdmin }: { cartCount: number, onOpenCart: () => void, isAdmin: boolean }) => (
  <nav className="sticky top-0 z-40 bg-brand-bg/80 backdrop-blur-md border-b border-neutral-100 px-4 md:px-8 py-4 flex justify-between items-center">
    <Link to="/" className="flex items-center gap-2 font-bold text-2xl tracking-tighter text-primary serif italic">
      <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center">
        <Store size={18} />
      </div>
      <span>Minka</span>
    </Link>
    
    <div className="flex items-center gap-4">
      {isAdmin && (
        <Link to="/admin" className="text-neutral-600 hover:text-primary transition-colors flex items-center gap-1 text-sm font-medium">
          <SettingsIcon size={18} />
          <span className="hidden sm:inline">Kelola Toko</span>
        </Link>
      )}
      <button 
        onClick={onOpenCart}
        className="relative p-2 bg-neutral-100 hover:bg-neutral-200 rounded-full transition-all active:scale-95"
      >
        <ShoppingCart size={22} className="text-neutral-700" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
            {cartCount}
          </span>
        )}
      </button>
    </div>
  </nav>
);

const OrderReceipt = ({ order, onClose }: { order: any, onClose: () => void }) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-[101] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Success Header */}
        <div className="bg-green-500 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-black">Pesanan Berhasil!</h2>
          <p className="opacity-90 text-sm">Silakan simpan bukti reservasi/pesanan ini.</p>
        </div>

        {/* Invoice Body */}
        <div className="p-8 overflow-y-auto space-y-6">
          <div className="flex justify-between items-start border-b border-dashed pb-4">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Order ID</p>
              <p className="font-mono font-bold text-neutral-800">#{order.orderId}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Tanggal</p>
              <p className="text-xs font-bold text-neutral-800">{order.date}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Ditujukan Untuk</p>
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                <p className="font-bold text-neutral-800">{order.shippingInfo.name}</p>
                <p className="text-xs text-neutral-500">{order.shippingInfo.phone}</p>
                <p className="text-xs text-neutral-500 mt-1">{order.shippingInfo.address}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Rincian Produk</p>
              <div className="space-y-2">
                {order.items.map((item: any) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-neutral-600">{item.product.name} <span className="text-neutral-300">x{item.quantity}</span></span>
                    <span className="font-bold">Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-dashed">
            <div className="flex justify-between items-center bg-neutral-900 text-white p-4 rounded-2xl">
              <span className="text-sm font-medium opacity-70">Total Pembayaran</span>
              <span className="text-xl font-black">Rp {order.total.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
            <div className="p-2 bg-blue-500 text-white rounded-xl h-fit">
              <FileText size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-900 mb-0.5">Metode: {order.shippingInfo.paymentMethod}</p>
              <p className="text-[10px] text-blue-700 leading-tight">Admin sedang memverifikasi pesanan Anda. Pastikan Anda telah menekan 'Kirim ke WhatsApp' untuk konfirmasi manual.</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t bg-neutral-50 flex gap-3">
          <button 
            onClick={() => window.print()}
            className="flex-1 bg-white border border-neutral-200 text-neutral-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-100 active:scale-95 transition-all text-sm"
          >
            <Printer size={18} /> Cetak
          </button>
          <button 
            onClick={onClose}
            className="flex-1 bg-neutral-900 text-white font-bold py-3 rounded-xl flex items-center justify-center hover:bg-black active:scale-95 transition-all text-sm shadow-lg shadow-black/10"
          >
            Selesai
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ProductCard = ({ product, onAddToCart }: { product: Product, onAddToCart: (p: Product) => void, key?: string }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="group bg-white rounded-[2rem] overflow-hidden border border-neutral-100 transition-all hover:shadow-2xl hover:shadow-primary/5"
  >
    <div className="aspect-[4/5] relative overflow-hidden bg-neutral-100">
      <img 
        src={product.image || 'https://picsum.photos/seed/product/400/500'} 
        alt={product.name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <button 
          onClick={() => onAddToCart(product)}
          className="w-full bg-primary text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
        >
          <Plus size={18} />
          <span>Add to Bag</span>
        </button>
      </div>
    </div>
    <div className="p-6 text-center">
      <div className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2">{product.category}</div>
      <h3 className="text-xl font-medium text-neutral-900 mb-2 serif line-clamp-1">{product.name}</h3>
      <p className="text-sm text-neutral-400 mb-4 line-clamp-1 italic italic italic">
        {product.description}
      </p>
      <div className="text-lg font-bold text-neutral-900">
        Rp {product.price.toLocaleString('id-ID')}
      </div>
    </div>
  </motion.div>
);

const CartDrawer = ({ 
  isOpen, 
  onClose, 
  items, 
  onUpdateQuantity, 
  onRemove,
  settings,
  onOrderSuccess
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  items: CartItem[], 
  onUpdateQuantity: (id: string, delta: number) => void,
  onRemove: (id: string) => void,
  settings: Setting | null,
  onOrderSuccess: (order: any) => void
}) => {
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    phone: '',
    address: '',
    paymentMethod: 'Transfer Bank'
  });

  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  
  const handleCheckout = async () => {
    if (!settings?.whatsappNumber) {
      alert("Nomor WhatsApp admin belum diatur!");
      return;
    }

    if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address) {
      alert("Mohon lengkapi data pengiriman!");
      return;
    }

    const orderId = `Minka-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    sendWhatsAppMessage(orderId, shippingInfo.paymentMethod);
  };

  const sendWhatsAppMessage = (orderId: string, method: string) => {
    const itemsText = items.map(item => `- ${item.product.name} (x${item.quantity}): Rp ${(item.product.price * item.quantity).toLocaleString('id-ID')}`).join('\n');
    
    const fullMessage = `Halo Admin, saya ingin memesan:

*Order ID:* #${orderId}
*Data Pemesan:*
Nama: ${shippingInfo.name}
WhatsApp: ${shippingInfo.phone}
Alamat: ${shippingInfo.address}

*Pesanan:*
${itemsText}

*Metode Pembayaran:*
${method}
${settings?.paymentInfo ? `\n*Petunjuk Pembayaran:*\n${settings.paymentInfo}` : ''}

*Total: Rp ${total.toLocaleString('id-ID')}*

Terima kasih!`;

    const encodedMessage = encodeURIComponent(fullMessage);
    const waUrl = `https://wa.me/${settings?.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    window.open(waUrl, '_blank');

    // Show Invoice / Receipt
    onOrderSuccess({
      items,
      total,
      shippingInfo: { ...shippingInfo, paymentMethod: method },
      date: new Date().toLocaleString('id-ID'),
      orderId: orderId
    });
    setStep('cart');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
          >
            <div className="p-4 border-b flex justify-between items-center bg-neutral-50">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {step === 'cart' ? <><ShoppingBag /> Keranjang Belanja</> : <><Plus /> Data Pengiriman</>}
              </h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {step === 'cart' ? (
                items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-400 opacity-50">
                    <ShoppingBag size={64} className="mb-4" />
                    <p className="text-lg">Keranjang masih kosong</p>
                  </div>
                ) : (
                  items.map(item => (
                    <div key={item.product.id} className="flex gap-4 p-3 bg-neutral-50 rounded-2xl border border-neutral-100">
                      <img 
                        src={item.product.image} 
                        alt={item.product.name} 
                        className="w-20 h-20 object-cover rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-neutral-800 mb-1">{item.product.name}</h4>
                        <p className="text-sm text-neutral-500 mb-2">Rp {item.product.price.toLocaleString('id-ID')}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 bg-white rounded-lg border p-1">
                            <button 
                              onClick={() => onUpdateQuantity(item.product.id, -1)}
                              className="w-6 h-6 flex items-center justify-center hover:bg-neutral-100 rounded disabled:opacity-30"
                              disabled={item.quantity <= 1}
                            >
                              -
                            </button>
                            <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => onUpdateQuantity(item.product.id, 1)}
                              className="w-6 h-6 flex items-center justify-center hover:bg-neutral-100 rounded"
                            >
                              +
                            </button>
                          </div>
                          <button 
                            onClick={() => onRemove(item.product.id)}
                            className="text-red-400 hover:text-red-500 transition-colors p-2"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )
              ) : (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-1">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={shippingInfo.name}
                      onChange={e => setShippingInfo({...shippingInfo, name: e.target.value})}
                      className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                      placeholder="Masukkan nama Anda"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-1">No. WhatsApp</label>
                    <input 
                      type="text" 
                      value={shippingInfo.phone}
                      onChange={e => setShippingInfo({...shippingInfo, phone: e.target.value})}
                      className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                      placeholder="Contoh: 0812..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-1">Alamat Lengkap Pengiriman</label>
                    <textarea 
                      value={shippingInfo.address}
                      onChange={e => setShippingInfo({...shippingInfo, address: e.target.value})}
                      className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none h-32 resize-none"
                      placeholder="Nama Jalan, No. Rumah, RT/RW, Kecamatan, Kota"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-1">Metode Pembayaran</label>
                    <select 
                      value={shippingInfo.paymentMethod}
                      onChange={e => setShippingInfo({...shippingInfo, paymentMethod: e.target.value})}
                      className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                      <option value="Transfer Bank">Transfer Bank Manual</option>
                      <option value="COD (Bayar di Tempat)">COD (Bayar di Tempat)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t bg-neutral-50 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Total Pembayaran</span>
                  <span className="text-2xl font-black text-neutral-900">
                    Rp {total.toLocaleString('id-ID')}
                  </span>
                </div>
                {step === 'cart' ? (
                  <button 
                    onClick={() => setStep('checkout')}
                    className="w-full bg-neutral-900 hover:bg-black text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-black/10"
                  >
                    Lanjutkan Pembayaran
                    <ChevronRight size={20} />
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setStep('cart')}
                      className="flex-1 bg-white border border-neutral-200 text-neutral-600 font-bold py-4 rounded-2xl transition-all"
                    >
                      Kembali
                    </button>
                    <button 
                      onClick={handleCheckout}
                      className="flex-[2] bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
                    >
                      <Send size={20} />
                      Pesan via WhatsApp
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- Pages ---

const Catalog = ({ 
  products, 
  onAddToCart, 
  settings 
}: { 
  products: Product[], 
  onAddToCart: (p: Product) => void,
  settings: Setting | null
}) => {
  const [activeCategory, setActiveCategory] = useState('Semua');
  const categories = ['Semua', ...Array.from(new Set(products.map(p => p.category)))];
  
  const filteredProducts = activeCategory === 'Semua' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-20">
      <header className="mb-20 text-center">
        <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-[0.2em] rounded-full mb-6">
          Boutique Lifestyle & Home
        </div>
        <h1 className="text-5xl md:text-7xl font-light text-neutral-900 mb-8 tracking-tighter leading-none serif">
          {settings?.storeName || 'Minka Artisanal'}
        </h1>
        <p className="text-neutral-500 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
          Crafting essentials for a slow and intentional life. Browse our seasonal 
          collection and checkout directly via WhatsApp.
        </p>
      </header>

      {/* Categories */}
      <div className="flex justify-center gap-8 border-b border-neutral-200 mb-12">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "pb-4 text-xs font-bold uppercase tracking-widest transition-all relative",
              activeCategory === cat 
                ? "text-primary border-b-2 border-primary" 
                : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-neutral-200">
          <div className="text-neutral-300 mb-4 flex justify-center">
            <Package size={64} />
          </div>
          <h3 className="text-xl font-bold text-neutral-800">Belum ada produk</h3>
          <p className="text-neutral-500">Silakan kembali lagi nanti.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={onAddToCart} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

const AdminPanel = ({ products, settings, user }: { products: Product[], settings: Setting | null, user: User | null }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    image: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [storeConfig, setStoreConfig] = useState(settings || {
    storeName: '',
    whatsappNumber: '',
    currencySymbol: 'Rp'
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (e.g., max 1MB for Base64 storage in Firestore)
    if (file.size > 1024 * 1024) {
      alert("File terlalu besar. Maksimal 1MB untuk performa terbaik.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewProduct(prev => ({ ...prev, image: reader.result as string }));
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), {
          ...newProduct,
          updatedAt: serverTimestamp()
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'products'), {
          ...newProduct,
          createdAt: serverTimestamp()
        });
      }
      setIsAdding(false);
      setNewProduct({ name: '', description: '', price: 0, category: '', image: '' });
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Gagal menyimpan produk.");
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingId(product.id);
    setNewProduct({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      image: product.image
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Hapus produk ini?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        alert("Gagal menghapus produk.");
      }
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateDoc(doc(db, 'settings', 'config'), { ...storeConfig });
      alert("Pengaturan disimpan!");
    } catch (error) {
      // If it doesn't exist, try setting it
      try {
        const { setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'settings', 'config'), { ...storeConfig });
        alert("Pengaturan disimpan!");
      } catch (e) {
        alert("Gagal menyimpan pengaturan.");
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-8">
        <div>
          <h1 className="text-3xl font-black text-neutral-900">Panel Manager</h1>
          <p className="text-neutral-500">Kelola katalog produk dan pengaturan toko di sini.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-neutral-800">{user?.displayName}</div>
            <div className="text-xs text-neutral-500">{user?.email}</div>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="p-3 bg-white text-red-500 rounded-2xl border border-red-100 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings column */}
        <section className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <SettingsIcon size={20} className="text-primary" /> Pengaturan Toko
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1">Nama Toko</label>
                <input 
                  type="text" 
                  value={storeConfig.storeName}
                  onChange={e => setStoreConfig({...storeConfig, storeName: e.target.value})}
                  className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Contoh: My Fashion Shop"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1">WhatsApp Admin</label>
                <input 
                  type="text" 
                  value={storeConfig.whatsappNumber}
                  onChange={e => setStoreConfig({...storeConfig, whatsappNumber: e.target.value})}
                  className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Contoh: 628123456789"
                />
                <p className="text-[10px] text-neutral-400 mt-1">*Mulai dengan kode negara (62 for ID)</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1">Info Pembayaran (Rekening/E-wallet)</label>
                <textarea 
                  value={storeConfig.paymentInfo || ''}
                  onChange={e => setStoreConfig({...storeConfig, paymentInfo: e.target.value})}
                  className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all h-20 resize-none"
                  placeholder="Contoh: BCA 123456 a/n TokoWA"
                />
              </div>
              <button 
                onClick={handleSaveSettings}
                className="w-full bg-neutral-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-colors"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </section>

        {/* Product management column */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Package size={20} className="text-primary" /> Kelola Produk ({products.length})
            </h2>
            <button 
              onClick={() => {
                setEditingId(null);
                setNewProduct({ name: '', description: '', price: 0, category: '', image: '' });
                setIsAdding(true);
              }}
              className="bg-primary text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-primary-dark transition-all"
            >
              <Plus size={18} /> Tambah Produk
            </button>
          </div>

          <AnimatePresence>
            {isAdding && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-6"
              >
                <form onSubmit={handleSubmitProduct} className="bg-white p-6 rounded-3xl border border-primary/20 shadow-lg space-y-4">
                  <h3 className="font-bold text-lg text-primary mb-2 flex items-center gap-2">
                    {editingId ? <><Edit size={20} /> Edit Produk</> : <><Plus size={20} /> Tambah Produk Baru</>}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-1">Nama Produk</label>
                      <input 
                        required
                        className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl outline-none"
                        value={newProduct.name}
                        onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Kategori</label>
                      <input 
                        required
                        className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl outline-none"
                        value={newProduct.category}
                        onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Deskripsi</label>
                    <textarea 
                      className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl outline-none resize-none h-24"
                      value={newProduct.description}
                      onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-1">Harga (Rp)</label>
                      <input 
                        required
                        type="number"
                        className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl outline-none"
                        value={newProduct.price}
                        onChange={e => setNewProduct({...newProduct, price: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Foto Produk</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input 
                            type="text"
                            className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl outline-none pr-10"
                            value={newProduct.image}
                            onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                            placeholder="URL atau pilih file..."
                          />
                          <ImageIcon size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        </div>
                        <label className="bg-neutral-100 hover:bg-neutral-200 p-3 rounded-xl cursor-pointer transition-colors flex items-center justify-center border border-neutral-200 disabled:opacity-50">
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleImageUpload}
                            disabled={isUploading}
                          />
                          {isUploading ? (
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Upload size={20} className="text-neutral-600" />
                          )}
                        </label>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-1">*Bisa paste URL gambar atau upload langsung</p>
                    </div>
                  </div>
                  
                  {newProduct.image && (
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden border">
                       <img src={newProduct.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                       <button 
                        type="button"
                        onClick={() => setNewProduct({...newProduct, image: ''})}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 hover:opacity-100 transition-opacity"
                       >
                         <X size={12} />
                       </button>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="flex-1 bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20">
                      {editingId ? 'Update Produk' : 'Simpan Produk'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsAdding(false);
                        setEditingId(null);
                      }} 
                      className="px-6 py-3 border border-neutral-200 rounded-xl font-bold bg-white text-neutral-600"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            {products.map(product => (
              <div key={product.id} className="bg-white p-4 rounded-2xl border border-neutral-100 flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <img src={product.image} className="w-16 h-16 object-cover rounded-xl" referrerPolicy="no-referrer" />
                  <div>
                    <h4 className="font-bold text-neutral-800">{product.name}</h4>
                    <p className="text-sm text-neutral-500">Rp {product.price.toLocaleString('id-ID')} • {product.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEditClick(product)}
                    className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors"
                    title="Edit Produk"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(product.id)}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors"
                    title="Hapus Produk"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Setting | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sync Products
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribeProducts = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    // Sync Settings
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'config'), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data() as Setting);
      }
    });

    // Sync Auth
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const { getDoc, setDoc } = await import('firebase/firestore');
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        
        // If they are admin or they are the specific owner email, they get admin rights
        const emailAsAdmin = user.email === "demunaj2@gmail.com";
        
        if (!adminDoc.exists() && emailAsAdmin) {
          try {
            await setDoc(doc(db, 'admins', user.uid), { 
              email: user.email, 
              role: 'owner',
              createdAt: serverTimestamp() 
            });
            setIsAdmin(true);
          } catch (e) {
            console.error("Auto-admin creation failed", e);
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(adminDoc.exists());
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    // BOOTSTRAP: Initial settings (simplified, only run if user is admin)
    const initSettings = async () => {
      if (!isAdmin) return;
      const { getDoc, setDoc } = await import('firebase/firestore');
      try {
        const s = await getDoc(doc(db, 'settings', 'config'));
        if (!s.exists()) {
          await setDoc(doc(db, 'settings', 'config'), {
            storeName: 'Minka Artisanal',
            whatsappNumber: '628123456789',
            currencySymbol: 'Rp'
          });
        }
      } catch (e) {
        console.warn("Settings init failed - likely permissions", e);
      }
    };
    
    if (isAdmin) initSettings();

    return () => {
      unsubscribeProducts();
      unsubscribeSettings();
      unsubscribeAuth();
    };
  }, []);

  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleOrderSuccess = (order: any) => {
    setLastOrder(order);
    setCartItems([]); // Clear cart
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#5A5A40', '#D4A373', '#FFFFFF']
    });
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems(prev => 
      prev.map(item => 
        item.product.id === id 
          ? { ...item, quantity: Math.max(1, item.quantity + delta) } 
          : item
      )
    );
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== id));
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="text-primary"
        >
          <Store size={48} />
        </motion.div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar 
          cartCount={cartItems.reduce((s, i) => s + i.quantity, 0)} 
          onOpenCart={() => setIsCartOpen(true)}
          isAdmin={isAdmin}
        />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={
              <Catalog 
                products={products} 
                onAddToCart={handleAddToCart}
                settings={settings}
              />
            } />
            
            <Route path="/admin" element={
              isAdmin ? (
                <AdminPanel products={products} settings={settings} user={user} />
              ) : (
                <div className="h-[70vh] flex flex-col items-center justify-center px-4 text-center">
                  <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-neutral-100 max-w-sm w-full">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <LogIn size={32} />
                    </div>
                    <h2 className="text-2xl font-black mb-2">Area Manager</h2>
                    <p className="text-neutral-500 mb-8">
                      {user ? 'Akun Anda tidak memiliki akses admin.' : 'Silakan masuk dengan akun Google terdaftar untuk mengelola toko.'}
                    </p>
                    
                    {user ? (
                      <button 
                        onClick={() => signOut(auth)}
                        className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-red-100 transition-all active:scale-95 border border-red-100"
                      >
                        <LogOut size={20} /> Keluar (Sign Out)
                      </button>
                    ) : (
                      <button 
                        onClick={() => signInWithPopup(auth, new GoogleAuthProvider())}
                        className="w-full bg-neutral-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-95 shadow-lg shadow-black/10"
                      >
                        <LogIn size={20} /> Masuk dengan Google
                      </button>
                    )}

                    {!isAdmin && user && (
                      <div className="mt-8 p-4 bg-red-50 rounded-2xl border border-red-100">
                        <p className="text-sm text-red-500 font-bold mb-1">Akses Ditolak</p>
                        <p className="text-xs text-red-400">
                          Email: <span className="font-mono">{user.email}</span><br/>
                          Anda belum terdaftar sebagai admin.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <CartDrawer 
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemove={handleRemoveFromCart}
          settings={settings}
          onOrderSuccess={handleOrderSuccess}
        />

        <AnimatePresence>
          {lastOrder && (
            <OrderReceipt order={lastOrder} onClose={() => setLastOrder(null)} />
          )}
        </AnimatePresence>

        <footer className="bg-white border-t border-neutral-100 py-10 mt-auto">
          <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 font-bold text-xl text-neutral-400">
              <Store /> {settings?.storeName || 'TokoWA'}
            </div>
            <div className="flex gap-8 text-sm font-bold text-neutral-400">
              <Link to="/" className="hover:text-primary transition-colors">Katalog</Link>
              <Link to="/admin" className="hover:text-primary transition-colors">Kelola</Link>
            </div>
            <div className="text-neutral-300 text-sm italic">
              Built for speed and simplicity.
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
