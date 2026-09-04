import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';
import { Camera, QrCode, Search, Check, Package, X, Loader2 } from 'lucide-react';

interface BarcodeManagerProps {
  products: Product[];
  onRefresh: () => void;
}

export const BarcodeManager: React.FC<BarcodeManagerProps> = ({ products, onRefresh }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [stockInput, setStockInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner(
        'scanner-assign-reader',
        { fps: 10, qrbox: { width: 250, height: 150 } },
        false
      );
      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          setBarcodeInput(decodedText.trim());
          setIsScanning(false);
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
  }, [isScanning]);

  const handleSelect = (product: Product) => {
    setSelectedProduct(product);
    setBarcodeInput(product.barcode || '');
    setStockInput(String(product.stock));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('products')
        .update({
          barcode: barcodeInput.trim() || null,
          stock: parseInt(stockInput) || 0,
        })
        .eq('id', selectedProduct.id);

      if (error) throw error;

      alert(`¡Producto "${selectedProduct.name}" actualizado correctamente!`);
      setSelectedProduct(null);
      setBarcodeInput('');
      setStockInput('');
      onRefresh();
    } catch (err: any) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span>Seleccionar Producto</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Elige un producto para vincularle un QR o modificar stock.</p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por nombre o código..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="max-h-[520px] overflow-y-auto space-y-2 pr-1">
          {filtered.map((p) => {
            const isCurrent = selectedProduct?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelect(p)}
                className={`w-full text-left p-3 rounded-2xl border transition flex items-center gap-3 ${
                  isCurrent
                    ? 'border-indigo-500 bg-indigo-50/60 shadow-sm'
                    : 'border-slate-100 bg-slate-50 hover:bg-slate-100/70'
                }`}
              >
                <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-white flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold text-slate-600">
                      Stock: {p.stock}
                    </span>
                    {p.barcode ? (
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                        <QrCode className="w-3 h-3" /> {p.barcode}
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-600 font-medium">Sin código</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        {selectedProduct ? (
          <form onSubmit={handleSave} className="space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img src={selectedProduct.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">{selectedProduct.name}</h3>
                  <p className="text-xs text-slate-500">Precio actual: S/ {selectedProduct.price.toFixed(2)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Cancelar
              </button>
            </div>

            {isScanning && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-indigo-600" /> Apunta la cámara al código de la caja
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsScanning(false)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div id="scanner-assign-reader" className="overflow-hidden rounded-xl border border-slate-200"></div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código de Barras o QR
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <QrCode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Ej. 775123456789 o escanear con la cámara..."
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsScanning(!isScanning)}
                  className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition border border-indigo-200"
                >
                  <Camera className="w-4 h-4" />
                  <span>{isScanning ? 'Cerrar Cámara' : 'Escanear con Cámara'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Stock Físico
              </label>
              <input
                type="number"
                required
                value={stockInput}
                onChange={(e) => setStockInput(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-sm flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Guardar Asignación</span>
            </button>
          </form>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-24 text-center text-slate-400">
            <QrCode className="w-12 h-12 stroke-[1.5] text-slate-300 mb-3" />
            <p className="font-bold text-slate-700 text-sm">Ningún producto seleccionado</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Selecciona un producto de la izquierda para escanear su código físico y modificar su stock en tiempo real.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};