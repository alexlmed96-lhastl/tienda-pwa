import React, { useState } from 'react';
import { BookOpen, ExternalLink, X } from 'lucide-react';
import type { CatalogItem } from '../types';

interface CatalogViewerProps {
  catalogs: CatalogItem[];
}

export const CatalogViewer: React.FC<CatalogViewerProps> = ({ catalogs }) => {
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogItem | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {catalogs.map((catalog) => (
          <div
            key={catalog.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div className="p-6 bg-slate-50 flex items-center justify-center border-b border-slate-100 min-h-[160px]">
              <BookOpen className="w-16 h-16 text-blue-500 opacity-80" />
            </div>

            <div className="p-4">
              <h3 className="font-bold text-slate-900 text-base">{catalog.title}</h3>
              <p className="text-xs text-slate-500 mt-1">
                {catalog.isFlipbook ? 'Catálogo interactivo (Flipbook)' : 'Documento PDF'}
              </p>
            </div>

            <div className="p-4 pt-0">
              <button
                onClick={() => setSelectedCatalog(catalog)}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-sm font-medium transition"
              >
                <span>Ver Catálogo</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal con visor de PDF / Heyzine */}
      {selectedCatalog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800">{selectedCatalog.title}</h3>
              <button
                onClick={() => setSelectedCatalog(null)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 w-full h-full bg-slate-100">
              <iframe
                src={selectedCatalog.pdfUrl}
                title={selectedCatalog.title}
                className="w-full h-full border-0"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};