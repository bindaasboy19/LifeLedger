import { describe, it, expect } from 'vitest';
import { canDonateTo, donorEligibilityForRecipient, normalizeBloodGroup } from '../../services/bloodCompatibility.js';

describe('bloodCompatibility service', () => {
  it('should normalize blood group strings correctly', () => {
    expect(normalizeBloodGroup(' o+ ')).toBe('O+');
    expect(normalizeBloodGroup('ab-')).toBe('AB-');
    expect(normalizeBloodGroup(null)).toBe('');
  });

  it('should correctly evaluate O- universal donor status', () => {
    const targetGroups = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
    targetGroups.forEach((group) => {
      expect(canDonateTo('O-', group)).toBe(true);
    });
  });

  it('should return false for incompatible blood transfers', () => {
    expect(canDonateTo('A+', 'O-')).toBe(false);
    expect(canDonateTo('B+', 'A+')).toBe(false);
    expect(canDonateTo('AB+', 'O+')).toBe(false);
  });

  it('should correctly return eligible donor groups for a recipient', () => {
    const eligibleForO = donorEligibilityForRecipient('O-');
    expect(eligibleForO).toEqual(['O-']);

    const eligibleForABPos = donorEligibilityForRecipient('AB+');
    expect(eligibleForABPos).toEqual(['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']);
  });
});
