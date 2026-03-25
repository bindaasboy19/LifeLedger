const compatibilityMap = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+']
};

export const normalizeBloodGroup = (value) => String(value || '').toUpperCase().trim();

export const canDonateTo = (donorGroup, recipientGroup) => {
  const donor = normalizeBloodGroup(donorGroup);
  const recipient = normalizeBloodGroup(recipientGroup);

  if (!compatibilityMap[donor] || !recipient) {
    return false;
  }

  return compatibilityMap[donor].includes(recipient);
};

export const donorEligibilityForRecipient = (recipientGroup) => {
  const recipient = normalizeBloodGroup(recipientGroup);
  return Object.entries(compatibilityMap)
    .filter(([, recipients]) => recipients.includes(recipient))
    .map(([donor]) => donor);
};
