export const CLIENT_STATUSES = [
  { value: 'active',      label: 'Active',       color: 'var(--color-success)' },
  { value: 'matched',     label: 'Matched',      color: 'var(--color-info)' },
  { value: 'viewing',     label: 'Viewing',      color: 'var(--color-accent-gold)' },
  { value: 'offer_made',  label: 'Offer Made',   color: 'var(--color-warning)' },
  { value: 'contracted',  label: 'Contracted',   color: 'var(--color-primary-600)' },
  { value: 'completed',   label: 'Completed',    color: 'var(--color-success)' },
  { value: 'on_hold',     label: 'On Hold',      color: 'var(--color-text-muted)' },
  { value: 'inactive',    label: 'Inactive',     color: 'var(--color-error)' },
];

export const URGENCY_LABELS = {
  immediate:      { label: 'Immediate',    color: 'var(--color-error)' },
  within_month:   { label: 'Within Month', color: 'var(--color-warning)' },
  within_3months: { label: '1–3 Months',  color: 'var(--color-accent-gold)' },
  within_6months: { label: '3–6 Months',  color: 'var(--color-info)' },
  flexible:       { label: 'Flexible',    color: 'var(--color-success)' },
};

export const CLIENT_PREFERENCES = {
  lookingFor: ['sale', 'long_let', 'short_let', 'both'],
  propertyTypes: ['apartment','penthouse','villa','house','maisonette','townhouse','palazzo','farmhouse','commercial','office','garage','land','other'],
};

export const MATCH_STATUSES = [
  { value: 'new',               label: 'New Match' },
  { value: 'sent',              label: 'Sent to Client' },
  { value: 'viewed',            label: 'Client Viewed' },
  { value: 'interested',        label: 'Interested' },
  { value: 'not_interested',    label: 'Not Interested' },
  { value: 'viewing_scheduled', label: 'Viewing Scheduled' },
  { value: 'offer_made',        label: 'Offer Made' },
  { value: 'rejected',          label: 'Rejected' },
];

export const MOVE_IN_FLEXIBILITY = [
  { value: 'exact',          label: 'Exact Date' },
  { value: 'within_2weeks',  label: 'Within 2 Weeks' },
  { value: 'within_month',   label: 'Within a Month' },
  { value: 'within_3months', label: 'Within 3 Months' },
  { value: 'flexible',       label: 'Flexible' },
];

export const MALTA_LOCALITIES = [
  'Valletta','Sliema','St Julian\'s','St Paul\'s Bay','Mellieha','Mdina',
  'Rabat','Mosta','Naxxar','Attard','Balzan','Lija','San Gwann','Birkirkara',
  'Gzira','Msida','Pietà','Floriana','Qormi','Luqa','Żejtun','Żabbar',
  'Marsaskala','Marsaxlokk','Birżebbuġa','Żurrieq','Siġġiewi','Dingli','Fgura',
  'Paola','Tarxien','Żebbuġ','Ħamrun','Marsa','Pembroke','Swieqi','Iklin',
  'St Venera','Ħal Ghaxaq','Gudja','Kirkop','Mqabba','Qrendi',
  'Gozo - Victoria','Gozo - Xlendi','Gozo - Marsalforn','Gozo - Nadur',
];
