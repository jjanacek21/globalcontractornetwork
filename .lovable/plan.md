

## Plan: Add "Return to Dashboard" button in CRM Sidebar header

### Change

**`src/components/crm/CRMSidebar.tsx`** — Add a small home/back button next to the GCN-CRM label in the `SidebarHeader`. When collapsed, show only the icon. Links to `/member/dashboard`.

- Import `Home` icon (already imported)
- Wrap the header content in a flex row with a `NavLink` or `Link` to `/member/dashboard` as a small icon button on the left side, next to the existing GCN-CRM logo link
- When sidebar is collapsed, render only the Home icon; when expanded, show both the home button and the GCN-CRM label side by side

