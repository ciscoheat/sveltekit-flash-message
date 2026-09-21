---
name: "Clipper CSS"
applyTo: "**/*.html,**/*.astro,**/*.svelte,**/*.css,**/*.scss"
description: "Implement Clipper pages with semantic structure, Tailwind utilities, and token-owned shared styles."
---

# Clipper CSS

Use Clipper's **semantic first** order: semantic HTML, then Clipper utilities, then Tailwind utilities, then a reusable component only for a repeated generic UI contract. Prefer Clipper's simpler semantic utility whenever it can express the design. Keep each decision in its owning layer.

## Contract

Read the installed `variables.css`, `components.css`, and `clipper.css` before editing. They show the project's current tokens, primitives, and framework behavior. Keep source-specific composition in the route; set shared palette, type, scale, page measurements, radii, and focus colors in `variables.css`; put only repeated generic primitives in `components.css`. Leave `clipper.css` unchanged unless updating the framework itself.

Use static Clipper utilities first and Tailwind utility classes second for every layout and visual treatment. Don't add a CSS `style` attribute unless all other options are exhausted; express the result with classes, a CSS custom property defined in the owning stylesheet, or a reusable component when necessary.

## Structure

- Build from semantic landmarks with `section` as the direct child of `main` for each page band. Use real controls and heading levels; add headers and footers when the page calls for them.
- A `section` supplies page-width placement, fluid block padding, and vertical rhythm. Ordinary content belongs directly inside it. Use `full-width` for a true breakout, especially a full-bleed hero, and a `page-width` child for bounded hero content.
- `div`, `nav`, and lists are column flex layouts by default. Do not add `flex` to restate that default. Add `row` for every horizontal peer group; do not use Tailwind flex-direction utilities to create rows. Use explicit grid columns only for a mapped grid. Use `readable` for long-form text and `min-w-0` on text-bearing children that must shrink.
- Use `header-sticky` only for a sticky source header. Give anchor targets an `id`.

## Tokens

- Use `variables.css` to define semantic colors such as `background`, `foreground`, `muted`, `accent`, `border`, `link`, and primary variants. Keep light and dark values intentional. Add source-specific band, surface, border, outline, and text-role tokens when the design needs them.
- Configure `--max-page-width`, font families, and the fluid type and spacing scale from the design. The scale provides `text-xs` through `text-xl`, `text-2xl` through `text-6xl`, and spacing utilities from `4xs` through `4xl`.
- Use shared `.btn`, `.card`, and `.badge` contracts only when they recur. Compose any established component library in its own theming layer.

## Verification

Check the smallest and largest supported viewports, both color schemes when shared color tokens change, keyboard focus, text wrapping, and overflow. Run the relevant build or test command.

For a supplied website conversion, follow the `clipper-convert-website` skill. Its evidence map controls source matching, token extraction, responsive geometry, borders, type, and screenshot verification.
