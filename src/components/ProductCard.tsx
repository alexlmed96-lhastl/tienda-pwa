import React from 'react';
import { ShoppingCart } from 'lucide-react';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addToCart } = useCart();

  return (
    <div 
      onClick={() => onSelect && onSelect(product)}
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col cursor-pointer group"
    >
      <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
        <span className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2.5 py-0.5 rounded-full text-xs font-semibold text-slate-700">
          {product.category}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-slate-900 text-base line-clamp-1 mb-1 group-hover:text-blue-600 transition">
          {product.name}
        </h3>
        <p className="text-slate-500 text-xs line-clamp-2 mb-4 flex-1">
          {product.description}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div>
            <span className="text-xs text-slate-400 block">Precio</span>
            <span className="text-lg font-black text-slate-900">
              S/ {product.price.toFixed(2)}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation(); // Evita abrir el modal si solo quiere agregar rápido
              addToCart(product);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition shadow-sm"
            title="Añadir directo"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};