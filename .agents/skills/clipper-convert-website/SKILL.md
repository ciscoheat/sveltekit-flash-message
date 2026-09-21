---
name: clipper-convert-website
description: Convert supplied website content into an Astro or SvelteKit Clipper implementation.
disable-model-invocation: true
---

# Convert A Website To Clipper

Recreate supplied web content in Astro or SvelteKit with Clipper. The source evidence defines the result; Clipper supplies the layout and token system. Do not invent copy, imagery, controls, sections, or visual treatment.

## Workflow

Clipper is the layout authority. Route markup uses only documented Clipper classes and recorded Tailwind exceptions for source requirements Clipper cannot express. Keep shared tokens in `variables.css` and generic repeated contracts in `components.css`.

1. **Map bands.** Capture every supplied viewport, then divide the page into ordered bands: header, hero, sections, footer, separators, and breakouts. For each, record vertical span, edges, spacing, appearance, border, and the resolved source `getComputedStyle` background, foreground, and border colors for the band plus representative heading, copy, control, and repeated content. **Done when** every visible row, including shared header and footer, belongs to one band with resolved color entries.

2. **Map flow.** For each band, list direct units in source order: heading group, copy, image, control, peer group, repeated item, or breakout. Mark them vertical, `row`, or `grid`; grids require visible columns and a mapped collapse viewport. For live pages, audit DOM boxes so media-only, below-fold, and empty-label items remain counted. **Done when** every source item, destination, media asset, and repeated-item count is recorded.

3. **Build Clipper markup.** Use `header`, `main`, direct child `section` bands, and `footer` only when present. Keep ordinary section content direct; add wrappers only for a mapped row, grid, overlay, or bounded module. Use Clipper defaults for vertical flow, `row` for peers, `grid` with `*-cols-*` for mapped columns, and `full-width` with inner `page-width` for breakouts. Use semantic controls and images. Route classes are documented Clipper classes or recorded Tailwind exceptions only; do not add authored CSS classes, custom CSS, `<style>`, style attributes, or page stylesheets. Route markup also contains no `flex`, `flex-col`, `flex-row`, or `max-w-*`. **Done when** the route is the smallest Clipper expression of the map.

4. **Set fluent tokens.** Set `--max-page-width` from the largest viewport. Use Clipper's page grid, fluid spacing, `page-width`, `readable`, and responsive grid tracks for geometry and text containers. Load the exact or closest Google Font, then set fluid type scale and the resolved band, surface, foreground, border, outline, and focus colors in `variables.css`; generic repeated contracts belong in `components.css`. Apply explicit background and foreground tokens to every visible band and its mapped content roles, including header and footer. **Done when** each target token resolves to the source's recorded computed color, with no visible band or content role relying on an inherited or starter color.

5. **Verify.** At every supplied viewport and mapped breakpoint edge, compare bands and silhouette first, then content, media, controls, borders, type, colors, and peer alignment. Compare target `getComputedStyle` background, foreground, and border colors for every band and representative heading, copy, control, and repeated content against the resolved source entries; a token name or screenshot approximation is not a pass. Check font metrics, item counts, destinations, focus, and overflow. Audit route classes and styles: an authored CSS class, unrecorded Tailwind class, `flex`, `flex-col`, `flex-row`, `max-w-*`, `<style>`, style attribute, or page stylesheet fails. Compare source and target screenshots at normal zoom; a visible mismatch, missing item, transparent or inherited band, short-line wrap, or duplicate landmark fails. Run the project build. **Done when** the largest and smallest viewports match the map and every computed color check passes.

## Clipper Quick Reference

- `section` is a page-width grid band with fluid block padding and vertical gap.
- Direct children of `section`, `header`, and `footer` occupy the center page column.
- `div`, `nav`, `ul`, and similar containers default to vertical flex layout with a gap.
- `row` creates a horizontal flex group; `grid` and explicit `*-cols-*` classes create a grid.
- `full-width` breaks a direct child out of the page column; place `page-width` on its inner content when needed.
- Fluid tokens such as `gap-lg`, `py-xl`, and `mt-4xl` provide the default rhythm. Use static utilities only when the geometry map needs a specific exception.
