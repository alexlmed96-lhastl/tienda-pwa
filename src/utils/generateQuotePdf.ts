import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface QuoteItem {
  id?: string;
  name?: string;
  price?: number;
  quantity?: number;
  product?: {
    name?: string;
    price?: number;
  };
  [key: string]: any;
}

interface QuoteData {
  customerName: string;
  customerPhone?: string;
  items: QuoteItem[];
  total: number;
}

export const generateQuotePdf = ({ customerName, customerPhone, items, total }: QuoteData) => {
  const doc = new jsPDF();
  const quoteNumber = `COT-${Date.now().toString().slice(-6)}`;
  const today = new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Banner superior
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('COTIZACIÓN COMERCIAL', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Tecnología, Componentes y Accesorios | Cusco, Perú', 14, 26);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`N°: ${quoteNumber}`, 196, 18, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${today}`, 196, 26, { align: 'right' });

  // Datos del Cliente
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Datos del Cliente:', 14, 45);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: ${customerName || 'Cliente General'}`, 14, 52);
  if (customerPhone) {
    doc.text(`Teléfono / WhatsApp: ${customerPhone}`, 14, 58);
  }
  doc.text('Validez: 48 horas (o hasta agotar stock)', 14, customerPhone ? 64 : 58);

  // Mapeo seguro de items (soporta item.name o item.product.name)
  const tableData = items.map((item, index) => {
    const itemName = item.name || item.product?.name || 'Artículo sin nombre';
    const itemPrice = Number(item.price ?? item.product?.price ?? 0);
    const itemQty = Number(item.quantity ?? 1);
    const itemSubtotal = itemPrice * itemQty;

    return [
      index + 1,
      itemName,
      itemQty,
      `S/ ${itemPrice.toFixed(2)}`,
      `S/ ${itemSubtotal.toFixed(2)}`,
    ];
  });

  autoTable(doc, {
    startY: customerPhone ? 70 : 65,
    head: [['#', 'Producto / Descripción', 'Cant.', 'Precio Unit.', 'Importe']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 100 },
      2: { halign: 'center', cellWidth: 18 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 32 },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`TOTAL A PAGAR: S/ ${Number(total).toFixed(2)}`, 196, finalY, { align: 'right' });

  const footerY = finalY + 14;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, footerY, 196, footerY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Condiciones y Formas de Pago:', 14, footerY + 8);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('• Yape / Plin / BCP / Interbank: Disponibles para transferencias inmediatas.', 14, footerY + 14);
  doc.text('• Entregas: En tienda física en Cusco o envíos a nivel nacional (Shalom / Olva).', 14, footerY + 19);

  doc.save(`${quoteNumber}_${customerName.replace(/\s+/g, '_') || 'Cotizacion'}.pdf`);
};