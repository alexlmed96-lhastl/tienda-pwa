import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Product, CatalogItem } from '../types';
import { exportToFacebookCSV } from '../utils/exportFacebookFeed';
import { ExcelCatalogSearch } from './ExcelCatalogSearch';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Download, 
  Package, 
  Image as ImageIcon, 
  Loader2, 
  Lock, 
  LogOut, 
  Pencil, 
  X, 
  CheckSquare, 
  Square, 
  BookOpen, 
  FileUp,
  FileSpreadsheet
} from 'lucide-react';

interface AdminPanelProps {
  products: Product[];
  catalogs: CatalogItem[];
  onRefresh: () => void;
  onRefreshCatalogs: () => void;
  onBackToStore: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  products,
  catalogs,
  onRefresh,
  onRefreshCatalogs,
  onBackToStore
}) => {
  // Estados de Autenticación Supabase
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [adminTab, setAdminTab] = useState<'products' | 'catalogs' | 'excel'>('products');

  // Formulario Producto
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Periféricos');
  const [stock, setStock] = useState('10');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Formulario Catálogo PDF
  const [catalogTitle, setCatalogTitle] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isFlipbook, setIsFlipbook] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  // Escuchar sesión activa de Supabase
  useEffect(() => {
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch (err) {
        console.error('Error al verificar sesión:', err);
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setIsLoggingIn(true);
      setAuthError('');

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        setAuthError(error.message === 'Invalid login credentials' 
          ? 'Correo o contraseña incorrectos.' 
          : error.message);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Error inesperado al iniciar sesión.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleStartEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || '');
    setPrice(String(product.price));
    setCategory(product.category || 'Periféricos');
    setStock(String(product.stock));
    setImagePreview(product.imageUrl);
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice('');
    setCategory('Periféricos');
    setStock('10');
    setImageFile(null);
    setImagePreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    try {
      setIsSubmitting(true);
      let finalImageUrl = editingProduct ? editingProduct.imageUrl : 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&auto=format&fit=crop&q=60';

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('productos')
          .upload(filePath, imageFile);

        if (uploadError) throw new Error('Error al subir imagen: ' + uploadError.message);

        const { data: urlData } = supabase.storage
          .from('productos')
          .getPublicUrl(filePath);

        finalImageUrl = urlData.publicUrl;
      }

      if (editingProduct) {
        const { error: updateError } = await supabase
          .from('products')
          .update({
            name,
            description,
            price: parseFloat(price),
            category,
            stock: parseInt(stock) || 0,
            image_url: finalImageUrl,
          })
          .eq('id', editingProduct.id);

        if (updateError) throw new Error('Error al actualizar: ' + updateError.message);
        alert('¡Producto actualizado!');
      } else {
        const { error: insertError } = await supabase.from('products').insert([
          {
            name,
            description,
            price: parseFloat(price),
            category,
            stock: parseInt(stock) || 0,
            image_url: finalImageUrl,
          },
        ]);

        if (insertError) throw new Error('Error al crear: ' + insertError.message);
        alert('¡Producto agregado exitosamente!');
      }

      handleCancelEdit();
      onRefresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Ocurrió un error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catalogTitle) return;

    if (pdfFile) {
      const maxBytes = 45 * 1024 * 1024;
      if (pdfFile.size > maxBytes) {
        alert(
          `El archivo pesa ${(pdfFile.size / (1024 * 1024)).toFixed(1)} MB y supera el límite de 45 MB.\n` +
          `Comprímelo antes de subir o pega un enlace de Heyzine.`
        );
        return;
      }
    }

    try {
      setIsUploadingPdf(true);
      let finalPdfUrl = externalUrl;

      if (pdfFile) {
        const fileExt = pdfFile.name.split('.').pop() || 'pdf';
        const fileName = `pdf-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('catalogos')
          .upload(fileName, pdfFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) throw new Error('Error al subir PDF: ' + uploadError.message);

        const { data: urlData } = supabase.storage
          .from('catalogos')
          .getPublicUrl(fileName);

        finalPdfUrl = urlData.publicUrl;
      }

      if (!finalPdfUrl) {
        alert('Debes seleccionar un archivo PDF o ingresar un enlace.');
        return;
      }

      const { error: insertError } = await supabase.from('catalogs').insert([
        {
          title: catalogTitle,
          pdf_url: finalPdfUrl,
          is_flipbook: isFlipbook || finalPdfUrl.includes('heyzine.com'),
        },
      ]);

      if (insertError) throw new Error('Error al guardar catálogo: ' + insertError.message);

      alert('¡Catálogo publicado con éxito!');
      setCatalogTitle('');
      setPdfFile(null);
      setExternalUrl('');
      setIsFlipbook(false);
      onRefreshCatalogs();
    } catch (err: any) {
      alert(err.message || 'Error al subir catálogo');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleDeleteCatalog = async (id: string) => {
    if (!confirm('¿Deseas eliminar este catálogo?')) return;
    try {
      const { error } = await supabase.from('catalogs').delete().eq('id', id);
      if (error) throw error;
      onRefreshCatalogs();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      setDeletingId(id);
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      onRefresh();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  const handleExportSelected = () => {
    const listToExport =
      selectedIds.length > 0
        ? products.filter((p) => selectedIds.includes(p.id))
        : products;

    exportToFacebookCSV(listToExport);
  };

  // Pantalla de carga mientras lee token persistido
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Pantalla de Login Supabase
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-xl border border-slate-200 text-center">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-slate-900">Panel de Administración</h1>
          <p className="text-xs text-slate-500 mt-1 mb-6">Ingreso restringido mediante credenciales seguras</p>

          {authError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-xl text-left">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Correo electrónico"
                className="w-full text-sm py-2.5 px-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                autoFocus
              />
            </div>

            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full text-sm py-2.5 px-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoggingIn && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isLoggingIn ? 'Comprobando...' : 'Iniciar Sesión'}</span>
            </button>
          </form>

          <button
            onClick={onBackToStore}
            className="mt-4 text-xs font-semibold text-slate-500 hover:text-slate-800 transition block mx-auto"
          >
            ← Volver a la Tienda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      <header className="bg-slate-900 text-white px-6 py-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBackToStore}
                className="p-2 hover:bg-slate-800 rounded-xl transition text-slate-300 hover:text-white"
                title="Ir a la tienda"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-extrabold text-lg leading-none">Panel de Administración</h1>
                <span className="text-xs text-slate-400">Gestión de Inventario, PDFs y Excel</span>
              </div>
            </div>

            <div className="flex bg-slate-800 p-1 rounded-xl sm:hidden">
              <button
                onClick={() => setAdminTab('products')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg ${adminTab === 'products' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
              >
                Productos
              </button>
              <button
                onClick={() => setAdminTab('catalogs')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg ${adminTab === 'catalogs' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
              >
                PDFs
              </button>
              <button
                onClick={() => setAdminTab('excel')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg ${adminTab === 'excel' ? 'bg-emerald-600 text-white' : 'text-slate-300'}`}
              >
                Excel
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="hidden sm:flex bg-slate-800 p-1 rounded-xl mr-2 gap-1">
              <button
                onClick={() => setAdminTab('products')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${adminTab === 'products' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
              >
                Productos ({products.length})
              </button>
              <button
                onClick={() => setAdminTab('catalogs')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${adminTab === 'catalogs' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
              >
                Catálogos PDF ({catalogs.length})
              </button>
              <button
                onClick={() => setAdminTab('excel')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${adminTab === 'excel' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Lista Excel</span>
              </button>
            </div>

            {adminTab === 'products' && (
              <button
                onClick={handleExportSelected}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>{selectedIds.length > 0 ? `Meta CSV (${selectedIds.length})` : 'Exportar CSV'}</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-2 rounded-xl text-xs font-bold transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {adminTab === 'products' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-fit">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {editingProduct ? <Pencil className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-blue-600" />}
                  <h2 className="font-extrabold text-base text-slate-900">
                    {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                  </h2>
                </div>
                {editingProduct && (
                  <button onClick={handleCancelEdit} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Cancelar
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Memoria RAM DDR4 8GB"
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Precio (S/)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="150.00"
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Stock</label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="10"
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ej. Componentes, Laptops"
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detalles..."
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Foto</label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-700 transition">
                      <ImageIcon className="w-4 h-4" />
                      <span>{editingProduct ? 'Cambiar foto' : 'Subir foto'}</span>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" className="w-10 h-10 object-cover rounded-xl border border-slate-200" />
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full mt-2 py-2.5 rounded-xl font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 text-white disabled:opacity-50 ${editingProduct ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingProduct ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{isSubmitting ? 'Guardando...' : editingProduct ? 'Actualizar Producto' : 'Publicar Producto'}</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <h2 className="font-extrabold text-base text-slate-900">Inventario ({products.length})</h2>
                </div>
                <button onClick={onRefresh} className="text-xs font-bold text-blue-600 hover:underline">Refrescar</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-y border-slate-100">
                    <tr>
                      <th className="py-3 px-3 w-8 text-center">
                        <button onClick={toggleSelectAll}>
                          {selectedIds.length === products.length && products.length > 0 ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 px-3">Producto</th>
                      <th className="py-3 px-3">Precio</th>
                      <th className="py-3 px-3">Stock</th>
                      <th className="py-3 px-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((p) => {
                      const isSelected = selectedIds.includes(p.id);
                      return (
                        <tr key={p.id} className={`hover:bg-slate-50/60 transition ${isSelected ? 'bg-blue-50/40' : ''}`}>
                          <td className="py-3 px-3 text-center">
                            <button onClick={() => toggleSelectProduct(p.id)}>
                              {isSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                            </button>
                          </td>
                          <td className="py-3 px-3 flex items-center gap-3">
                            <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100 flex-shrink-0" />
                            <div>
                              <div className="font-bold text-slate-900 leading-tight">{p.name}</div>
                              <div className="text-xs text-slate-400">{p.category}</div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">S/ {p.price.toFixed(2)}</td>
                          <td className="py-3 px-3">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.stock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                              {p.stock}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => handleStartEdit(p)} className="p-1.5 text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-100">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteProduct(p.id)} disabled={deletingId === p.id} className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50">
                                {deletingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : adminTab === 'catalogs' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-fit">
              <div className="flex items-center gap-2 mb-4">
                <FileUp className="w-5 h-5 text-blue-600" />
                <h2 className="font-extrabold text-base text-slate-900">Subir Folleto / Catálogo PDF</h2>
              </div>

              <form onSubmit={handleUploadCatalog} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Título del Catálogo</label>
                  <input
                    type="text"
                    required
                    value={catalogTitle}
                    onChange={(e) => setCatalogTitle(e.target.value)}
                    placeholder="Ej. Catálogo Especial Laptops 2026"
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Archivo PDF (Subir a Supabase)</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                <div className="text-center text-xs text-slate-400 font-bold">O ENLACE EXTERNO</div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Enlace Flipbook / Heyzine (Opcional)</label>
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://heyzine.com/flip-book/..."
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUploadingPdf}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUploadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                  <span>{isUploadingPdf ? 'Subiendo PDF...' : 'Guardar Catálogo'}</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="font-extrabold text-base text-slate-900 mb-4">Catálogos Guardados ({catalogs.length})</h2>
              <div className="space-y-3">
                {catalogs.map((cat) => (
                  <div key={cat.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{cat.title}</h3>
                      <a href={cat.pdfUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline truncate max-w-xs block">
                        {cat.pdfUrl}
                      </a>
                    </div>
                    <button
                      onClick={() => handleDeleteCatalog(cat.id)}
                      className="p-2 text-red-500 hover:bg-red-100 rounded-xl transition"
                      title="Eliminar catálogo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Pestaña exclusiva de Administrador: Lista Excel con Buscador por Voz */
          <ExcelCatalogSearch />
        )}
      </main>
    </div>
  );
};