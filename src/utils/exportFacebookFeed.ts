import type { Product } from '../types';

export const exportToFacebookCSV = (products: Product[]) => {
  if (products.length === 0) {
    alert('No hay productos para exportar.');
    return;
  }

  // Encabezados oficiales de Meta Commerce
  const headers = ['id', 'title', 'description', 'availability', 'condition', 'price', 'link', 'image_link', 'brand'];

  const rows = products.map((p) => {
    const title = `"${(p.name || '').replace(/"/g, '""')}"`;
    const desc = `"${(p.description || p.name || '').replace(/"/g, '""')}"`;
    const availability = p.stock > 0 ? 'in stock' : 'out of stock';
    const condition = 'new';
    const price = `${p.price.toFixed(2)} PEN`;
    const link = window.location.origin;
    const imageLink = p.imageUrl;
    const brand = 'Computech'; // O el nombre de tu tienda

    return [p.id, title, desc, availability, condition, price, link, imageLink, brand].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `catalogo_meta_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};