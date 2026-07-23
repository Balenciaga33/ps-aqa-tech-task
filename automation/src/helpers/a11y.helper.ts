import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { annotateKnownIssue } from '../fixtures/test.fixtures';

/**
 * Product debt tracked in KNOWN-ISSUES.md (A1/A2) — not a merge blocker.
 * New serious/critical rules outside this set still fail the suite.
 */
const KNOWN_SERIOUS_A11Y_RULES = new Set(['color-contrast', 'html-has-lang']);

/**
 * Runs axe and fails on unexpected serious/critical issues.
 * Known product violations are annotated and allowed (KNOWN-ISSUES A1/A2).
 */
export async function expectNoUnexpectedSeriousA11yViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const blocking = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );

  const known = blocking.filter((violation) => KNOWN_SERIOUS_A11Y_RULES.has(violation.id));
  const unexpected = blocking.filter((violation) => !KNOWN_SERIOUS_A11Y_RULES.has(violation.id));

  if (known.some((v) => v.id === 'color-contrast')) {
    annotateKnownIssue('A1', 'Primary buttons fail WCAG AA color contrast');
  }
  if (known.some((v) => v.id === 'html-has-lang')) {
    annotateKnownIssue('A2', 'Document <html> is missing lang attribute');
  }

  expect(
    unexpected,
    `${label} unexpected a11y serious/critical: ${unexpected
      .map((v) => `${v.id} (${v.impact}) — ${v.help}`)
      .join('; ')}`,
  ).toEqual([]);
}
