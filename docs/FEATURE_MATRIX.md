# Conversion feature matrix

- Browser-routed source implementations: **48**.
- Real browser execution not independently tested in this build environment.
- Runtime support depends on browser, input document and package installation.
- A code route does not guarantee an acceptable or exact-format conversion.

| Tool | Code path | Test status |
|---|---|---|
| Merge PDF (`merge-pdf`) | Browser engine | Not independently runtime-verified |
| Split PDF (`split-pdf`) | Browser engine | Not independently runtime-verified |
| Compress PDF (`compress-pdf`) | Browser engine | Not independently runtime-verified |
| Rotate PDF (`rotate-pdf`) | Browser engine | Not independently runtime-verified |
| Extract pages (`extract-pdf-pages`) | Browser engine | Not independently runtime-verified |
| Delete pages (`delete-pdf-pages`) | Browser engine | Not independently runtime-verified |
| Page numbers (`add-page-numbers`) | Browser engine | Not independently runtime-verified |
| Watermark PDF (`watermark-pdf`) | Browser engine | Not independently runtime-verified |
| Crop PDF (`crop-pdf`) | Browser engine | Not independently runtime-verified |
| Grayscale PDF (`grayscale-pdf`) | Browser engine | Not independently runtime-verified |
| PDF to TXT (`pdf-to-text`) | Browser engine | Not independently runtime-verified |
| TXT to PDF (`text-to-pdf`) | Browser engine | Not independently runtime-verified |
| PDF to JPG (`pdf-to-jpg`) | Browser engine | Not independently runtime-verified |
| PDF to PNG (`pdf-to-png`) | Browser engine | Not independently runtime-verified |
| JPG to PDF (`jpg-to-pdf`) | Browser engine | Not independently runtime-verified |
| PNG to PDF (`png-to-pdf`) | Browser engine | Not independently runtime-verified |
| PDF to Word (`pdf-to-word`) | Browser engine | Not independently runtime-verified |
| PDF to Excel (`pdf-to-excel`) | Browser engine | Not independently runtime-verified |
| PDF to PowerPoint (`pdf-to-powerpoint`) | Browser engine | Not independently runtime-verified |
| Repair PDF (`repair-pdf`) | Browser engine | Not independently runtime-verified |
| Flatten PDF (`flatten-pdf`) | Browser engine | Not independently runtime-verified |
| Edit PDF metadata (`pdf-metadata`) | Browser engine | Not independently runtime-verified |
| Remove blank pages (`remove-blank-pages`) | Browser engine | Not independently runtime-verified |
| Add blank page (`add-blank-pages`) | Browser engine | Not independently runtime-verified |
| Compare PDFs (`compare-pdf`) | Browser engine | Not independently runtime-verified |
| Fill PDF form (`fill-pdf-form`) | Browser engine | Not independently runtime-verified |
| Word to PDF (`docx-to-pdf`) | Browser engine | Not independently runtime-verified |
| Word to TXT (`docx-to-txt`) | Browser engine | Not independently runtime-verified |
| TXT to Word (`txt-to-docx`) | Browser engine | Not independently runtime-verified |
| Word to HTML (`docx-to-html`) | Browser engine | Not independently runtime-verified |
| HTML to Word (`html-to-docx`) | Browser engine | Not independently runtime-verified |
| Merge Word files (`merge-docx`) | Browser engine | Not independently runtime-verified |
| Excel to PDF (`xlsx-to-pdf`) | Browser engine | Not independently runtime-verified |
| CSV to Excel (`csv-to-xlsx`) | Browser engine | Not independently runtime-verified |
| Excel to CSV (`xlsx-to-csv`) | Browser engine | Not independently runtime-verified |
| Excel to HTML (`xlsx-to-html`) | Browser engine | Not independently runtime-verified |
| Slides to TXT (`pptx-to-txt`) | Browser engine | Not independently runtime-verified |
| Images to slides (`images-to-pptx`) | Browser engine | Not independently runtime-verified |
| JPG to PNG (`jpg-to-png`) | Browser engine | Not independently runtime-verified |
| PNG to JPG (`png-to-jpg`) | Browser engine | Not independently runtime-verified |
| WEBP to JPG (`webp-to-jpg`) | Browser engine | Not independently runtime-verified |
| JPG to WEBP (`jpg-to-webp`) | Browser engine | Not independently runtime-verified |
| PNG to WEBP (`png-to-webp`) | Browser engine | Not independently runtime-verified |
| Resize image (`resize-image`) | Browser engine | Not independently runtime-verified |
| Rotate image (`rotate-image`) | Browser engine | Not independently runtime-verified |
| Compress image (`compress-image`) | Browser engine | Not independently runtime-verified |
| Remove image metadata (`strip-image-metadata`) | Browser engine | Not independently runtime-verified |
| Images to PDF (`image-to-pdf`) | Browser engine | Not independently runtime-verified |

## Requested tools deliberately deferred

| Tool | Reason |
|---|---|
| Protect PDF (`protect-pdf`) | Requires capability beyond the current browser-only conversion stack (or secure specialized PDF encryption/OCR). |
| Unlock PDF (`unlock-pdf`) | Requires capability beyond the current browser-only conversion stack (or secure specialized PDF encryption/OCR). |
| Extract PDF images (`extract-pdf-images`) | Requires capability beyond the current browser-only conversion stack (or secure specialized PDF encryption/OCR). |
| OCR PDF (`ocr-pdf`) | Requires capability beyond the current browser-only conversion stack (or secure specialized PDF encryption/OCR). |
| Slides to PDF (`pptx-to-pdf`) | Requires capability beyond the current browser-only conversion stack (or secure specialized PDF encryption/OCR). |
| Slides to PNG (`pptx-to-images`) | Requires capability beyond the current browser-only conversion stack (or secure specialized PDF encryption/OCR). |

Important known limitations:
- PDF → Word gives editable selectable text, not original layout.
- PDF → Excel uses basic text spacing heuristics, not structured table reconstruction.
- PDF → PowerPoint generates image-based slides, not editable text.
- Excel → PDF and DOCX → PDF use simplified text exports; not desktop-grade rendering.
- Compression may rasterize pages and lose selectable text; if output is not smaller, it rejects the operation.
- On-device PDF image rendering is capped at 30 pages.
- PDF form filling only supports standard named text fields.
- Any sensitive/critical output should be manually inspected.