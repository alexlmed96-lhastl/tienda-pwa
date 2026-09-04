export const STORE_CONFIG = {
  name: 'Tienda de Tecnología',
  city: 'Cusco, Perú',
  address: 'Cusco - Centro / Tienda Física',
  whatsappNumber: '51935238750', // Reemplaza con tu número de WhatsApp comercial (con código 51)
  whatsappMessageGreeting: '👋 ¡Hola! Deseo consultar/realizar el siguiente pedido:',
  
  // Datos que salen en la Cotización PDF y en el checkout
  paymentInfo: {
    yapePlin: 'A nombre de la tienda al WhatsApp oficial',
    bcpAccount: 'Solicitar cuenta corriente/ahorros BCP al confirmar',
    cci: 'Disponible para transferencias interbancarias',
  },

  warranty: {
    laptops: '12 meses de garantía oficial',
    components: '6 a 12 meses según fabricante',
    peripherals: '3 a 6 meses de garantía',
  }
};