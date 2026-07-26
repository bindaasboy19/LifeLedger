import { describe, it, expect } from 'vitest';
import { deriveSOSVerificationStatus, getDonationCooldownDays, isPolicyEligibleDonor } from '../../services/sosEligibilityService.js';

describe('sosEligibilityService', () => {
  describe('deriveSOSVerificationStatus', () => {
    it('should return verified if email or phone or document is verified', () => {
      expect(deriveSOSVerificationStatus({ emailVerified: true }, {})).toBe('verified');
      expect(deriveSOSVerificationStatus({}, { phoneVerified: true })).toBe('verified');
      expect(deriveSOSVerificationStatus({}, { documentVerified: true })).toBe('verified');
    });

    it('should return manual_review if manualReviewRequired flag is true', () => {
      expect(deriveSOSVerificationStatus({}, { manualReviewRequired: true })).toBe('manual_review');
    });

    it('should return unverified for unverified profile', () => {
      expect(deriveSOSVerificationStatus({}, {})).toBe('unverified');
    });
  });

  describe('getDonationCooldownDays', () => {
    it('should return 120 days for female donors and 90 days for male/default', () => {
      expect(getDonationCooldownDays({ gender: 'female' })).toBe(120);
      expect(getDonationCooldownDays({ gender: 'male' })).toBe(90);
      expect(getDonationCooldownDays({})).toBe(90);
    });
  });

  describe('isPolicyEligibleDonor', () => {
    it('should flag blocked donors as ineligible', () => {
      const result = isPolicyEligibleDonor({ isBlocked: true });
      expect(result.eligible).toBe(false);
      expect(result.reasons).toContain('blocked');
    });

    it('should flag donors on cooldown as ineligible', () => {
      const recentDonationDate = new Date();
      recentDonationDate.setDate(recentDonationDate.getDate() - 10);
      const result = isPolicyEligibleDonor({
        gender: 'male',
        lastDonationDate: recentDonationDate.toISOString()
      });
      expect(result.eligible).toBe(false);
      expect(result.reasons).toContain('cooldown');
    });

    it('should mark valid donors as eligible', () => {
      const oldDonationDate = new Date();
      oldDonationDate.setDate(oldDonationDate.getDate() - 100);
      const result = isPolicyEligibleDonor({
        gender: 'male',
        lastDonationDate: oldDonationDate.toISOString(),
        availabilityStatus: true
      });
      expect(result.eligible).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });
  });
});
