import React from 'react';
import { ShoppingCart, Store } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCart }) => {
  const { cart } = useCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-600">
          <Store className="w-6 h-6" />
          <span className="font-bold text-xl tracking-tight text-slate-900">Tienda PWA</span>
        </div>

        <button
          onClick={onOpenCart}
          className="relative p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          aria-label="Ver carrito"
        >
          <ShoppingCart className="w-5 h-5" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};