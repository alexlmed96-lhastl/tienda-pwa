import React, { useState, useMemo, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { Search, Mic, MicOff, Upload, FileSpreadsheet, X } from 'lucide-react';

interface ExcelItem {
  id: string;
  codigo: string;
  name: string;
  stock: number | string;
  precioCompra: number;
  precioVenta: number;
}

export const ExcelCatalogSearch: React.FC = () => {
  const [items, setItems] = useState<ExcelItem[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setHasSpeechSupport(true);
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) return;

      const rawRows: any[][] = [];
      worksheet.eachRow((row) => {
        rawRows.push((row.values as any[]).slice(1));
      });

      // Detectar automáticamente en qué fila se encuentran los encabezados
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
        const rowStr = rawRows[i].map((c) => String(c || '').toLowerCase()).join(' ');
        if (rowStr.includes('código') || rowStr.includes('codigo') || rowStr.includes('producto')) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        alert('No se encontraron las columnas CÓDIGO o PRODUCTO en el archivo.');
        return;
      }

      const headers = rawRows[headerRowIndex].map((h) =>
        String(h || '').trim().toLowerCase()
      );

      // Mapear índices de las columnas clave
      const colCodigo = headers.findIndex((h) => h.includes('código') || h.includes('codigo'));
      const colProducto = headers.findIndex((h) => h.includes('producto') || h.includes('nombre'));
      const colStock = headers.findIndex((h) => h.includes('stock') || h.includes('cantidad'));
      const colCompra = headers.findIndex((h) =>
        (h.includes('compra') && (h.includes('s/') || h.includes('soles') || h.includes('/s'))) ||
        h === 'precio_compra_soles' ||
        h.includes('precio compra')
      );
      const colVenta = headers.findIndex((h) =>
        (h.includes('venta') && (h.includes('s/') || h.includes('soles') || h.includes('/s'))) ||
        h === 'precio_venta_soles' ||
        h.includes('precio venta')
      );

      const parsed: ExcelItem[] = [];

      for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0) continue;

        const cod = colCodigo !== -1 && row[colCodigo] ? String(row[colCodigo]).trim() : '';
        const prod = colProducto !== -1 && row[colProducto] ? String(row[colProducto]).trim().replace(/\t/g, ' ') : '';

        if (!cod && !prod) continue;

        const rawStock = colStock !== -1 ? parseFloat(row[colStock]) : 0;
        const rawCompra = colCompra !== -1 ? parseFloat(row[colCompra]) : 0;
        const rawVenta = colVenta !== -1 ? parseFloat(row[colVenta]) : 0;

        parsed.push({
          id: `${i}-${cod}`,
          codigo: cod || `Prod-${i}`,
          name: prod || 'Sin nombre',
          stock: isNaN(rawStock) ? 0 : rawStock,
          precioCompra: isNaN(rawCompra) ? 0 : Number(rawCompra.toFixed(2)),
          precioVenta: isNaN(rawVenta) ? 0 : Number(rawVenta.toFixed(2)),
        });
      }

      setItems(parsed);
    } catch (err) {
      console.error(err);
      alert('Error al procesar el archivo Excel. Asegúrate de que sea .xlsx.');
    }
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Tu navegador no soporta búsqueda por voz. Prueba en Google Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-PE';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
    };

    recognition.start();
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.codigo.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Carga del Excel */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Consulta Rápida de Inventario (Excel)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualiza código, stock, costo de compra y precio de venta en soles.
            </p>
          </div>

          <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm self-start sm:self-auto">
            <Upload className="w-4 h-4" />
            <span>{fileName ? 'Reemplazar Excel' : 'Subir Archivo Excel'}</span>
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {fileName && (
          <div className="mt-3 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{fileName} ({items.length} productos detectados)</span>
          </div>
        )}
      </div>

      {/* Buscador por Voz y Texto */}
      {items.length > 0 && (
        <div className="relative w-full">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Buscar por código ("Prod00278") o producto ("laptop ryzen")...'
            className="w-full pl-11 pr-20 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm placeholder:text-slate-400"
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {hasSpeechSupport && (
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`p-2 rounded-xl transition ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'
                }`}
                title={isListening ? 'Escuchando tu voz...' : 'Buscar por voz'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tarjetas con Código, Stock, Compra y Venta */}
      {items.length > 0 ? (
        <div>
          <div className="text-xs font-semibold text-slate-400 mb-3">
            Mostrando {filteredItems.length} de {items.length} productos
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-200 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 tracking-wider">
                      {item.codigo}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        Number(item.stock) > 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      Stock: {item.stock}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 mb-3">
                    {item.name}
                  </h3>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Precio Compra:</span>
                    <span className="font-semibold text-slate-700">S/ {item.precioCompra.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">Precio Venta:</span>
                    <span className="font-black text-emerald-600 text-base">S/ {item.precioVenta.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-bold text-base">Ningún archivo Excel cargado</p>
          <p className="text-slate-400 text-xs mt-1">
            Sube el archivo para consultar al instante los precios y stock de tu inventario.
          </p>
        </div>
      )}
    </div>
  );
};