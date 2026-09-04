import React, { useState } from 'react';
import { BookOpen, ExternalLink, FileText, X } from 'lucide-react';
import type { CatalogItem } from '../types';

interface CatalogViewerProps {
  catalogs: CatalogItem[];
}

export const CatalogViewer: React.FC<CatalogViewerProps> = ({ catalogs }) => {
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogItem | null>(null);

  if (catalogs.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-700 font-bold text-base">No hay catálogos disponibles</p>
        <p className="text-slate-400 text-xs mt-1">Sube un folleto PDF desde el panel de administración.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {catalogs.map((catalog) => (
          <div
            key={catalog.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group"
          >
            <div className="h-44 bg-gradient-to-br from-blue-900 to-slate-900 flex flex-col items-center justify-center p-6 text-white text-center relative">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition duration-300">
                <FileText className="w-7 h-7 text-blue-400" />
              </div>
              <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
                {catalog.isFlipbook ? 'Revista Interactiva' : 'Folleto PDF'}
              </span>
            </div>

            <div className="p-5 flex flex-col flex-1 justify-between">
              <h3 className="font-bold text-slate-900 text-base mb-4 line-clamp-2">
                {catalog.title}
              </h3>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCatalog(catalog)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Ver en Pantalla</span>
                </button>
                <a
                  href={catalog.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 transition"
                  title="Abrir en pestaña nueva"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal visor interactivo */}
      {selectedCatalog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-slate-900 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden shadow-2xl relative border border-slate-800">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950 text-white">
              <h3 className="font-bold text-sm truncate pr-4">{selectedCatalog.title}</h3>
              <button
                onClick={() => setSelectedCatalog(null)}
                className="p-1.5 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 w-full bg-slate-800">
              <iframe
                src={selectedCatalog.pdfUrl}
                title={selectedCatalog.title}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};