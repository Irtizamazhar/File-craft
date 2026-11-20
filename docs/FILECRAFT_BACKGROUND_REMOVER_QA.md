# FileCraft background remover: implementation and final QA

Completion: 19 November 2026, Asia/Karachi. Main production-build/browser run completed 18 November; interrupted color verification was recovered intact, and remaining detail/diagnostic/read-only checks finished 19 November. Existing project and uncommitted work were preserved. No push, deployment, destructive operation or MySQL record mutation was performed for this background-remover verification.

## Outcome and remaining blockers

BiRefNet Lite 512 general-object segmentation is the default. The smaller portrait-only MODNet remains an explicit optional mode. Three real watch photographs and the other positive fixtures retain sampled subject regions while background samples become transparent. Automatic quality is PARTIALLY WORKING, not universal or production-certified: the purple-lit laptop fails, and small watch strap holes need manual correction.

Final production browser run: **220 passed, 2 failed, 0 skipped, 0 flaky**. Both failed tests are the same laptop quality assertion on desktop/mobile Chromium. The assertions and failed evidence remain in the repository/artifacts. None was removed, hidden or marked as an expected pass.

## Exact cause and processing changes

The previous default was MODNet, trained for portrait matting. Its task does not cover arbitrary products such as watches. Existing RGB order, portrait normalization and source-alpha multiplication matched MODNet; no global foreground/background inversion was established. The mismatch was model suitability, rather than a CSS or globally inverted-alpha problem.

The new model contract uses RGB NCHW float32 [1,3,512,512], rescaling by 1/255 and ImageNet mean [0.485,0.456,0.406]/standard deviation [0.229,0.224,0.225]. Its single-channel logits require sigmoid to obtain foreground alpha. Portrait mode keeps its separate [-1,1] contract. Shape/type/nonfinite output guards reject invalid masks. Flat predictions retain the previous mask and show an error. No automatic inversion is applied.

Inference follows the export's square-resize contract; the predicted mask is bilinearly restored to the original decoded dimensions. Original image RGB is retained separately. The browser's default image decoding handles image orientation; no new dedicated EXIF fixture was added. Preview and PNG export use the same corrected mask through composeCutout; comparison overlays affect only preview. Original source transparency multiplies the editable mask, preventing restoration of pixels outside an already-transparent source.

## Model selection and licensing

Selected weights: Studio Ludens export **studioludens/birefnet-lite-512**, float32, based on ZhengPeng7/BiRefNet_lite. Both the export publisher's explicit weights license and upstream model declaration are MIT. Copyright/permission notices are retained in public/licenses/BiRefNet-Lite-MIT.txt and the model card is preserved beside it. No paid API or noncommercial-only model was integrated.

