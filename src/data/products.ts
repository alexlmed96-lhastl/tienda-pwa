import type { Product } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Teclado Mecánico RGB',
    description: 'Switches táctiles, retroiluminación configurable y conexión USB-C.',
    price: 180.00,
    category: 'Periféricos',
    stock: 12,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: '2',
    name: 'Mouse Inalámbrico Pro',
    description: 'Sensor óptico de alta precisión, batería de larga duración.',
    price: 120.00,
    category: 'Periféricos',
    stock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: '3',
    name: 'Auriculares Gamer 7.1',
    description: 'Cancelación pasiva de ruido y micrófono omnidireccional.',
    price: 240.00,
    category: 'Audio',
    stock: 5,
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop&q=60'
  }
];