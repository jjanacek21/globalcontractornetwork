## Plan

1. **Fix the actual logo asset**
   - Process `public/gcn-logo.png` directly to remove the remaining black rectangular border/background from the image pixels.
   - Keep only the gold logo/text visible on transparent pixels.
   - Preserve the current displayed logo size.

2. **Keep the header narrow**
   - Leave the logo height as-is.
   - Keep the compact nav padding already applied.
   - If needed, ensure the image itself has no CSS border/background/shadow that could look like a border.

3. **Verify the result**
   - Inspect the generated PNG transparency/edges to confirm no black rectangle remains.
   - Confirm `Home.tsx` still points to `/gcn-logo.png` and no `border` class remains on the nav container.