- [Export model card and explicit weights license](https://huggingface.co/studioludens/birefnet-lite-512).
- [Upstream weights declaration](https://huggingface.co/ZhengPeng7/BiRefNet_lite).
- [Upstream MIT code license](https://github.com/ZhengPeng7/BiRefNet/blob/main/LICENSE).

The 512 export was selected for general foreground segmentation and browser feasibility. The publisher reports memory problems with the 1024 browser variants; the lower resolution still limits tiny details. ISNet general-use was considered, but was not integrated or benchmarked here; no superiority claim is made. MODNet alone cannot address the product task. No server GPU, Docker or additional runtime dependency was introduced. License declarations and notices were checked; this is not an independent legal opinion about all training images or third-party rights.

Pinned revision: 962e67969ec6acec9c19fab76acee4f5e22e990c.
Model bytes: 191,877,254.
SHA-256: 1cb0fb360dadd15af77c639085d77a9df67db0c64315560c3de005f676345ac2.

## Real-image evidence

Each survey case loads a photograph, performs actual inference, exports/downloads PNG, decodes it, checks original dimensions and genuine RGBA alpha, then samples manually chosen foreground/background landmarks. Desktop and mobile Chromium produced the same landmark values. Sampling does not establish pixel-perfect masks or benchmark IoU.

| Fixture | Dimensions | Foreground alpha samples | Background alpha samples | Result on both profiles |
| --- | --- | --- | --- | --- |
| watch | 720 x 523 | 255, 255, 255, 255 | 0, 0 | PASS sampled landmarks |
| watch-complex | 720 x 1079 | 255, 255, 255 | 0, 0 | PASS sampled landmarks |
| watch-dark | 720 x 1080 | 255, 255, 255 | 0, 0 | PASS sampled landmarks |
| shoes | 720 x 480 | 255, 255, 255 | 0, 0 | PASS sampled landmarks |
| bag | 720 x 960 | 255, 255 | 0, 0 | PASS sampled landmarks |
| jewelry | 720 x 1079 | 255, 255, 255 | 0 | PASS sampled landmarks |
| bottle | 720 x 1080 | 255, 255, 255 | 0, 0 | PASS sampled landmarks |
| headphones | 720 x 480 | 255, 255, 255 | 0, 0 | PASS sampled landmarks |
| electronics | 720 x 576 | 0, 0 | 0, 0 | FAIL: missing laptop foreground |
| furniture | 720 x 900 | 255, 255, 255 | 0, 0 | PASS sampled landmarks |
| animal | 720 x 960 | 255, 255 | 0, 0 | PASS sampled landmarks |
| portrait | 512 x 512 | 255, 255 | 0, 0 | PASS sampled landmarks |

Thus 11 of 12 fixture cases pass sampled checks per profile (22/24 across profiles). Jewelry shows a person wearing jewelry: it verifies preservation of that subject, not extraction of jewelry alone. The bottle is opaque; transparent glass is not verified. The plain watch photograph contains two watches and also exercises separate-region selection. The dark-watch fixture has a dark dial/metal case on dark surroundings; the complex-watch fixture includes reflections. This is not comprehensive coverage of every watch, hair type, animal, garment, metal or lighting condition. The exact original failing user watch image was not available, so no exact-file regression claim is made.

Inputs are real Unsplash photographs with identifiers in tests/fixtures/objects/sources.json, plus the existing NASA astronaut fixture. Attribution and limitations are recorded in tests/fixtures/README.md. [Unsplash license](https://unsplash.com/license).

Evidence: [desktop watch workspace](../artifacts/object-removal/final-watch-1440.png), [mobile workspace](../artifacts/object-removal/final-watch-390.png), [watch PNG](../artifacts/object-removal/watch-chromium.png), [dark watch PNG](../artifacts/object-removal/watch-dark-chromium.png), [handbag PNG](../artifacts/object-removal/bag-chromium.png), [failed laptop PNG](../artifacts/object-removal/electronics-chromium.png). Every survey also has an original fixture, output PNG and workspace screenshot under artifacts/object-removal/.

## RGB, alpha and fine details

The interrupted color-verification command completed and wrote artifacts/object-removal/color-verification.json. It was inspected rather than unnecessarily rerun. Across 602,957 fully opaque output pixels in plain watch, dark watch, shoes, bag and portrait, maximum RGB channel difference from the browser-decoded original was **0**. This checks preserved opaque colors, not all partially transparent edge pixels or every fixture.

All survey PNGs decode at their source dimensions and have RGBA PNG color type 6; foreground/background alpha samples are listed above. Existing before/after tests establish that comparison is not baked into export. Fine hair/edges and translucent pixels remain model-dependent.

Three sampled strap-hole coordinates (519,308), (499,325) and (245,336) have automatic alpha **255**. They were not correctly cleared automatically. This limitation remains documented even though the case/dial/strap landmarks pass.

A real editor/export check erased the hole at (245,336) with the smallest hard brush: exported RGBA became [0,0,0,0]. Neighboring strap (245,345) remained [221,221,221,255], dial (360,230) remained [36,36,36,255], and outer background (20,20) remained [0,0,0,0]. Output: [manually corrected hole PNG](../artifacts/object-removal/watch-hole-manual.png). This verifies manual precision and exported alpha; it does not claim automatic hole recovery. Strong halos, fine jewelry holes, translucent materials and edge-color decontamination are not universally solved.

## Laptop investigation

The purple-lit close-up laptop loses substantial foreground: both original surveyed laptop landmarks have alpha 0. Other objects, including headphones, pass with the same normalization, tensor layout, sigmoid and compositor. The retained decoded RGB is correct wherever fully opaque. Evidence supports a scene/model segmentation failure, not a general mask inversion.

Targeted orientation retries used the existing rotation controls and actual inference without changing application defaults: 90 degrees produced no clear foreground and was rejected by the flat-mask guard; 180 degrees still returned alpha 0 at all four sampled laptop foreground locations. Results are in artifacts/object-removal/final-detail-verification.json. Orientation retry is not promoted as a reliable fix.

The existing mask heuristics also miss the original laptop failure: approximately 13.05% clear foreground, 82.04% background, one major region, needsReview=false on the exported/resampled mask. These are geometric diagnostics, not calibrated semantic confidence. They can flag flat/fragmented/multiple-region results, but cannot certify that the intended subject was kept. The UI always labels the result as an estimate to review; manually restore/erase failed regions or use another photograph. A reliable automatic repair would require a validated stronger/interactive model or additional prompting work. That work is not claimed complete.

## Editor and performance

Implemented/preserved: original image at left, fitted checkerboard preview at center, controls at right; responsive stacking; general/portrait selection; real streamed model-download progress; retained worker/session between uploads; best-effort Cache Storage; cancel/timeout/worker-memory errors; click-to-keep a detected connected region; erase/restore; brush size/hardness and continuous strokes; feathering/edge contrast; zoom/pan; six-state undo/redo; before/after; reset; custom/solid/transparent backgrounds; crop/resize/rotation; PNG export.

Click selection acts on a detected connected region. It does not run a promptable object model and cannot recover absent regions. Disconnected straps/parts may need Restore; touching objects may need Erase first. Brush coordinates map display position back into source-image coordinates at each zoom. Default preview fits its panel, with zoom relative to fit.

Desktop/mobile integration tests verify selecting one of two watches, undo/redo, soft erasure at zoom, restoration, edge controls, reset, source-transparency preservation and cached loading after reload. Existing portrait tests also cover custom background, pan, comparison and image transforms. Loaded-editor overflow checks pass at 360, 390, 768, 1024 and 1440 pixels; broader existing responsiveness/axe checks remain included.

Latest survey timings on this Windows machine: desktop inference 6.8?10.0 seconds (first total 14.5 seconds), mobile-emulated Chromium inference 6.8?7.6 seconds (first total 10.8 seconds). Earlier cold/contended runs took up to roughly 28 seconds for inference and 33 seconds total. These are local measurements, not a physical-phone benchmark or network-download SLA. Browser tests verify one model request across repeated uploads/reload when caching is available. Cache quota failures fall back to loading; assets are served locally and images are not sent to an AI service.

First use requires about 192 MB weights plus the existing approximately 15 MB WASM runtime. WASM intermediate memory exceeds model file size; peak RAM was not measured. Low-memory devices may fail or be slow. Input remains 15 MB/4 megapixels. Images retain decoded dimensions unless the user transforms them.

## Checks and database preservation

- TypeScript, ESLint and production build passed after the final application changes. Build produces 87 prerendered pages and validates both model checksums/notices. No application change was made during this final documentation continuation.
- Unit tests: 24 passed, including five normalization/mask/brush/edge tests.
- Final production Chromium run: 220 passed, 2 failed, zero skipped/flaky. Machine-readable result: artifacts/object-removal/final-all-results.json. Exit code is nonzero because of the retained laptop assertions.
- All 48 original tools: 96 real-file workflow cases passed across desktop/mobile profiles. PDF original-object editing, compressor outputs, directory/SEO routes and responsive UI checks passed in that run.
- Anonymous authorization, plans and live health were checked with GET requests. Health returns 200/mysql=true. Anonymous auth/me returns null, admin stats rejects with 403 and activity with 401.
- Real database SELECT 1 and required table/index inventories passed again on 19 November. Existing tables: users, sessions, activity, contact_messages, subscription_plans, subscriptions. No schema change or data mutation was needed.
- Four signup/contact cases were excluded from this run because they write records. Auth/account mutation regression was not rerun under the current no-record-modification instruction. Earlier authenticated lifecycle evidence remains historical; no new claim of full authenticated-flow verification is made. Auth/database implementation files were not changed by this background-remover work.
- Firefox/WebKit remain unverified here due previously reported Windows runtime dependencies. No new universal browser-support claim.

## Exact changed files for this background-remover work

This lists the feature's changes across the interrupted background-remover turns. Earlier unrelated uncommitted FileCraft work remains preserved; its broader inventory is in the previous advanced-upgrade report. Generated QA evidence under artifacts/ is Git-ignored.

- .gitignore
- README.md
- package.json
- app/advanced.css
- app/remove-background/page.tsx
- components/BackgroundRemover.tsx
- lib/directory.ts
- lib/advanced/segmentation.ts
- lib/advanced/mask-editor.ts
- workers/background.worker.ts
- scripts/copy-advanced-engines.mjs
- scripts/setup-object-model.mjs
- scripts/setup-object-fixtures.mjs
- scripts/probe-object-model.mjs
- scripts/capture-object-remover.mjs
- scripts/capture-advanced.mjs
- scripts/verify-mask-details.mjs
- tests/segmentation.test.mjs
- tests/browser/background-objects.spec.ts
- tests/browser/background-refinement.spec.ts
- tests/browser/advanced.spec.ts
- tests/browser/advanced-interactions.spec.ts
- tests/browser/advanced-extra.spec.ts
- tests/fixtures/README.md
- tests/fixtures/objects/sources.json
- tests/fixtures/objects/animal.jpg
- tests/fixtures/objects/bag.jpg
- tests/fixtures/objects/bottle.jpg
- tests/fixtures/objects/electronics.jpg
- tests/fixtures/objects/furniture.jpg
- tests/fixtures/objects/headphones.jpg
- tests/fixtures/objects/jewelry.jpg
- tests/fixtures/objects/shoes.jpg
- tests/fixtures/objects/watch-complex.jpg
- tests/fixtures/objects/watch-dark.jpg
- tests/fixtures/objects/watch.jpg
- public/licenses/BiRefNet-Lite-MIT.txt
- public/licenses/BiRefNet-Lite-model-card.md
- public/models/birefnet-lite-512.onnx (local, Git-ignored)
- docs/FILECRAFT_ALL_TOOLS_ADVANCED_UPGRADE.md
- docs/FILECRAFT_BACKGROUND_REMOVER_QA.md

## Setup, startup and production readiness

The model and notices are already available in this local workspace. Start the existing website with:

~~~powershell
npm.cmd run dev
~~~

Open http://localhost:3000. Keep the existing private .env.local pointing to filecraft; no database initialization/reset is required. For a fresh checkout, the 192 MB model is deliberately Git-ignored; run node scripts/setup-object-model.mjs before installation/build. The setup script fetches pinned weights/notices and verifies the published SHA-256. Build/postinstall copy local runtime assets and validate weights without model downloads. Test fixtures are present locally; scripts/setup-object-fixtures.mjs records the reviewed fixture sources.

Production locally: npm.cmd run build, then npm.cmd start. Browser QA used an isolated next start -p 3101 process with TEST_BASE_URL=http://localhost:3101. scripts/verify-mask-details.mjs can repeat the detail checks; --laptop-only runs only the orientation diagnostics. Do not run account/contact-writing test suites against this database under the current instruction.

Full production readiness is **not established**. Laptop quality, automatic fine-hole recovery and reliable failure detection remain blockers for broad professional-quality claims. Hostinger compatibility is architectural only: a Node-supported Next.js host serves large static model/WASM assets while inference uses the visitor's CPU. Actual host bandwidth, memory limits, static-file delivery/caching and real low-end phones have not been validated, and nothing was deployed. Previously reported dependency audit findings (one high, eight moderate) remain unresolved; the audit was not repeated in this continuation. No paid API, public launch, Git push or production activation was performed.
