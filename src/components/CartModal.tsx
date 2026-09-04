import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { generateQuotePdf } from '../utils/generateQuotePdf';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  Plus, 
  Minus, 
  FileDown, 
  Send,
  MapPin,
  Truck
} from 'lucide-react';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose }) => {
  const cartContext = useCart() as any;
  const { cart = [], removeFromCart, addToCart } = cartContext;

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'tienda' | 'envio'>('tienda');
  const [address, setAddress] = useState('');

  if (!isOpen) return null;

  // Normalizar items para soportar tanto item.product como item plano
  const normalizedCart = cart.map((item: any) => {
    const prod = item.product || item;
    const quantity = item.quantity || 1;
    const price = Number(prod.price || 0);
    return {
      raw: item,
      id: prod.id || item.id,
      name: prod.name || item.name || 'Producto',
      price: price,
      quantity: quantity,
      imageUrl: prod.imageUrl || prod.image_url || item.imageUrl || '',
      subtotal: price * quantity,
    };
  });

  const total = normalizedCart.reduce((sum: number, it: any) => sum + it.subtotal, 0);

  const handleDecrease = (item: any) => {
    if (cartContext.updateQuantity) {
      cartContext.updateQuantity(item.id, Math.max(1, item.quantity - 1));
    } else if (removeFromCart) {
      removeFromCart(item.id);
    }
  };

  const handleIncrease = (item: any) => {
    if (cartContext.updateQuantity) {
      cartContext.updateQuantity(item.id, item.quantity + 1);
    } else if (addToCart) {
      addToCart(item.raw.product || item.raw);
    }
  };

  const handleDownloadQuote = () => {
    if (normalizedCart.length === 0) return;
    generateQuotePdf({
      customerName: customerName.trim() || 'Cliente General',
      customerPhone: customerPhone.trim() || undefined,
      items: normalizedCart,
      total: total,
    });
  };

  const handleSendWhatsApp = () => {
    if (normalizedCart.length === 0) return;

    const itemsText = normalizedCart
      .map((item: any) => `• *${item.name}* (x${item.quantity}) - S/ ${item.subtotal.toFixed(2)}`)
      .join('\n');

    const deliveryText =
      deliveryMethod === 'tienda'
        ? '🏪 *Modalidad:* Recojo en Tienda Física (Cusco)'
        : `🚚 *Modalidad:* Envío a Domicilio / Agencia\n📍 *Dirección:* ${address || 'A coordinar'}`;

    const message = 
`👋 *¡HOLA! DESEO REALIZAR EL SIGUIENTE PEDIDO:*

👤 *Cliente:* ${customerName || 'No especificado'}
📱 *Teléfono:* ${customerPhone || 'No especificado'}

📦 *Detalle del Pedido:*
${itemsText}

💰 *TOTAL: S/ ${total.toFixed(2)}*

${deliveryText}

💳 *Forma de Pago solicitada:* Yape / BCP / Transferencia

_Por favor confírmenme disponibilidad para coordinar el pago y entrega._`;

    const whatsappUrl = `https://wa.me/51984000000?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabecera */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <h2 className="font-extrabold text-base text-slate-900">Carrito de Compras ({normalizedCart.length})</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de productos */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {normalizedCart.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <ShoppingBag className="w-12 h-12 stroke-[1.5] mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700 text-sm">Tu carrito está vacío</p>
              <p className="text-xs text-slate-400 mt-1">Explora el catálogo y agrega productos para cotizar o comprar.</p>
            </div>
          ) : (
            <>
              {normalizedCart.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-xl object-cover bg-white flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 mx-3">
                    <h4 className="font-bold text-xs text-slate-900 truncate">{item.name}</h4>
                    <p className="text-xs font-extrabold text-blue-600 mt-0.5">S/ {item.price.toFixed(2)}</p>
                  </div>

                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5">
                    <button
                      onClick={() => handleDecrease(item)}
                      className="p-1 text-slate-500 hover:text-slate-800"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-slate-800">{item.quantity}</span>
                    <button
                      onClick={() => handleIncrease(item)}
                      className="p-1 text-slate-500 hover:text-slate-800"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart && removeFromCart(item.id)}
                    className="p-2 text-red-500 hover:text-red-700 ml-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Formulario Cliente */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h3 className="font-bold text-xs text-slate-700">Datos para la Cotización o Pedido:</h3>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Tu Nombre o Empresa"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Celular / WhatsApp"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('tienda')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                      deliveryMethod === 'tienda'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Recojo en Tienda</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('envio')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                      deliveryMethod === 'envio'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Envío a Domicilio</span>
                  </button>
                </div>

                {deliveryMethod === 'envio' && (
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Dirección exacta o agencia (Shalom / Olva)"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                )}
              </div>
            </>
          )}
        </div>

        {/* Acciones inferiores */}
        {normalizedCart.length > 0 && (
          <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total a pagar:</span>
              <span className="text-lg font-black text-slate-900">S/ {total.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadQuote}
                className="w-full bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <FileDown className="w-4 h-4 text-blue-600" />
                <span>Proforma PDF</span>
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>Pedir WhatsApp</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};