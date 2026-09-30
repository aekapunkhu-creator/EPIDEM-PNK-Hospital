/**
 * Utility for isolated document printing and PDF saving
 * Ensures crisp typography, isolated styles, no iframe blockage, and zero layout leakage.
 */

export interface PrintOptions {
  title?: string;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
}

/**
 * Prints an HTML element by creating an isolated hidden iframe,
 * injecting all current page stylesheets + Tailwind styles, and triggering print.
 */
export function printElementIsolated(elementId: string, options: PrintOptions = {}): boolean {
  const targetElement = document.getElementById(elementId);
  if (!targetElement) {
    console.error(`printElementIsolated: Element with id "${elementId}" not found`);
    // Fallback to normal window print
    window.print();
    return false;
  }

  try {
    options.onBeforePrint?.();

    // 1. Collect all active stylesheets and style tags
    const styleNodes = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
    let stylesHtml = '';

    styleNodes.forEach(node => {
      stylesHtml += node.outerHTML;
    });

    // Additional print reset and typography styles
    const printResetCss = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Prompt:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
        
        @page {
          size: A4 portrait;
          margin: 8mm 10mm;
        }

        *, *::before, *::after {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        html, body {
          background-color: #ffffff !important;
          color: #0f172a !important;
          font-family: 'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          -webkit-font-smoothing: antialiased;
        }

        .print-page {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .print-break-after-page {
          page-break-after: always;
          break-after: page;
        }

        /* Hide interactive non-printable elements */
        button, .no-print, input[type="button"] {
          display: none !important;
        }
      </style>
    `;

    // 2. Create or reuse hidden iframe
    let iframe = document.getElementById('tb-care-isolated-print-frame') as HTMLIFrameElement | null;
    if (iframe) {
      iframe.remove();
    }

    iframe = document.createElement('iframe');
    iframe.id = 'tb-care-isolated-print-frame';
    iframe.setAttribute('style', 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;z-index:-999;');
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('Unable to access print iframe document');
    }

    const documentTitle = options.title || 'แบบสอบสวนทางระบาดวิทยาผู้ป่วยวัณโรค';

    // 3. Write HTML to iframe
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html lang="th">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${documentTitle}</title>
          ${stylesHtml}
          ${printResetCss}
        </head>
        <body class="bg-white text-slate-900">
          <div id="print-root" class="w-full">
            ${targetElement.outerHTML}
          </div>
        </body>
      </html>
    `);
    iframeDoc.close();

    // 4. Trigger print once loaded
    const triggerIframePrint = () => {
      setTimeout(() => {
        try {
          iframe?.contentWindow?.focus();
          iframe?.contentWindow?.print();
          options.onAfterPrint?.();
        } catch (err) {
          console.warn('Iframe print error, falling back to window.print():', err);
          window.print();
        }
      }, 500);
    };

    if (iframe.contentWindow?.document.readyState === 'complete') {
      triggerIframePrint();
    } else {
      iframe.onload = triggerIframePrint;
    }

    return true;
  } catch (error) {
    console.error('Failed to run isolated print:', error);
    // Ultimate fallback
    window.print();
    return false;
  }
}

/**
 * Downloads the printable document as a standalone self-contained HTML/PDF file
 * that opens in any browser and can be printed/saved as PDF with 100% fidelity.
 */
export function downloadPrintDocumentAsHtml(elementId: string, filename: string, title: string = 'แบบสอบสวนโรควัณโรค') {
  const targetElement = document.getElementById(elementId);
  if (!targetElement) {
    console.error(`downloadPrintDocumentAsHtml: Element with id "${elementId}" not found`);
    return;
  }

  const styleNodes = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
  let stylesHtml = '';
  styleNodes.forEach(node => {
    stylesHtml += node.outerHTML;
  });

  const fullHtml = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Prompt:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">
  ${stylesHtml}
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    body {
      background: white !important;
      color: #0f172a !important;
      font-family: 'Prompt', sans-serif !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      margin: 0;
      padding: 20px;
    }
    @media print {
      body { padding: 0 !important; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body class="bg-white">
  <div class="no-print" style="margin-bottom: 20px; padding: 12px 18px; background: #0f172a; color: white; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; font-family: 'Prompt', sans-serif;">
    <div>
      <strong style="font-size: 14px;">📄 แบบสอบสวนทางระบาดวิทยาผู้ป่วยวัณโรค (บันทึกเป็น PDF)</strong>
      <p style="font-size: 12px; color: #94a3b8; margin: 4px 0 0 0;">กดปุ่ม "พิมพ์ / บันทึก PDF" ด้านขวา หรือกด Ctrl + P แล้วเลือกปลายทางเป็น "บันทึกเป็น PDF (Save as PDF)"</p>
    </div>
    <button onclick="window.print()" style="background: #059669; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 13px;">
      🖨️ พิมพ์ / บันทึก PDF
    </button>
  </div>
  ${targetElement.outerHTML}
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
