# Visual reference and differences

Reference: https://mercury.com/command, inspected 2026-09-10.

## Observed directly in the browser

- Dark charcoal/navy page, centered hero, generous vertical negative space, understated navigation, pill actions.
- CTA computed background: rgb(82, 102, 235), `#5266eb`.
- Heading computed text: rgb(237, 237, 243), `#ededf3`.
- Section computed backgrounds included rgb(16, 16, 26), `#10101a`, and rgb(23, 23, 33), `#171721`.
- Heading font declaration: `arcadiaDisplay, "arcadiaDisplay Fallback"`.
- Multiple canvases exist in the reference DOM. In this browser the scene remained visually blank during initial and scrolled inspection. A wheel interaction timed out and a later screenshot showed a mostly empty dark section.

## Implementation choices and limits

- TIPIX uses the observed CTA and heading colors. Its base `#161620` follows the visible charcoal surface, with slightly lighter translucent preview panels.
- A system sans-serif stack replaces Mercury's proprietary typography. Font metrics are therefore different.
- Crystal appearance and formations are reconstructed from the user's written specification, not verified against a working reference animation. There is no recording or screenshot attachment available in this turn.
- The 850-desktop/320-mobile instanced octahedral fragments change between an open perimeter, ribbon, separated clusters, upward arc, and constellation as the page scrolls. Depth, lighting, and small scroll-linked glints provide shine; restrained local highlights replace a costly bloom postprocessing pass.
- GSAP controls scroll state and reversible content reveals. Three.js controls crystal placement. Pointer smoothing is independent of scroll formation. No central rotating hero object and no background video.
- The observed color/layout direction can be compared, but exact particle timing, counts, shader behavior, trajectories, and fades cannot be certified as a match until the supplied recording is available.
- TIPIX includes its own educational copy, course previews, and illustrative dashboard; no Mercury branding or financial product content is used.
