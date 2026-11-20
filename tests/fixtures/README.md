# Test fixture attribution

astronaut.png is the NASA astronaut Eileen Collins portrait distributed by scikit-image v0.22.0. NASA-origin image, public domain; used only for local portrait-matting verification. Source: https://raw.githubusercontent.com/scikit-image/scikit-image/v0.22.0/skimage/data/astronaut.png . scikit-image data documentation: https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.astronaut . Not a model-quality benchmark or endorsement.

## General-object photographs

The JPEG files in objects/ were downloaded from images.unsplash.com under the [Unsplash License](https://unsplash.com/license) for local QA. Original photo identifiers and request settings are recorded in objects/sources.json and scripts/setup-object-fixtures.mjs. They are photographs, not AI-generated test shapes; they are not model-training data or pixel-accurate ground-truth masks. Jewelry shows jewelry worn by a person, and bottle is opaque. The plain-watch photograph contains two watches and is also used for separate-subject selection. The exact user-supplied failing watch was not available. Preserve this attribution when copying fixtures.
