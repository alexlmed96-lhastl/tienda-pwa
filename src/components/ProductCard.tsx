import React from 'react';
import { Plus } from 'lucide-react';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
      <div>
        <div className="h-48 w-full overflow-hidden bg-slate-100 relative">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition duration-300"
            loading="lazy"
          />
          <span className="absolute top-2 left-2 bg-slate-900/70 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium">
            {product.category}
          </span>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-slate-900 text-lg line-clamp-1">{product.name}</h3>
          <p className="text-slate-500 text-sm mt-1 line-clamp-2">{product.description}</p>
        </div>
      </div>

      <div className="p-4 pt-0 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 block font-medium">Precio</span>
          <span className="text-xl font-bold text-slate-900">S/ {product.price.toFixed(2)}</span>
        </div>

        <button
          onClick={() => addToCart(product)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-sm font-medium transition shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar</span>
        </button>
      </div>
    </div>
  );
};