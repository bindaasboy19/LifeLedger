import { z } from 'zod';
import { BLOOD_GROUPS, ROLES, SOS_STATUSES } from './constants.js';

const roleValues = Object.values(ROLES);
const phoneSchema = z
  .string()
  .min(7)
  .max(20)
  .regex(/^[0-9+\-()\s]+$/, 'Phone number contains invalid characters');

export const locationSchema = z.object({
  city: z.string().min(2),
  address: z.string().min(2).optional(),
  lat: z.number(),
  lng: z.number()
});

export const upsertProfileSchema = z.object({
  displayName: z.string().min(2),
  phone: phoneSchema,
  role: z.enum(roleValues),
  bloodGroup: z.enum(BLOOD_GROUPS),
  availabilityStatus: z.boolean().optional(),
  lastDonationDate: z.string().datetime().optional(),
  location: locationSchema
});

export const profileUpdateSchema = z
  .object({
    displayName: z.string().min(2).optional(),
    phone: phoneSchema.optional(),
    bloodGroup: z.enum(BLOOD_GROUPS).optional(),
    availabilityStatus: z.boolean().optional(),
    lastDonationDate: z.string().datetime().optional(),
    location: locationSchema.optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one profile field must be provided'
  });

export const stockSchema = z.object({
  bloodGroup: z.enum(BLOOD_GROUPS),
  units: z.number().int().min(0),
  expiryDate: z.string().datetime(),
  collectionDate: z.string().datetime(),
  location: locationSchema,
  sourceType: z.enum(['hospital', 'blood_bank'])
});

export const stockUpdateSchema = stockSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided'
});

export const sosCreateSchema = z.object({
  bloodGroup: z.enum(BLOOD_GROUPS),
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
  location: locationSchema,
  notes: z.string().max(500).optional()
});

export const sosStatusUpdateSchema = z.object({
  status: z.enum(SOS_STATUSES),
  reason: z.string().max(200).optional()
});

export const donorProfileSchema = z.object({
  bloodGroup: z.enum(BLOOD_GROUPS),
  lastDonationDate: z.string().datetime().optional(),
  availabilityStatus: z.boolean(),
  location: locationSchema.optional()
});

export const donorDonationSchema = z.object({
  bloodGroup: z.enum(BLOOD_GROUPS),
  units: z.number().int().min(1),
  donatedAt: z.string().datetime(),
  location: locationSchema,
  campId: z.string().optional()
});

export const campSchema = z.object({
  name: z.string().min(3),
  organizer: z.string().min(3),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  location: locationSchema,
  requiredBloodGroups: z.array(z.enum(BLOOD_GROUPS)).min(1),
  contactDetails: z.object({
    email: z.string().email(),
    phone: z.string().min(5)
  }),
  description: z.string().max(1000).optional()
});

export const campUpdateSchema = campSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided'
});

export const adminVerifySchema = z.object({
  isVerified: z.boolean()
});

export const adminBlockSchema = z.object({
  isBlocked: z.boolean(),
  reason: z.string().max(200).optional()
});
