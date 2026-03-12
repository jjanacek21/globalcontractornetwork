

# Add PropertyIQ to Member Dashboard

PropertyIQ exists as pages and routes but was never added to the services grid on the Member Dashboard (`src/pages/MemberDashboard.tsx`).

## Change

Add a PropertyIQ service card to the `services` array (around line 301, before the array closes):

```typescript
{
  icon: Building2,
  title: "PropertyIQ",
  description: "Property intelligence reports, owner data & roof analysis",
  link: "/property-iq",
  color: "bg-cyan-600/10 text-cyan-600",
  category: "business" as ServiceCategory
},
```

This will make it appear in the services grid under the "Business" category, linking to the existing `/property-iq` landing page.

**One file modified**: `src/pages/MemberDashboard.tsx` — add one object to the services array.

