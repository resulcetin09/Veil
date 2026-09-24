# Veil design and interface review

Skills used: high-end-visual-design, brandkit, frontend-design, imagegen and web-design-guidelines.

## Identity

An aperture built from two inward folds conveys selective disclosure: the opening reveals only what is needed. Charcoal `#111214`, warm white `#eeeae3` and lavender `#c7baf5` repeat across the wordmark, surfaces and actions. Geist is self-hosted. Phosphor Light icons remain visually subordinate to the content. The brand-board image is an art-direction reference, not a screenshot of the implemented app.

## Interface checks

The review uses the current [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md). Key checks: semantic buttons/links, labels, native dialog focus containment and restoration, visible focus, keyboard support, reduced motion, URL-based views, bounded file parsing, responsive single-column layout, overflow and contrast.

Initial browser checks found an insufficiently contrasted footer label and a mobile-menu CSS cascade issue. Both were corrected. The accessibility test waits for the dialog entrance animation to finish before measuring contrast. Automated axe checks pass for all three main views and the wallet dialog at desktop and mobile sizes. This is automated coverage, not a claim of comprehensive accessibility certification.

## Deliberate scope

Quiet confirmation and error states take priority over constant decorative animation. No autoplay loops, tracking scripts, third-party font requests or fake live attendee counts are used. The demo’s four invitations are created locally by the actual generated contract, and its non-network nature remains visible.

## Asset provenance

Built-in image generation produced `docs/brand/veil-brand-board.png` and `public/images/veil-portal.png`. No stock assets or real-world logos were copied. Prompts are saved in `docs/brand/prompts.md`.
