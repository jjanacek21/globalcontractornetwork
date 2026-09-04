# Animated GCN Logo

## Scope
- Upload the supplied 15-second GCN animation to the project’s media delivery system and reference it through a lightweight asset pointer.
- Replace the static logo in both the homepage header and homepage footer with the animated version.
- Present the animation as a silent, inline, looping logo so browser autoplay works without interrupting visitors.
- Blend the black edges into the surrounding header and footer using a soft mask/fade, responsive sizing, and no visible player frame or controls.
- Keep the static logo as a loading/fallback image and provide an accessible text label.

## Technical details
- Use the original 1280×720 animation without changing its artwork; optimize to a broadly supported web-video format if needed.
- Use `autoplay`, `muted`, `loop`, `playsInline`, and `preload="metadata"`; omit controls and audio playback.
- Respect reduced-motion preferences by displaying the static fallback instead of continuously animating.
- Limit changes to the homepage logo presentation; shared headers on other public pages remain unchanged.
- Verify the project build and inspect the header/footer on desktop and mobile in both light and dark themes for clean blending, correct sizing, and no layout shift.