import { db } from '../config/firebase.js';
import { asyncHandler, AppError } from '../utils/http.js';
import { isCommunityRole, normalizeCommunityRole, ROLES } from '../utils/constants.js';

const enforceRoleRules = (profile) => {
  if (!profile.displayName) {
    throw new AppError('Profile requires displayName', 400);
  }
  if (!profile.phone) {
    throw new AppError('Profile requires phone number', 400);
  }
  if (normalizeCommunityRole(profile.role) === ROLES.USER && !profile.bloodGroup) {
    throw new AppError('Profile requires bloodGroup', 400);
  }
  if (
    !profile.location?.country ||
    !profile.location?.state ||
    !profile.location?.district ||
    !profile.location?.address ||
    profile.location?.lat === undefined ||
    profile.location?.lng === undefined
  ) {
    throw new AppError('Profile requires complete location details', 400);
  }
};

const shouldDefaultAvailability = (role) => isCommunityRole(role);

const assertRoleAssignmentAllowed = (requestedRole, existingProfile) => {
  if (normalizeCommunityRole(requestedRole) !== ROLES.ADMIN) {
    return;
  }

  if (normalizeCommunityRole(existingProfile?.role) === ROLES.ADMIN) {
    return;
  }

  throw new AppError(
    'Admin profiles are private and can only be provisioned directly from the backend or database.',
    403
  );
};

const sanitizeProfileForRole = (profile) => {
  const normalizedRole = normalizeCommunityRole(profile.role);
  const next = {
    ...profile,
    role: normalizedRole,
    location: {
      ...profile.location,
      city: profile.location?.city || profile.location?.district || ''
    }
  };

  if (normalizedRole === ROLES.USER) {
    if (next.availabilityStatus === undefined) {
      next.availabilityStatus = true;
    }
    return next;
  }

  delete next.bloodGroup;
  delete next.availabilityStatus;
  delete next.lastDonationDate;

  return next;
};

export const upsertProfile = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  const { uid, email } = req.user;

  if (!email) {
    throw new AppError('Authenticated account has no email address', 400);
  }

  const userRef = db.collection('users').doc(uid);
  const existing = await userRef.get();
  const existingProfile = existing.exists ? existing.data() : null;
  const requestedRole = normalizeCommunityRole(payload.role);
  const existingRole = normalizeCommunityRole(existingProfile?.role);

  if (
    existingRole &&
    existingRole !== requestedRole &&
    !(isCommunityRole(existingRole) && isCommunityRole(requestedRole))
  ) {
    throw new AppError('Role cannot be changed after profile creation', 403);
  }

  payload.role = requestedRole;
  assertRoleAssignmentAllowed(requestedRole, existingProfile);
  const sanitizedPayload = sanitizeProfileForRole(payload);
  enforceRoleRules(sanitizedPayload);

  const nextProfile = sanitizeProfileForRole({
    ...(existingProfile || {}),
    ...sanitizedPayload,
    uid,
    email,
    isVerified: existing.exists ? existingProfile.isVerified : false,
    isBlocked: existing.exists ? existingProfile.isBlocked : false,
    updatedAt: new Date().toISOString(),
    createdAt: existing.exists ? existingProfile.createdAt : new Date().toISOString()
  });

  await userRef.set(nextProfile, { merge: true });

  res.json({
    success: true,
    data: nextProfile
  });
});

export const getMyProfile = asyncHandler(async (req, res) => {
  const userRef = db.collection('users').doc(req.user.uid);
  const doc = await userRef.get();

  if (!doc.exists) {
    throw new AppError('Profile not found', 404);
  }

  res.json({
    success: true,
    data: doc.data()
  });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const { uid, email } = req.user;
  const payload = { ...req.body };
  const userRef = db.collection('users').doc(uid);
  const existing = await userRef.get();

  if (!existing.exists) {
    throw new AppError('Profile not found', 404);
  }

  const existingProfile = existing.data();
  const nextProfile = sanitizeProfileForRole({
    ...existingProfile,
    ...payload,
    uid,
    email: existingProfile.email || email,
    role: normalizeCommunityRole(existingProfile.role),
    updatedAt: new Date().toISOString()
  });

  enforceRoleRules(nextProfile);

  await userRef.set(nextProfile, { merge: true });

  res.json({
    success: true,
    data: nextProfile
  });
});
