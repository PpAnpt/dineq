import { expect, test } from 'vitest';

// Lab 5 C-02 / R-06 demonstration only. This PR must never be merged.
// It proves that a failing required check (test-and-docker) blocks the merge into main.
test('LAB5-C02: intentional failing assertion to demonstrate the required check blocks merge', () => {
  expect(1).toBe(2);
});
