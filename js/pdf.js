// Minimal PDF writer: one full-page JPEG per page. No dependencies.
const enc = new TextEncoder();
const pdfText = (s) => String(s).replace(/[^\x20-\x7E]/g, '').replace(/[\\()]/g, (c) => `\\${c}`);

// images: [{ bytes: Uint8Array (JPEG), w, h }], page size in points.
export function jpegsToPdf(images, { width, height, title = 'Document' }) {
  const chunks = [], offsets = [];
  let offset = 0;
  const push = (x) => { const b = typeof x === 'string' ? enc.encode(x) : x; chunks.push(b); offset += b.length; };
  const obj = (id, ...parts) => { offsets[id] = offset; push(`${id} 0 obj\n`); parts.forEach(push); push('\nendobj\n'); };

  push('%PDF-1.4\n%\xC2\xB5\xC2\xB6\n');
  const n = images.length;
  const pageId = (i) => 4 + i * 3;
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`;
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, `<< /Type /Pages /Kids [${images.map((_, i) => `${pageId(i)} 0 R`).join(' ')}] /Count ${n} >>`);
  obj(3, `<< /Title (${pdfText(title)}) /Producer (Numa) /CreationDate (D:${stamp}) >>`);
  images.forEach((im, i) => {
    const p = pageId(i), c = p + 1, x = p + 2;
    const draw = `q ${width} 0 0 ${height} 0 0 cm /Im0 Do Q`;
    obj(p, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im0 ${x} 0 R >> >> /Contents ${c} 0 R >>`);
    obj(c, `<< /Length ${draw.length} >>\nstream\n${draw}\nendstream`);
    obj(x, `<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.bytes.length} >>\nstream\n`, im.bytes, '\nendstream');
  });
  const size = 4 + n * 3, xref = offset;
  push(`xref\n0 ${size}\n0000000000 65535 f \n`);
  for (let id = 1; id < size; id++) push(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`);
  push(`trailer\n<< /Size ${size} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(chunks, { type: 'application/pdf' });
}
