# Person A UI Components Self-Check Report

Date: 2026-05-02

## Scope

Self-check target: Person A atomic UI component work.

Changed areas reviewed:

- `src/components/ui/_shared/`
- `src/components/ui/Button/`
- `src/components/ui/IconButton/`
- `src/components/ui/ButtonGroup/`
- `src/components/ui/index.ts`
- `src/test/setup.ts`
- `vitest.config.ts`
- `package.json` / `package-lock.json`
- `src/pages/dev/UiPersonAPreview.tsx` and module CSS for local visual inspection
- `src/App.tsx` dev-only preview route registration

## Verification Summary

| Check | Result | Evidence |
| --- | --- | --- |
| Lint | PASS | `npm.cmd run lint` completed successfully |
| TypeScript | PASS | `npx.cmd tsc -b` completed successfully |
| Unit tests | PASS | `npm.cmd run test`: 6 test files, 25 tests passed |
| Production build | PASS | `npm.cmd run build` completed successfully |
| Security keyword scan | PASS for this change | No `sk-`, `api_key`, `apikey`, `secret`, or `console.log` introduced in Person A files |
| Browser visual check | PASS | Vite dev server opened `/dev/ui-person-a`; desktop and mobile screenshots captured |

Screenshot evidence:

- `person-a-ui-preview-desktop.png`
- `person-a-ui-preview-mobile.png`

## Code Review Findings

No blocking code defects found in the Person A component implementation during self-review.

One improvement was made during self-check:

- `IconButtonProps` now requires an accessible name at the type level: either an explicit `aria-label`, or a string `tooltip` that can be reused as the accessible label.
- `IconButton` now has a stable `32px` square hit area so icon-only controls read visually as controls rather than bare glyphs.
- Preview and examples now use Chinese button text; the Button wrapper disables Ant Design's automatic two-Chinese-character spacing so labels such as `复核`, `驳回`, and `继续` render naturally.
- The preview route `/dev/ui-person-a` is registered only when `import.meta.env.DEV` is true, avoiding a production debug route.

## Component Design Review

### Button

- Wraps Ant Design `Button` while normalizing local `variant`, `tone`, `size`, `radius`, and `opacity`.
- `radius` uses token-backed inline style from `RADIUS_MAP`, matching the plan's requirement for deterministic Ant Design override behavior.
- `opacity` is only applied for values `>= 0` and `< 1`; invalid or default opacity does not create noisy inline styles.
- `tone="danger"` maps to Ant Design's `danger` prop.
- `antProps` remains available as a low-level escape hatch.

### IconButton

- Builds on `Button` with forced `variant="text"` and `radius="md"`.
- Uses CSS module rules for square icon-button geometry: `aspect-ratio: 1`, `width: 32px`, `min-width: 0`, and `padding: 0`.
- Supports tooltip wrapping and accessible-name enforcement.

### ButtonGroup

- Renders a semantic `<div role="group">`.
- Supports horizontal and vertical directions.
- Uses token-backed spacing classes mapped to `--space-sm`, `--space-md`, and `--space-lg`.

## Test Coverage Review

Added TSX component tests:

- `Button.test.tsx`: 10 cases
- `IconButton.test.tsx`: 5 cases
- `ButtonGroup.test.tsx`: 5 cases

Coverage themes:

- Default rendering
- Variant mapping
- Radius and opacity behavior
- Size and loading state
- Danger tone
- Click and disabled behavior
- Custom `className`, `style`, and passthrough props
- Accessibility labels and `role="group"`

## Visual Inspection Route

A dev-only preview route was added:

```text
http://127.0.0.1:5173/dev/ui-person-a
```

It displays:

- Button variants: primary, secondary, ghost, text, link, danger
- Radius and opacity combinations
- IconButton controls with tooltips
- Horizontal and vertical ButtonGroup layouts

Browser observation status: passed on desktop and mobile screenshots.

Observed details:

- Button variants render with distinct Ant Design classes and token-backed inline radius values.
- Ghost button opacity renders as `opacity: 0.72`.
- Danger buttons map to Ant Design dangerous styling.
- Button labels render in Chinese without unwanted internal spacing.
- Icon-only buttons expose `aria-label` values and keep a stable square hit area.
- Mobile layout wraps the button grid and stacks the vertical group without text overflow.

To inspect manually, run:

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Then open:

```text
http://127.0.0.1:5173/dev/ui-person-a
```

## Security Notes

- No secrets or API keys were added.
- No `console.log` statements were added.
- New dependencies are dev-only testing dependencies: `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, and `@types/jsdom`.
- `npm install` previously reported `0 vulnerabilities`.

## Risk And Follow-Up

Overall readiness: READY for Person A code review.

Recommended follow-up:

- Remove or keep the dev-only preview route based on team preference before merging.
