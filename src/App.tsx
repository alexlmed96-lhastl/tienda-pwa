import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { CartModal } from './components/CartModal';
import { CatalogViewer } from './components/CatalogViewer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { AdminPanel } from './components/AdminPanel';
import { supabase } from './lib/supabase';
import type { Product, CatalogItem } from './types';
import { LayoutGrid, BookOpen, Loader2, Search, X, Camera } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

function AppContent() {
  const [currentRoute, setCurrentRoute] = useState<'store' | 'admin'>('store');
  const [activeTab, setActiveTab] = useState<'products' | 'catalogs'>('products');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const [products, setProducts] = useState<Product[]>([]);
  const [catalogs, setCatalogs] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Estado del escáner en la tienda pública
  const [isStoreScanning, setIsStoreScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isStoreScanning) {
      const scanner = new Html5QrcodeScanner(
        'store-barcode-scanner',
        { fps: 10, qrbox: { width: 250, height: 150 } },
        false
      );
      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          setSearchQuery(decodedText.trim());
          setIsStoreScanning(false);
          scanner.clear().catch(() => {});
        },
        () => {}
      );

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(() => {});
        }
      };
    }
  }, [isStoreScanning]);

  useEffect(() => {
    const handleLocation = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      if (path.includes('admin') || hash.includes('admin')) {
        setCurrentRoute('admin');
      } else {
        setCurrentRoute('store');
      }
    };

    handleLocation();
    window.addEventListener('popstate', handleLocation);
    window.addEventListener('hashchange', handleLocation);
    return () => {
      window.removeEventListener('popstate', handleLocation);
      window.removeEventListener('hashchange', handleLocation);
    };
  }, []);

  const navigateTo = (route: 'store' | 'admin') => {
    setCurrentRoute(route);
    window.location.hash = route === 'admin' ? 'admin' : '';
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedProducts: Product[] = (data || []).map((item: any) => ({
        id: String(item.id),
        name: item.name,
        description: item.description || '',
        price: parseFloat(item.price),
        category: item.category || 'General',
        stock: item.stock || 0,
        imageUrl:
          item.image_url ||
          'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&auto=format&fit=crop&q=60',
        barcode: item.barcode || undefined
      }));

      setProducts(mappedProducts);
    } catch (err: any) {
      console.error('Error al cargar productos:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCatalogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('catalogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Tabla catalogs sin registros o error:', error.message);
        return;
      }

      const mappedCatalogs: CatalogItem[] = (data || []).map((c: any) => ({
        id: String(c.id),
        title: c.title,
        pdfUrl: c.pdf_url,
        thumbnailUrl: c.thumbnail_url,
        isFlipbook: !!c.is_flipbook
      }));

      setCatalogs(mappedCatalogs);
    } catch (err: any) {
      console.error('Error al cargar catálogos:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCatalogs();
  }, [fetchProducts, fetchCatalogs]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ['Todos', ...cats];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === 'Todos' || p.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  if (currentRoute === 'admin') {
    return (
      <AdminPanel
        products={products}
        catalogs={catalogs}
        onRefresh={fetchProducts}
        onRefreshCatalogs={fetchCatalogs}
        onBackToStore={() => navigateTo('store')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar onOpenCart={() => setIsCartOpen(true)} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeTab === 'products' ? 'Catálogo de Productos' : 'Catálogos y Folletos PDF'}
            </h1>
            <p className="text-slate-500 mt-1">
              {activeTab === 'products'
                ? 'Explora nuestros productos disponibles con entrega inmediata en Cusco.'
                : 'Hojear folletos y catálogos en formato digital interactivo.'}
            </p>
          </div>

          <div className="bg-slate-200 p-1 rounded-xl flex items-center">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'products'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Productos</span>
            </button>
            <button
              onClick={() => setActiveTab('catalogs')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'catalogs'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>PDFs</span>
            </button>
          </div>
        </div>

        {activeTab === 'products' && (
          <div className="space-y-4 mb-8">
            <div className="relative w-full">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, categoría o código de barras..."
                className="w-full pl-11 pr-20 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm placeholder:text-slate-400"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsStoreScanning(!isStoreScanning)}
                  className={`p-1.5 rounded-xl transition ${
                    isStoreScanning
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100'
                  }`}
                  title="Escanear código con cámara"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Escáner flotante para tienda / mostrador */}
            {isStoreScanning && (
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-lg max-w-sm mx-auto animate-in fade-in">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-600" /> Apunta al código del producto
                  </span>
                  <button
                    onClick={() => setIsStoreScanning(false)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div id="store-barcode-scanner" className="overflow-hidden rounded-xl border border-slate-200"></div>
              </div>
            )}

            {categories.length > 2 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' ? (
          loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-600" />
              <p className="text-sm font-medium">Cargando catálogo...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <p className="text-slate-700 font-bold text-base">No se encontraron productos</p>
              <p className="text-slate-400 text-xs mt-1">
                {searchQuery ? `No hay resultados para "${searchQuery}"` : 'Aún no hay productos registrados.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={(p) => setSelectedProduct(p)}
                />
              ))}
            </div>
          )
        ) : (
          <CatalogViewer catalogs={catalogs} />
        )}
      </main>

      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Catálogo Virtual. Todos los derechos reservados.</p>
        <button
          onClick={() => navigateTo('admin')}
          className="mt-1 text-slate-300 hover:text-slate-500 text-[11px] underline"
        >
          Acceso Administrador
        </button>
      </footer>

      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}