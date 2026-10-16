# Offline Catalog Page

`scripts/build-souls-page.mjs` builds the whole catalog into a single HTML file that opens without a server and without a network connection. Use it to read the souls in a browser, to hand the collection to someone who is not going to clone the repository, or to review a set of souls side by side.

## Build it

Requires Node.js. There is nothing to install.

```bash
node scripts/build-souls-page.mjs
```

The page is written to `dist/souls.html`, which is ignored by git. Open it directly:

```bash
open dist/souls.html          # macOS
xdg-open dist/souls.html      # Linux
```

To build from another catalog that follows the same layout, pass its path:

```bash
node scripts/build-souls-page.mjs --root /path/to/another/catalog
REPO_PATH=/path/to/another/catalog node scripts/build-souls-page.mjs
```

The build prints the number of souls and groups it found. A sudden drop in either number means a file moved out of a location the script recognises, which is `templates/` and the `souls/by-*` and `souls/examples` directories.

## What the page gives you

- Navigation by all five dimensions, plus the starter examples and the templates, colour coded by dimension.
- Search across the full text of every soul, not just names and headings, with the matching passage shown and linked to the section it came from.
- A link for any section of any soul, so a review comment can point at one passage.
- Light and dark themes that follow the system setting until you choose one.
- A print stylesheet, so a single soul prints as clean pages with the navigation stripped out.

## What it is not

The file carries no external assets: no CDN, no web fonts, no network requests of any kind. Everything, including the text of every soul, is inlined. Two things follow from that.

It is large, roughly 800 KB, because it contains the entire catalog.

It needs JavaScript. The souls are embedded as data and the pages are built in the browser, so the file shows a short message instead of the catalog when scripting is turned off. Read the markdown in the repository directly in that case.
