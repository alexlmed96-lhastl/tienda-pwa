export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
  barcode?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CatalogItem {
  id: string;
  title: string;
  pdfUrl: string;       // Enlace a Heyzine o ruta al PDF local (ej. '/catalogos/marzo.pdf')
  isFlipbook?: boolean; // true si es enlace de Heyzine, false si es PDF normal
  coverImage?: string;
}