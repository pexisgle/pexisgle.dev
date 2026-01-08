---
applyTo: 'src/routes/(dashboard)/**/*.svelte, src/lib/**/*.svelte'
---

Flowbite-Svelte is the UI kit for dashboard and shared components only. **Do not use in `(main)` routes**—those use custom SASS styling without Tailwind. Use Tailwind utility classes in dashboard; avoid custom CSS unless needed. Prefer Flowbite components over raw HTML for consistency and dark-mode support.

## Usage Patterns

- Import components from `flowbite-svelte` (icons from `flowbite-svelte-icons`). Tree-shake by importing only what you use.
- Keep layout wrappers (cards, nav) responsive with Flowbite grid/flex classes; respect existing dark mode classes (`dark:`) seen in dashboard pages.
- Use props for variants (color, pill, size) instead of ad-hoc classes when available; extend with `class` only for layout tweaks.
- Icons: prefer Flowbite icon set to match styling; size with `class="h-5 w-5"`.
- Forms: use Flowbite inputs, textarea, select, toggle, badge for states; pair with superforms `form.errors` for validation messages.
- Modals/Drawers: control with local boolean state; add `on:click` close buttons; ensure focus trapping via provided component props.

## Example Snippet

```svelte
<script lang="ts">
	import { Button, Modal, Input, Label } from 'flowbite-svelte';
	let open = false;
</script>

<Button color="primary" on:click={() => (open = true)}>New item</Button>
<Modal bind:open size="md">
	{#snippet header()}Create Item{/snippet}
	<Label for="name">Name</Label>
	<Input id="name" type="text" />
</Modal>
```

## Component Reference

### Layout & Navigation

- `Accordion`, `AccordionItem` — collapsible sections; use `multiple` for multi-open, `flush` for borderless
- `Breadcrumb`, `BreadcrumbItem` — hierarchical navigation
- `Navbar`, `NavBrand`, `NavLi`, `NavUl`, `NavHamburger` — top navigation with responsive collapse
- `Sidebar`, `SidebarGroup`, `SidebarItem`, `SidebarWrapper` — side navigation for dashboard
- `Tabs`, `TabItem` — tabbed content; bind `activeTabValue` for control
- `Stepper`, `StepIndicator` — multi-step flow UI
- `MegaMenu` — large dropdown with categories

### Content Display

- `Card` — content container; combine with `Badge` for status tags
- `Timeline`, `TimelineItem` — chronological display
- `List`, `Li` — ordered/unordered lists
- `Listgroup`, `ListgroupItem` — interactive list with hover
- `Table`, `TableBody`, `TableBodyCell`, `TableBodyRow`, `TableHead`, `TableHeadCell` — data tables; use `striped`/`hoverable` props
- `Blockquote` — quotations
- `Hr` — horizontal separator
- `Gallery` — image grid (Masonry layout)

### Forms & Inputs

- `Input` — text/email/number/password input
- `Textarea` — multiline text input
- `Select`, `MultiSelect` — dropdown selection
- `Checkbox`, `Radio` — boolean/multi-choice inputs
- `Toggle` — switch control
- `Range` — slider input
- `Fileupload` — file picker
- `FloatingLabelInput` — input with animated label
- `Search` — search input with icon
- `Label` — form label

### Buttons & Actions

- `Button`, `GradientButton` — primary actions; use `color`, `outline`, `size` props
- `ButtonGroup` — grouped buttons
- `Dropdown`, `DropdownItem`, `DropdownHeader`, `DropdownDivider` — action menus
- `SpeedDial`, `SpeedDialButton` — floating action button with sub-actions

### Feedback & Indicators

- `Alert` — inline status messages; use `color` for severity
- `Toast` — transient notifications; position top-right
- `Badge`, `CloseButton` — status tags and dismissable UI
- `Spinner` — loading indicator
- `Progress`, `Progressbar` — task progress display
- `Skeleton` — loading placeholder
- `Indicator` — notification dot

### Overlays & Popovers

- `Modal` — dialog overlay; bind `open` for control
- `Drawer` — side panel overlay
- `Popover` — contextual tooltip on hover/click
- `Tooltip` — hover hint

### Media

- `Avatar` — profile image with fallback
- `Carousel`, `CarouselTransition` — image slider
- `Img`, `Figure`, `Imgcaption` — images with captions
- `Video` — video player wrapper

### Typography

- `A`, `P`, `Heading`, `Mark`, `Secondary`, `Span` — text elements
- `Kbd` — keyboard shortcut display

### Special

- `Rating`, `AdvancedRating`, `ScoreRating` — star/score display
- `BottomNav`, `BottomNavItem` — mobile bottom navigation
- `Banner` — sticky announcement bar
- `Darkmode` — theme toggle component
- `Iconinput` — input with icon

Use these components for consistent spacing, colors, and accessibility across the dashboard.
