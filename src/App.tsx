import { useState, useEffect, useCallback } from 'react';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { CartModal } from './components/CartModal';
import { CatalogViewer } from './components/CatalogViewer';
import { AddProductModal } from './components/AddProductModal';
import { supabase } from './lib/supabase';
import type { Product, CatalogItem } from './types';
import { Plus, LayoutGrid, BookOpen, Loader2 } from 'lucide-react';

const SAMPLE_CATALOGS: CatalogItem[] = [
  {
    id: '1',
    title: 'Catálogo General de Productos',
    pdfUrl: 'https://heyzine.com/flip-book/sample',
    isFlipbook: true
  }
];

function AppContent() {
  const [activeTab, setActiveTab] = useState<'products' | 'catalogs'>('products');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al consultar Supabase:', error);
        return;
      }

      const mappedProducts: Product[] = (data || []).map((item: any) => ({
        id: String(item.id),
        name: item.name,
        description: item.description || '',
        price: parseFloat(item.price),
        category: item.category || 'General',
        stock: item.stock || 0,
        imageUrl: item.image_url || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&auto=format&fit=crop&q=60'
      }));

      setProducts(mappedProducts);
    } catch (err: any) {
      console.error('Error inesperado:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar onOpenCart={() => setIsCartOpen(true)} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeTab === 'products' ? 'Catálogo de Productos' : 'Catálogos y Folletos PDF'}
            </h1>
            <p className="text-slate-500 mt-1">
              {activeTab === 'products'
                ? 'Productos sincronizados en tiempo real con Supabase.'
                : 'Hojear catálogos en formato digital interactivo.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-200 p-1 rounded-xl flex items-center">
              <button
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  activeTab === 'products' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Productos</span>
              </button>
              <button
                onClick={() => setActiveTab('catalogs')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  activeTab === 'catalogs' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>PDFs</span>
              </button>
            </div>

            {activeTab === 'products' && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-sm font-medium transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo</span>
              </button>
            )}
          </div>
        </div>

        {activeTab === 'products' ? (
          loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-600" />
              <p className="text-sm font-medium">Cargando productos de Supabase...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
              <p className="text-slate-600 font-medium">No hay productos registrados en Supabase.</p>
              <p className="text-slate-400 text-sm mt-1">Presiona "+ Nuevo" para agregar el primero.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )
        ) : (
          <CatalogViewer catalogs={SAMPLE_CATALOGS} />
        )}
      </main>

      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onProductCreated={fetchProducts}
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