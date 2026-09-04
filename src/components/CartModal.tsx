import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, Send } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, clearCart, total } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');

  // Reemplaza con tu número de WhatsApp con código de país (ejemplo: 51 para Perú)
  const WHATSAPP_NUMBER = '51935238750';
  

  if (!isOpen) return null;

  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    let message = `🛒 *NUEVO PEDIDO - TIENDA PWA*\n\n`;

    if (customerName.trim()) {
      message += `👤 *Cliente:* ${customerName.trim()}\n`;
    }

    message += `📋 *Detalle del pedido:*\n`;
    cart.forEach((item, index) => {
      const subtotal = (item.product.price * item.quantity).toFixed(2);
      message += `${index + 1}. ${item.product.name} (x${item.quantity}) - S/ ${subtotal}\n`;
    });

    message += `\n💰 *Total a pagar:* S/ ${total.toFixed(2)}\n`;

    if (notes.trim()) {
      message += `💬 *Notas:* ${notes.trim()}\n`;
    }

    message += `\n_Enviado desde el catálogo web_`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
    clearCart();
    setCustomerName('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
        {/* Encabezado */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-lg">Tu Carrito</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de productos */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <ShoppingBag className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-600 font-medium">El carrito está vacío</p>
              <p className="text-slate-400 text-sm">Agrega productos para visualizarlos aquí.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
              >
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="w-14 h-14 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900 text-sm truncate">{item.product.name}</h4>
                  <p className="text-xs text-slate-500">
                    S/ {item.product.price.toFixed(2)} x {item.quantity}
                  </p>
                  <p className="text-sm font-bold text-blue-600">
                    S/ {(item.product.price * item.quantity).toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Formulario y Confirmación por WhatsApp */}
        {cart.length > 0 && (
          <form onSubmit={handleSendWhatsApp} className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre (opcional)</label>
              <input
                type="text"
                placeholder="Ej. Juan Pérez"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dirección o notas (opcional)</label>
              <input
                type="text"
                placeholder="Ej. Entrega a domicilio / Referencia"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div className="flex justify-between items-center text-slate-700 pt-2 border-t border-slate-200">
              <span className="font-medium">Total:</span>
              <span className="text-2xl font-black text-slate-900">S/ {total.toFixed(2)}</span>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-sm active:scale-98"
            >
              <Send className="w-4 h-4" />
              <span>Pedir por WhatsApp</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};