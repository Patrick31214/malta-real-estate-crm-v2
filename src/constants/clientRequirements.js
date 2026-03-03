'use strict';

const CLIENT_STATUSES = [
  { value: 'active',      label: 'Active',       color: 'var(--color-success)' },
  { value: 'matched',     label: 'Matched',      color: 'var(--color-info)' },
  { value: 'viewing',     label: 'Viewing',      color: 'var(--color-accent-gold)' },
  { value: 'offer_made',  label: 'Offer Made',   color: 'var(--color-warning)' },
  { value: 'contracted',  label: 'Contracted',   color: 'var(--color-primary-600)' },
  { value: 'completed',   label: 'Completed',    color: 'var(--color-success)' },
  { value: 'on_hold',     label: 'On Hold',      color: 'var(--color-text-muted)' },
  { value: 'inactive',    label: 'Inactive',     color: 'var(--color-error)' },
];

const URGENCY_LABELS = {
  immediate:      { label: 'Immediate',    color: 'var(--color-error)' },
  within_month:   { label: 'Within Month', color: 'var(--color-warning)' },
  within_3months: { label: '1–3 Months',  color: 'var(--color-accent-gold)' },
  within_6months: { label: '3–6 Months',  color: 'var(--color-info)' },
  flexible:       { label: 'Flexible',     color: 'var(--color-success)' },
};

const MOVE_IN_FLEXIBILITY = [
  { value: 'exact',          label: 'Exact date required' },
  { value: 'within_2weeks',  label: 'Within 2 weeks' },
  { value: 'within_month',   label: 'Within a month' },
  { value: 'within_3months', label: 'Within 3 months' },
  { value: 'flexible',       label: 'Flexible' },
];

const CLIENT_PREFERENCES = {
  lookingFor:    ['sale', 'long_let', 'short_let', 'both'],
  propertyTypes: ['apartment','penthouse','villa','house','maisonette','townhouse','palazzo','farmhouse','commercial','office','garage','land','other'],
};

const MATCH_STATUSES = [
  { value: 'new',               label: 'New Match' },
  { value: 'sent',              label: 'Sent to Client' },
  { value: 'viewed',            label: 'Client Viewed' },
  { value: 'interested',        label: 'Interested' },
  { value: 'not_interested',    label: 'Not Interested' },
  { value: 'viewing_scheduled', label: 'Viewing Scheduled' },
  { value: 'offer_made',        label: 'Offer Made' },
  { value: 'rejected',          label: 'Rejected' },
];

module.exports = { CLIENT_STATUSES, URGENCY_LABELS, MOVE_IN_FLEXIBILITY, CLIENT_PREFERENCES, MATCH_STATUSES };
