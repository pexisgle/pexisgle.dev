---
trigger: always_on
---

# Svelte5Rule

Svelte 5 Runes mode with reactivity based on `$state()`, `$derived()`, `$effect()`, `$props()` instead of Svelte 4 patterns. Use `onclick={...}` (not `on:click`), snippets (not slots), and avoid destructuring reactive objects. Classes need `$state()` on fields for reactivity.

## Reactivity Fundamentals

**State declaration**: Wrap primitives, objects, arrays in `$state()` for deep reactivity. Never use plain `let` for reactive values—changes won't trigger UI updates.

**Derived values**: Use `$derived(expr)` for simple computations or `$derived.by(() => {...})` for complex logic. Keep derivations pure—no side effects, only return computed value. Derivations auto-update when dependencies change.

**Effects**: Use `$effect(() => {...})` for side effects (logging, timers, subscriptions). Return cleanup function if needed. Use `$effect.pre()` to run before DOM updates. Never update reactive state inside effect that depends on same state—causes infinite loop; use `$derived()` instead.

**Tracking behavior**: Dependencies are tracked synchronously during effect/derived execution. Code inside async callbacks (setTimeout, promises) won't track dependencies accessed after await/timeout. Reference all reactive values before async boundary to ensure tracking.

## Props Pattern

```svelte
<script>
	let { title, count = 0, class: className, ...rest } = $props();
</script>
```

**Destructuring**: Extract props with `$props()` at top of script. Use fallback values (e.g., `count = 0`) for optional props. Rename reserved words (e.g., `class: className`). Rest props capture remaining attributes.

**No mutation**: Never mutate props directly—component doesn't own them. Parent should pass callback props (e.g., `onIncrement`) for child to trigger changes. Fallback objects aren't reactive proxies—if fallback used, mutations won't update UI.

**TypeScript**: Define interface and annotate `$props()`: `let { title, count }: Props = $props();`. Interfaces should have optional fields matching fallback pattern.

## Event Handlers (no `on:` prefix)

**Syntax**: `onclick={handler}` (not `on:click`). Inline arrow functions allowed: `onclick={() => count++}`. Access event object via parameter: `onclick={(e) => e.preventDefault()}`.

**Component forwarding**: Pass `onclick` as prop, destructure with `$props()`, attach to native element. No special syntax needed—just treat as normal prop.

**No modifiers**: Svelte 5 removed event modifiers (e.g., `|preventDefault`). Call `e.preventDefault()` explicitly inside handler. Wrap in helper function if needed: `const prevent = (fn) => (e) => { e.preventDefault(); fn(e); };`.

**Multiple handlers**: Can't duplicate attributes. Combine into single handler: `onclick={(e) => { one(e); two(e); }}`.

## Snippets Replace Slots

**Named snippets**: Define with `{#snippet name(param)} ... {/snippet}`, render with `{@render name(value)}`. Pass as props to child components—child renders via `{@render snippetProp(data)}`.

**Children (default content)**: Special `children` prop contains default slot content. Render with `{@render children?.()}`. Always use optional chaining—children may be undefined if parent didn't provide content.

**No slot syntax**: Avoid `<slot />`, `<slot name="x" />`, `<svelte:fragment slot="x">` from Svelte 4. Use snippets exclusively in Svelte 5 Runes mode.

## Class Field Reactivity

**State fields**: Declare with `$state()`: `class Counter { count = $state(0); }`. Or assign in constructor: `constructor() { this.count = 0; }` (first assignment establishes state). Don't wrap class instance in `$state()`—won't work.

**Method binding**: Use arrow functions for methods passed as event handlers: `increment = () => { this.count++; }`. Regular methods lose `this` context when detached: `onclick={counter.decrement}` breaks; wrap inline: `onclick={() => counter.decrement()}`.

**Component exports**: Export functions/constants from component for parent to call via `bind:this`: `export function reset() { count = 0; }`. Parent: `<MyComp bind:this={comp} />`, then call `comp.reset()`.

## Common Pitfalls

**Destructuring objects**: Breaks reactivity. `let { name, age } = user` creates static copies—mutations to `age` won't update UI. Always reference object properties directly: `{user.age}`, `user.age++`.

**Exporting state**: Can't `export let count = $state(0)` (compile error). Wrap in object: `export let state = $state({ count: 0 })`. Or export getter: `export function getCount() { return count; }`.

**Side effects in derived**: Never push to array, log, mutate external state inside `$derived()`. Keep pure—only compute and return. Move side effects to `$effect()`.

**Infinite effect loops**: If effect updates same state it reads, infinite loop. Example: `$effect(() => { doubled = count * 2; })` reruns forever. Use `$derived()` for synchronization: `let doubled = $derived(count * 2)`.

**Async dependency tracking**: Dependencies accessed after `await` or inside `setTimeout` aren't tracked. Read all reactive values synchronously at top of effect before async code.

**Object reference vs property**: `$effect(() => { state; })` only reruns if `state` is reassigned. `$effect(() => { state.value; })` reruns when `state.value` changes. `$derived()` objects are always new references—comparing them triggers updates.

**bind:this timing**: Element binding may be undefined initially. Guard in effect: `$effect(() => { if (!canvas) return; /* use canvas */ });`.

## Migration Reference (Svelte 4 → 5)

- `let` → `$state()` (reactive variables)
- `$: value =` → `$derived()` (computed values)
- `$: { ... }` → `$effect()` (side effects)
- `export let` → `$props()` (component props)
- `on:click` → `onclick` (event handlers, no colon)
- `<slot />` → `{@render children()}` (default content)
- `<slot name="x" />` → `{@render x()}` (named content)
- `let:item` → `{#snippet item(data)}` (render props pattern)
- `createEventDispatcher` → callback props (parent-to-child communication)

## Checklist

Before committing Svelte 5 code, verify:

- Reactive values use `$state()`, not plain `let`
- Computed values use `$derived()` or `$derived.by()`
- Props extracted via `$props()`, not `export let`
- Event handlers use `onclick={...}`, not `on:click={...}`
- Content rendered via `{#snippet}` + `{@render}`, not `<slot>`
- Effects don't update state they read (prefer `$derived()` for sync)
- Class fields declared with `$state()` for reactivity
- Objects not destructured (preserves reactive proxy)
- Props not mutated (use callbacks instead)
- Async code doesn't break dependency tracking (read reactive values before async boundary)
- `untrack()` used when intentionally avoiding dependency tracking
