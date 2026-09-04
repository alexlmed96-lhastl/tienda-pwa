import React from 'react';
import { X, ShoppingCart, Check, Tag, Package } from 'lucide-react';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { addToCart } = useCart();
  const [added, setAdded] = React.useState(false);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-white/80 backdrop-blur p-2 rounded-full text-slate-600 hover:text-slate-900 shadow-md transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Imagen destacada */}
        <div className="relative h-64 sm:h-72 w-full bg-slate-100 flex-shrink-0">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-slate-700 flex items-center gap-1 shadow-sm">
            <Tag className="w-3.5 h-3.5 text-blue-600" />
            {product.category}
          </span>
        </div>

        {/* Información y especificaciones */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-900 leading-snug">
              {product.name}
            </h2>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-blue-600">
                S/ {product.price.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Package className="w-4 h-4 text-slate-400" />
            <span>Stock disponible: </span>
            <span className={product.stock > 0 ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
              {product.stock > 0 ? `${product.stock} unidades` : 'Agotado'}
            </span>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Descripción y detalles
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              {product.description || 'Sin descripción detallada disponible.'}
            </p>
          </div>
        </div>

        {/* Botón de acción fijo al pie */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm ${
              added
                ? 'bg-emerald-600 text-white'
                : product.stock > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" />
                <span>¡Agregado al carrito!</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>{product.stock > 0 ? 'Agregar al carrito' : 'Sin stock'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};