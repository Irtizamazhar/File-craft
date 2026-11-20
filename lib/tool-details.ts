export const toolDetails:Record<string,{output:string;engine:string;purpose:string;limitation:string}>={
  "merge-pdf": {
    "output": "PDF",
    "engine": "pdf-lib",
    "purpose": "Pages are copied in file-list order. Move a file up or down before processing.",
    "limitation": "Bookmarks, signatures and cross-document form behavior may change."
  },
  "split-pdf": {
    "output": "ZIP of PDFs",
    "engine": "pdf-lib + JSZip",
    "purpose": "Each source page becomes one separately downloadable PDF inside a ZIP.",
    "limitation": "Up to 100 pages per split operation."
  },
  "compress-pdf": {
    "output": "PDF",
    "engine": "pdf-lib + PDF.js + Canvas",
    "purpose": "Structural optimization is tried before a smaller JPEG-based page copy.",
    "limitation": "Rendering removes selectable text; already compact inputs may not shrink."
  },
  "rotate-pdf": {
    "output": "PDF",
    "engine": "pdf-lib",
    "purpose": "Rotation is added to the current orientation of every page.",
    "limitation": "This affects every page; there is no selected-page rotation option."
  },
  "extract-pdf-pages": {
    "output": "PDF",
    "engine": "pdf-lib",
    "purpose": "Choose one-based page numbers or ranges, such as 1,3-5.",
    "limitation": "Selected pages are copied in the order you enter; repeated numbers are deduplicated."
  },
  "delete-pdf-pages": {
    "output": "PDF",
    "engine": "pdf-lib",
    "purpose": "Enter the page numbers to remove; all other pages retain their order.",
    "limitation": "At least one page must remain in the output."
  },
  "add-page-numbers": {
    "output": "PDF",
    "engine": "pdf-lib",
    "purpose": "Page counters are drawn near the bottom of each page.",
    "limitation": "Existing page content can overlap the counters; placement is not adjustable."
  },
  "watermark-pdf": {
    "output": "PDF",
    "engine": "pdf-lib",
    "purpose": "A translucent diagonal text mark is drawn on every page.",
    "limitation": "This is a visible label, not encryption or a copying restriction. ASCII watermark text only."
  },
  "crop-pdf": {
    "output": "PDF",
    "engine": "pdf-lib",
    "purpose": "A margin in PDF points changes the visible crop box of each page.",
    "limitation": "Cropping does not securely remove the underlying hidden document content."
  },
  "grayscale-pdf": {
    "output": "PDF",
    "engine": "PDF.js + Canvas + pdf-lib",
    "purpose": "Pages are rendered and their image pixels converted to grayscale.",
    "limitation": "Text becomes an image; output may be larger. Up to 30 pages."
  },
  "pdf-to-text": {
    "output": "TXT",
    "engine": "PDF.js",
    "purpose": "Selectable text is read from each page and arranged into text lines.",
    "limitation": "Scans need OCR, which this tool does not implement."
  },
  "text-to-pdf": {
    "output": "PDF",
    "engine": "pdf-lib",
    "purpose": "Plain text is wrapped onto PDF pages in a basic Helvetica layout.",
    "limitation": "Only Latin/ASCII text is supported; other scripts return an error."
  },
  "pdf-to-jpg": {
    "output": "JPG or ZIP",
    "engine": "PDF.js + Canvas + JSZip",
    "purpose": "Each rendered PDF page becomes a JPEG image.",
    "limitation": "Multi-page results are zipped; up to 30 pages at screen resolution."
  },
  "pdf-to-png": {
    "output": "PNG or ZIP",
    "engine": "PDF.js + Canvas + JSZip",
    "purpose": "Each rendered page becomes a PNG image with a white background.",
    "limitation": "Up to 30 pages. PNG may be much larger than the original document."
  },
  "jpg-to-pdf": {
    "output": "PDF",
    "engine": "pdf-lib",
    "purpose": "JPG images are embedded in the same order as your selection.",
    "limitation": "Image sizes are fitted to a bounded page area; this is not OCR."
  },
  "png-to-pdf": {
    "output": "PDF",
    "engine": "pdf-lib",
    "purpose": "PNG images become ordered PDF pages.",
    "limitation": "Transparent image areas may appear against the viewer background."
  },
  "pdf-to-word": {
    "output": "DOCX",
    "engine": "PDF.js + docx",
    "purpose": "Selectable PDF text becomes editable Word paragraphs.",
    "limitation": "Original layout, columns, graphics and fonts are not reconstructed."
  },
  "pdf-to-excel": {
    "output": "XLSX",
    "engine": "PDF.js + ExcelJS",
    "purpose": "Extracted text lines become worksheet rows using simple spacing heuristics.",
    "limitation": "Original tables, formulas and cell coordinates are not recovered."
  },
  "pdf-to-powerpoint": {
    "output": "PPTX",
    "engine": "PDF.js + Canvas + pptxgenjs",
    "purpose": "A rendered image of each PDF page is placed on its own slide.",
    "limitation": "Slides contain flattened page images, not editable text or charts. Up to 30 pages."
  },
  "repair-pdf": {
    "output": "PDF",
    "engine": "pdf-lib",
    "purpose": "A PDF that can be parsed is reserialized into a fresh PDF container.",
    "limitation": "This cannot recover a severely damaged or unreadable source."
  },
  "flatten-pdf": {
    "output": "PDF",
    "engine": "pdf-lib",
    "purpose": "Supported AcroForm fields are flattened into the page content.",
    "limitation": "This does not flatten every annotation or rasterize the whole document."
  },
  "pdf-metadata": {
    "output": "PDF",
    "engine": "pdf-lib",
    "purpose": "Update document title and author metadata.",
    "limitation": "This is not a complete metadata scrub and does not remove hidden personal data."
  },
  "remove-blank-pages": {
    "output": "PDF",
    "engine": "PDF.js + Canvas + pdf-lib",
    "purpose": "Low-resolution previews identify apparently blank pages; nonblank originals are retained.",
    "limitation": "Faint content can be misclassified. Inspect every result. Up to 30 pages."
  },
  "add-blank-pages": {
    "output": "PDF",
    "engine": "pdf-lib",
    "purpose": "One empty page is appended using the last page dimensions.",
    "limitation": "The insertion position and number of blank pages are not configurable."
  },
  "compare-pdf": {
    "output": "TXT report",
    "engine": "PDF.js",
    "purpose": "Selectable text lines from two PDFs are compared side by side in a report.",
    "limitation": "This is a line comparison, not a visual or semantic document comparison."
  },
  "fill-pdf-form": {
    "output": "PDF",
    "engine": "pdf-lib",
    "purpose": "Enter the exact name of an existing AcroForm text field.",
    "limitation": "Checkboxes, signatures, XFA and unknown field names are not supported."
  },
  "docx-to-pdf": {
    "output": "PDF",
    "engine": "Mammoth + pdf-lib",
    "purpose": "Extracted Word text is wrapped into basic PDF paragraphs.",
    "limitation": "Original images, print layout and styles are not preserved. ASCII text only."
  },
  "docx-to-txt": {
    "output": "TXT",
    "engine": "Mammoth",
    "purpose": "Read document paragraph text into a plain text file.",
    "limitation": "Images and rich document styling have no plain text equivalent."
  },
  "txt-to-docx": {
    "output": "DOCX",
    "engine": "docx",
    "purpose": "Each plain text line becomes an editable Word paragraph.",
    "limitation": "This creates a basic document without custom styling or page layout."
  },
  "docx-to-html": {
    "output": "HTML",
    "engine": "Mammoth + DOMParser",
    "purpose": "Word semantic content is exported to a downloadable HTML document.",
    "limitation": "Active links and unsafe attributes are filtered. Complex page layout is not reproduced."
  },
  "html-to-docx": {
    "output": "DOCX",
    "engine": "DOMParser + docx",
    "purpose": "Readable HTML text is extracted into Word paragraphs.",
    "limitation": "CSS, scripts, embedded documents and exact visual layout are not imported."
  },
  "merge-docx": {
    "output": "DOCX",
    "engine": "Mammoth + docx",
    "purpose": "Text from each selected Word file is combined in selection order.",
    "limitation": "This does not merge original graphics, numbering definitions or complex styles."
  },
  "xlsx-to-pdf": {
    "output": "PDF",
    "engine": "ExcelJS + pdf-lib",
    "purpose": "Worksheet cell values are written into a simple text PDF.",
    "limitation": "Charts, formatting and print areas are not rendered. ASCII output only."
  },
  "csv-to-xlsx": {
    "output": "XLSX",
    "engine": "ExcelJS",
    "purpose": "Quoted comma-separated rows are imported into one worksheet.",
    "limitation": "Dates and formulas are not automatically inferred; verify imported values."
  },
  "xlsx-to-csv": {
    "output": "CSV or ZIP",
    "engine": "ExcelJS + JSZip",
    "purpose": "Each worksheet is exported as comma-separated values.",
    "limitation": "Formatting and formulas are represented by stored values; uncalculated formulas may be empty."
  },
  "xlsx-to-html": {
    "output": "HTML",
    "engine": "ExcelJS",
    "purpose": "Cell values become escaped HTML table cells.",
    "limitation": "Workbook visual styling, charts and interactive formulas are not reproduced."
  },
  "pptx-to-txt": {
    "output": "TXT",
    "engine": "JSZip + DOMParser",
    "purpose": "Text runs are extracted from slides in slide-number order.",
    "limitation": "Notes, image text, embedded objects and slide graphics are not converted."
  },
  "images-to-pptx": {
    "output": "PPTX",
    "engine": "Canvas + pptxgenjs",
    "purpose": "Each selected image is fitted onto its own widescreen slide.",
    "limitation": "The images remain flattened; there is no OCR or image-to-text reconstruction."
  },
  "jpg-to-png": {
    "output": "PNG",
    "engine": "Canvas",
    "purpose": "Decode the JPEG and export its pixels in PNG format.",
    "limitation": "PNG does not recover quality lost in the original JPEG."
  },
  "png-to-jpg": {
    "output": "JPG",
    "engine": "Canvas",
    "purpose": "Export a PNG as JPEG, with transparent areas filled white.",
    "limitation": "JPEG is lossy and does not support transparency."
  },
  "webp-to-jpg": {
    "output": "JPG",
    "engine": "Canvas",
    "purpose": "Decode WebP pixels and save a JPEG with a white background.",
    "limitation": "Animation and transparency are not preserved."
  },
  "jpg-to-webp": {
    "output": "WEBP",
    "engine": "Canvas",
    "purpose": "Encode the decoded JPEG pixels as a WebP image.",
    "limitation": "Your browser must support WebP export; this cannot restore original quality."
  },
  "png-to-webp": {
    "output": "WEBP",
    "engine": "Canvas",
    "purpose": "Convert PNG pixels to a browser-encoded WebP file.",
    "limitation": "Review transparency and compression artifacts in the output."
  },
  "resize-image": {
    "output": "JPG or PNG",
    "engine": "Canvas",
    "purpose": "Downscale to a target width while keeping the original aspect ratio.",
    "limitation": "The current implementation does not upscale smaller images."
  },
  "rotate-image": {
    "output": "JPG or PNG",
    "engine": "Canvas",
    "purpose": "Rotate image pixels by 90, 180 or 270 degrees.",
    "limitation": "Output encoding can alter metadata and compression; preserve your original."
  },
  "compress-image": {
    "output": "JPG",
    "engine": "Canvas",
    "purpose": "Encode the image as JPEG using your selected quality setting.",
    "limitation": "Size reduction is not guaranteed. Transparency becomes white."
  },
  "strip-image-metadata": {
    "output": "JPG, PNG or WEBP",
    "engine": "Canvas",
    "purpose": "Re-encode decoded image pixels to discard many original metadata fields.",
    "limitation": "This is not forensic redaction; visible personal information remains in the image."
  },
  "image-to-pdf": {
    "output": "PDF",
    "engine": "Canvas + pdf-lib",
    "purpose": "Convert supported image files into ordered PDF pages.",
    "limitation": "Images remain images: text does not become selectable or searchable."
  }
};
