export const ROLES = {
  USER: 'user',
  DONOR: 'donor',
  NGO: 'ngo',
  HOSPITAL: 'hospital',
  BLOOD_BANK: 'blood_bank',
  ADMIN: 'admin'
};

export const BLOOD_GROUPS = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

export const SOS_STATUSES = ['created', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected'];

export const COMMUNITY_ROLES = [ROLES.USER, ROLES.DONOR];

export const CAMP_ORGANIZER_ROLES = [ROLES.NGO, ROLES.HOSPITAL, ROLES.BLOOD_BANK, ROLES.ADMIN];

export const VERIFIED_ORGANIZATION_ROLES = [ROLES.NGO, ROLES.HOSPITAL, ROLES.BLOOD_BANK];
