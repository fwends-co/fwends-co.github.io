#!/bin/sh
# Points every page at the current site.css and site.js by content hash
# (site.css?v=1a2b3c4d), so a browser holding an older copy fetches the new one.
# GitHub Pages lets browsers cache assets for 10 minutes; without this, a visitor
# can get new HTML with an old stylesheet. Run after editing either file.
set -e
cd "$(dirname "$0")/.."
css=$(shasum assets/css/site.css | cut -c1-8)
js=$(shasum assets/js/site.js | cut -c1-8)
for page in index.html 404.html support/index.html privacy/index.html terms/index.html; do
  sed -i '' -E \
    -e "s#/assets/css/site\.css(\?v=[0-9a-f]+)?\"#/assets/css/site.css?v=$css\"#" \
    -e "s#/assets/js/site\.js(\?v=[0-9a-f]+)?\"#/assets/js/site.js?v=$js\"#" \
    "$page"
done
echo "site.css?v=$css  site.js?v=$js"
