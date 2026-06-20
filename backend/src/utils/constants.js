export const ROLES = {
  USER: 'user',
  DONOR: 'donor',
  NGO: 'ngo',
  HOSPITAL: 'hospital',
  BLOOD_BANK: 'blood_bank',
  ADMIN: 'admin'
};

export const BLOOD_GROUPS = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

export const SOS_STATUSES = [
  'open',
  'accepted',
  'in_progress',
  'completed',
  'cancelled',
  'unmatched',
  'pending_review',
  'expired',
  'rejected',
  'created'
];

export const normalizeCommunityRole = (role) => (role === ROLES.DONOR ? ROLES.USER : role);

export const isCommunityRole = (role) => normalizeCommunityRole(role) === ROLES.USER;

export const COMMUNITY_ROLES = [ROLES.USER];

export const CAMP_ORGANIZER_ROLES = [ROLES.NGO, ROLES.HOSPITAL, ROLES.BLOOD_BANK, ROLES.ADMIN];

export const VERIFIED_ORGANIZATION_ROLES = [ROLES.NGO, ROLES.HOSPITAL, ROLES.BLOOD_BANK];
