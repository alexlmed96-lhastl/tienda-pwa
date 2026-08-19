import React, { useState } from 'react';
import { X, PlusCircle, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: () => void; // Actualizado para refrescar la lista
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onProductCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Periféricos');
  const [stock, setStock] = useState('10');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    try {
      setLoading(true);
      let finalImageUrl =
        'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&auto=format&fit=crop&q=60';

      // 1. Subir la imagen al Storage de Supabase si se seleccionó archivo
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('productos')
          .upload(filePath, imageFile);

        if (uploadError) {
          throw new Error('Error al subir imagen: ' + uploadError.message);
        }

        // Obtener la URL pública de la imagen
        const { data: urlData } = supabase.storage
          .from('productos')
          .getPublicUrl(filePath);

        finalImageUrl = urlData.publicUrl;
      }

      // 2. Insertar los datos en la tabla products de Supabase
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

      if (insertError) {
        throw new Error('Error al guardar en base de datos: ' + insertError.message);
      }

      // 3. Limpiar formulario y avisar a App.tsx para recargar
      setName('');
      setDescription('');
      setPrice('');
      setStock('10');
      setImageFile(null);
      setImagePreview('');
      onProductCreated();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Ocurrió un error al registrar el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4 text-slate-900">
          <PlusCircle className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold">Agregar Producto a Supabase</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              placeholder="Ej. Memoria RAM DDR4 8GB"
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
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                placeholder="150.00"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Stock</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                placeholder="10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              placeholder="Ej. Componentes, Periféricos"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              placeholder="Especificaciones o detalles..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Foto del producto</label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg border border-slate-300 flex items-center gap-2 text-sm font-medium text-slate-700 transition">
                <ImageIcon className="w-4 h-4" />
                <span>Seleccionar imagen</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>{loading ? 'Guardando en Supabase...' : 'Guardar Producto'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};