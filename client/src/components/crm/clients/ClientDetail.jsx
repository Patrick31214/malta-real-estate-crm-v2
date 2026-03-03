import React from 'react';
import { CLIENT_STATUSES, URGENCY_LABELS, MOVE_IN_FLEXIBILITY } from '../../../constants/clientRequirements';

const getStatusConfig = (value) => CLIENT_STATUSES.find(s => s.value === value) || { label: value, color: 'var(--color-text-muted)' };

const formatBudget = (min, max) => {
  const fmt = (n) => {
    if (!n) return null;
    const num = Number(n);
    if (num >= 1000000) return `€${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `€${Math.round(num / 1000)}k`;
    return `€${num.toLocaleString()}`;
  };
  const fMin = fmt(min);
  const fMax = fmt(max);
  if (fMin && fMax) return `${fMin} – ${fMax}`;
  if (fMin) return `From ${fMin}`;
  if (fMax) return `Up to ${fMax}`;
  return 'Not specified';
};

const Section = ({ title, icon, children, borderColor }) => (
  <div className="glass" style={{
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-5)',
    marginBottom: 'var(--space-4)',
    border: borderColor ? `1px solid ${borderColor}` : undefined,
    background: borderColor ? 'rgba(168,92,92,0.04)' : undefined,
  }}>
    <h3 style={{
      fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)',
      color: 'var(--color-text-primary)', marginBottom: 'var(--space-4)',
      display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
    }}>
      {icon && <span>{icon}</span>}{title}
    </h3>
    {children}
  </div>
);

const Field = ({ label, value, fullWidth }) => (
  <div style={{ marginBottom: 'var(--space-3)', ...(fullWidth ? { gridColumn: '1 / -1' } : {}) }}>
    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', marginBottom: '2px' }}>
      {label}
    </div>
    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 'var(--font-medium)' }}>
      {value || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
    </div>
  </div>
);

const FieldGrid = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-2)' }}>
    {children}
  </div>
);

const Chip = ({ label, color }) => (
  <span style={{
    padding: '3px 10px', borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
    background: 'var(--color-surface-glass)', border: `1px solid ${color || 'var(--color-border)'}`,
    color: color || 'var(--color-text-secondary)',
  }}>
    {label}
  </span>
);

const ClientDetail = ({ client, onEdit, onClose, onViewMatches, canEdit }) => {
  if (!client) return null;

  const status = getStatusConfig(client.status);
  const urgency = URGENCY_LABELS[client.urgency];
  const agentName = client.agent
    ? `${client.agent.firstName} ${client.agent.lastName}`
    : (client.agentName || '—');

  const flexibilityLabel = MOVE_IN_FLEXIBILITY.find(f => f.value === client.moveInFlexibility)?.label || client.moveInFlexibility;
  const niceToHaveFeatures = client.niceToHaveFeatures || [];
  const mustHaveFeatures = client.mustHaveFeatures || [];
  const localities = client.preferredLocalities || [];
  const propertyTypes = client.propertyTypes || [];

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', color: 'var(--color-text-primary)', margin: 0 }}>
                {client.firstName} {client.lastName}
              </h1>
              {client.isVIP && <span style={{ fontSize: '24px' }} title="VIP Client">⭐</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
              <span style={{
                padding: '3px 12px', borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)',
                color: status.color, border: `1px solid ${status.color}`,
                background: 'var(--color-surface-glass)',
              }}>
                {status.label}
              </span>
              {urgency && (
                <span style={{
                  padding: '3px 12px', borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-sm)',
                  color: urgency.color, border: `1px solid ${urgency.color}`,
                  background: 'var(--color-surface-glass)',
                }}>
                  ⏰ {urgency.label}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {onViewMatches && (
            <button onClick={() => onViewMatches(client)} style={headerBtn('var(--color-info)')}>
              🔗 View Matches
            </button>
          )}
          {canEdit && onEdit && (
            <button onClick={() => onEdit(client)} style={headerBtn('var(--color-primary)')}>
              ✏️ Edit
            </button>
          )}
          <button onClick={onClose} style={headerBtn('var(--color-text-muted)')}>
            ← Back
          </button>
        </div>
      </div>

      {/* 1. Personal Information */}
      <Section title="Personal Information" icon="👤">
        <FieldGrid>
          <Field label="First Name" value={client.firstName} />
          <Field label="Last Name" value={client.lastName} />
          <Field label="Email" value={client.email} />
          <Field label="Phone" value={client.phone} />
          <Field label="Alt. Phone" value={client.alternatePhone} />
          <Field label="Nationality" value={client.nationality} />
          <Field label="Occupation" value={client.occupation} />
          <Field label="Date of Birth" value={client.dateOfBirth} />
          <Field label="ID / Passport" value={client.idNumber} />
        </FieldGrid>
      </Section>

      {/* 2. Living Situation */}
      <Section title="Living Situation" icon="🏡">
        <FieldGrid>
          <Field label="No. of People" value={client.numberOfPeople} />
          <Field label="Has Children" value={client.hasChildren ? 'Yes' : client.hasChildren === false ? 'No' : undefined} />
          {client.hasChildren && <Field label="No. of Children" value={client.numberOfChildren} />}
          {client.hasChildren && <Field label="Children Ages" value={client.childrenAges} />}
          <Field label="Has Pets" value={client.hasPets ? 'Yes' : client.hasPets === false ? 'No' : undefined} />
          {client.hasPets && <Field label="Pet Details" value={client.petDetails} />}
          <Field label="Years in Malta" value={client.yearsInMalta} />
          <Field label="Current Address" value={client.currentAddress} fullWidth />
        </FieldGrid>
      </Section>

      {/* 3. Property Requirements */}
      <Section title="Property Requirements" icon="🏠">
        <FieldGrid>
          <Field label="Looking For" value={(client.lookingFor || '').replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} />
          <Field label="Budget Range" value={formatBudget(client.minBudget, client.maxBudget)} />
          <Field label="Min Bedrooms" value={client.minBedrooms} />
          <Field label="Max Bedrooms" value={client.maxBedrooms} />
          <Field label="Min Bathrooms" value={client.minBathrooms} />
          <Field label="Min Area (m²)" value={client.minArea} />
          <Field label="Max Area (m²)" value={client.maxArea} />
        </FieldGrid>

        {propertyTypes.length > 0 && (
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', marginBottom: 'var(--space-2)' }}>
              Property Types
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              {propertyTypes.map(t => <Chip key={t} label={t} />)}
            </div>
          </div>
        )}

        {localities.length > 0 && (
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', marginBottom: 'var(--space-2)' }}>
              Preferred Localities
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              {localities.map(loc => <Chip key={loc} label={`📍 ${loc}`} />)}
            </div>
          </div>
        )}
      </Section>

      {/* 4. Must-Have Features */}
      {mustHaveFeatures.length > 0 && (
        <Section title="Must-Have Features" icon="✅">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {mustHaveFeatures.map(f => (
              <span key={f} style={{
                padding: '3px 10px', borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
                background: 'var(--color-success-light)', color: 'var(--color-success)',
                border: '1px solid var(--color-success)',
              }}>
                ✓ {f}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* 5. Nice-to-Have Features */}
      {niceToHaveFeatures.length > 0 && (
        <Section title="Nice-to-Have Features" icon="💫">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {niceToHaveFeatures.map(f => (
              <span key={f} style={{
                padding: '3px 10px', borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-xs)',
                background: 'var(--color-info-light)', color: 'var(--color-info)',
                border: '1px solid var(--color-info)',
              }}>
                {f}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* 6. Internal Preferences */}
      <Section title="Internal Preferences" icon="🔒" borderColor="var(--color-warning)">
        <div style={{
          fontSize: 'var(--text-xs)', color: 'var(--color-warning)',
          marginBottom: 'var(--space-3)', fontWeight: 'var(--font-medium)',
        }}>
          ⚠ Internal use only — not shared with client
        </div>
        <FieldGrid>
          <Field label="Accepts Children" value={client.acceptsChildren ? 'Yes' : client.acceptsChildren === false ? 'No' : undefined} />
          <Field label="Child-Friendly Required" value={client.childFriendlyRequired ? 'Yes' : client.childFriendlyRequired === false ? 'No' : undefined} />
          <Field label="Accepts Sharing" value={client.acceptsSharing ? 'Yes' : client.acceptsSharing === false ? 'No' : undefined} />
          <Field label="Pet-Friendly" value={client.isPetFriendly ? 'Yes' : client.isPetFriendly === false ? 'No' : undefined} />
          <Field label="Is Negotiable" value={client.isNegotiable ? 'Yes' : client.isNegotiable === false ? 'No' : undefined} />
          <Field label="Accepts Short Let" value={client.acceptsShortLet ? 'Yes' : client.acceptsShortLet === false ? 'No' : undefined} />
        </FieldGrid>
      </Section>

      {/* 7. Viewing & Timeline */}
      <Section title="Viewing & Timeline" icon="📅">
        <FieldGrid>
          <Field label="Move-in Date" value={client.moveInDate} />
          <Field label="Move-in Flexibility" value={flexibilityLabel} />
          <Field label="Urgency" value={urgency?.label} />
        </FieldGrid>
        {client.viewingAvailability && (
          <Field label="Viewing Availability" value={client.viewingAvailability} fullWidth />
        )}
      </Section>

      {/* 8. Additional Notes */}
      {(client.notes || client.specialRequirements) && (
        <Section title="Additional Notes" icon="📝">
          {client.notes && <Field label="Notes" value={client.notes} fullWidth />}
          {client.specialRequirements && <Field label="Special Requirements" value={client.specialRequirements} fullWidth />}
        </Section>
      )}

      {/* 9. Agent Card */}
      <Section title="Assigned Agent" icon="🧑‍💼">
        <FieldGrid>
          <Field label="Agent" value={agentName} />
          {client.referralSource && <Field label="Referral Source" value={client.referralSource} />}
          {client.createdAt && <Field label="Client Since" value={new Date(client.createdAt).toLocaleDateString('en-MT')} />}
        </FieldGrid>
      </Section>

    </div>
  );
};

const headerBtn = (color) => ({
  padding: 'var(--space-2) var(--space-4)',
  borderRadius: 'var(--radius-sm)',
  border: `1px solid ${color}`,
  background: 'transparent',
  color,
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-medium)',
  transition: 'background var(--transition-fast)',
  whiteSpace: 'nowrap',
});

export default ClientDetail;
