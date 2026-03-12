

# Add Address Autocomplete to PropertyIQ Search

## Problem
The PropertyIQ search bar is a plain text input — no dropdown suggestions appear as you type. The app already has two working autocomplete components (`AddressAutocomplete` and `AddressSearchBar`) that call the `geocode-address` edge function for Mapbox suggestions.

## Approach
Replace the plain `<Input>` in `PropertyIQSearch.tsx` with the existing `AddressAutocomplete` component. When the user selects a suggestion, set the query and trigger navigation. Keep the current search button and form behavior intact.

## Changes

### `src/pages/PropertyIQSearch.tsx`
- Import `AddressAutocomplete` from `@/components/homeowner/AddressAutocomplete`
- Replace the `<Input>` inside the search form with `<AddressAutocomplete>`
- Pass `value={query}`, `onChange={setQuery}`, and an `onSelect` handler that sets the query and navigates to the search results
- Keep the Search button and form submit behavior unchanged
- Adjust styling: the autocomplete already renders its own `<Input>` with an icon, so remove the manual `<Search>` icon overlay and adapt the wrapper `div` accordingly

No new files, no database changes, no hook changes needed.

