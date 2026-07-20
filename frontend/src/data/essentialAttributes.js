export const ESSENTIAL_ATTRIBUTE_IDS = [
  'essential-caseId',
  'essential-activity',
  'essential-timestamp',
];

export const createEssentialAttributes = () => [
  { id: 'essential-caseId', name: 'caseId', type: 'string', locked: true, scope: 'case' },
  { id: 'essential-activity', name: 'activity', type: 'string', locked: true, scope: 'event' },
  {
    id: 'essential-timestamp',
    name: 'timestamp',
    type: 'datetime',
    locked: true,
    scope: 'event',
  },
];

export const isEssentialId = (id) => ESSENTIAL_ATTRIBUTE_IDS.includes(id);
