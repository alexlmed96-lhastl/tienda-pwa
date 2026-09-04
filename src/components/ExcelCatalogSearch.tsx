import React, { useState, useMemo, useEffect, useRef } from 'react';
import ExcelJS from 'exceljs';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '../lib/supabase';
import { 
  Search, 
  Mic, 
  MicOff, 
  Upload, 
  FileSpreadsheet, 
  X, 
  Camera, 
  TrendingUp, 
  Filter,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface ExcelItem {
  id: string;
  codigo: string;
  name: string;
  stock: number;
  precioCompra: number;
  precioVenta: number;
}

export const ExcelCatalogSearch: React.FC = () => {
  const [items, setItems] = useState<ExcelItem[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isLoadingCloud, setIsLoadingCloud] = useState(true);
  const [isUploadingCloud, setIsUploadingCloud] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Parsear el archivo Excel a partir de un ArrayBuffer
  const parseExcelBuffer = async (buffer: ArrayBuffer, name: string) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) return;

    const rawRows: any[][] = [];
    worksheet.eachRow((row) => {
      rawRows.push((row.values as any[]).slice(1));
    });

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
        stock: isNaN(rawStock) ? 0 : Math.round(rawStock),
        precioCompra: isNaN(rawCompra) ? 0 : Number(rawCompra.toFixed(2)),
        precioVenta: isNaN(rawVenta) ? 0 : Number(rawVenta.toFixed(2)),
      });
    }

    setItems(parsed);
    setFileName(name);
  };

  // Cargar automáticamente el último archivo guardado en Supabase al iniciar
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setHasSpeechSupport(true);
    }

    const loadLatestFromSupabase = async () => {
      try {
        setIsLoadingCloud(true);
        const { data, error } = await supabase
          .from('inventory_reports')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.warn('Sin reporte previo en Supabase:', error.message);
          return;
        }

        if (data?.file_url) {
          const res = await fetch(data.file_url);
          const buffer = await res.arrayBuffer();
          await parseExcelBuffer(buffer, data.file_name);
        }
      } catch (err: any) {
        console.error('Error al recuperar Excel de Supabase:', err.message);
      } finally {
        setIsLoadingCloud(false);
      }
    };

    loadLatestFromSupabase();
  }, []);

  // Escáner de código de barras
  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner(
        'reader',
        { fps: 10, qrbox: { width: 250, height: 150 } },
        false
      );
      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          setSearchQuery(decodedText.trim());
          setShowScanner(false);
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
  }, [showScanner]);

  // Manejador de subida: lee el archivo y lo persiste en el Storage de Supabase
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingCloud(true);
      const buffer = await file.arrayBuffer();
      await parseExcelBuffer(buffer, file.name);

      // Subir archivo al bucket de Supabase
      const storagePath = `inventario-actual.xlsx`;
      const { error: uploadErr } = await supabase.storage
        .from('inventario')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from('inventario')
        .getPublicUrl(storagePath);

      // Registrar o actualizar registro en la tabla inventory_reports
      await supabase.from('inventory_reports').insert([
        {
          file_name: file.name,
          file_url: urlData.publicUrl,
          total_items: items.length,
        },
      ]);
    } catch (err: any) {
      console.error(err);
      alert('Se leyó el archivo localmente, pero hubo un error al sincronizar con Supabase: ' + err.message);
    } finally {
      setIsUploadingCloud(false);
    }
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Navegador no soporta dictado por voz.');
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
      setSearchQuery(event.results[0][0].transcript);
    };

    recognition.start();
  };

  const filteredItems = useMemo(() => {
    let list = items;
    if (onlyInStock) {
      list = list.filter((it) => it.stock > 0);
    }
    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.codigo.toLowerCase().includes(q)
    );
  }, [items, searchQuery, onlyInStock]);

  return (
    <div className="space-y-6">
      {/* Cabecera de Archivo y Sincronización */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Inventario y Consulta Rápida</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sincronizado con Supabase Storage. Consulta stock, márgenes de ganancia y códigos físicos.
            </p>
          </div>

          <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm self-start sm:self-auto disabled:opacity-50">
            {isUploadingCloud ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando en Nube...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>{fileName ? 'Reemplazar Excel' : 'Subir Archivo Excel'}</span>
              </>
            )}
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileUpload}
              disabled={isUploadingCloud}
              className="hidden"
            />
          </label>
        </div>

        {isLoadingCloud ? (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            <span>Cargando reporte de inventario desde Supabase...</span>
          </div>
        ) : (
          fileName && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 border border-emerald-100">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {fileName} ({items.length} productos)
              </span>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 flex items-center gap-1">
                Guardado en Supabase Storage
              </span>
            </div>
          )
        )}
      </div>

      {/* Modal del escáner */}
      {showScanner && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-lg max-w-md mx-auto relative">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-600" />
              Escanear Código de Barras / QR
            </h3>
            <button
              onClick={() => setShowScanner(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div id="reader" className="overflow-hidden rounded-xl border border-slate-200"></div>
          <p className="text-[11px] text-slate-500 text-center mt-2">
            Apunta la cámara a la etiqueta del producto.
          </p>
        </div>
      )}

      {/* Barra de búsqueda y filtros */}
      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Buscar por código ("Prod00278") o producto ("teclado")...'
                className="w-full pl-11 pr-24 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm placeholder:text-slate-400"
              />

              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowScanner(!showScanner)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
                  title="Escanear con cámara"
                >
                  <Camera className="w-4 h-4" />
                </button>

                {hasSpeechSupport && (
                  <button
                    type="button"
                    onClick={handleVoiceSearch}
                    className={`p-1.5 rounded-xl transition ${
                      isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-emerald-600'
                    }`}
                    title={isListening ? 'Escuchando...' : 'Buscar por voz'}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {/* Switch de filtro de stock */}
            <button
              onClick={() => setOnlyInStock(!onlyInStock)}
              className={`w-full sm:w-auto px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition border ${
                onlyInStock
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Solo en Stock (&gt;0)</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 px-1 font-semibold flex justify-between">
            <span>Mostrando {filteredItems.length} de {items.length} productos</span>
            {onlyInStock && <span className="text-emerald-600 font-bold">Filtro de stock activo</span>}
          </div>
        </div>
      )}

      {/* Tarjetas de productos */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const gananciaSoles = item.precioVenta - item.precioCompra;
            const margenPct =
              item.precioVenta > 0 && item.precioCompra > 0
                ? ((gananciaSoles / item.precioVenta) * 100).toFixed(0)
                : '0';

            return (
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
                      className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        item.stock > 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : item.stock === 0
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {item.stock <= 0 && <AlertCircle className="w-3 h-3" />}
                      Stock: {item.stock}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 mb-3">
                    {item.name}
                  </h3>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Costo Compra:</span>
                    <span className="font-semibold text-slate-700">S/ {item.precioCompra.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">Precio Venta:</span>
                    <span className="font-black text-emerald-600 text-base">S/ {item.precioVenta.toFixed(2)}</span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-xl flex items-center justify-between text-xs text-slate-600 mt-1 border border-slate-100">
                    <span className="flex items-center gap-1 font-medium">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Ganancia:
                    </span>
                    <span className="font-extrabold text-blue-700">
                      S/ {gananciaSoles.toFixed(2)} ({margenPct}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        !isLoadingCloud && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 font-bold text-base">Ningún reporte guardado en la nube</p>
            <p className="text-slate-400 text-xs mt-1">
              Sube el archivo Excel una sola vez para que quede sincronizado en Supabase y accesible desde cualquier equipo.
            </p>
          </div>
        )
      )}
    </div>
  );
};