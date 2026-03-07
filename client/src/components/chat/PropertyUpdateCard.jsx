import React from 'react';
import { useNavigate } from 'react-router-dom';

const PropertyUpdateCard = ({ message }) => {
  const navigate = useNavigate();
  const meta = message.metadata || {};

  const handleClick = () => {
    if (message.propertyId) {
      navigate(`/crm/properties/${message.propertyId}`);
    }
  };

  return (
    <div
      className="cw-prop-card"
      onClick={handleClick}
      role={message.propertyId ? 'button' : undefined}
      tabIndex={message.propertyId ? 0 : undefined}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), handleClick())}
    >
      <div className="cw-prop-card-action">🏠 {meta.action || 'Property Update'}</div>
      <div className="cw-prop-card-title">{meta.propertyTitle || 'Property'}</div>
      {(meta.propertyLocality || meta.propertyPrice) && (
        <div className="cw-prop-card-detail">
          {meta.propertyLocality && <span>{meta.propertyLocality}</span>}
          {meta.propertyLocality && meta.propertyPrice && <span> · </span>}
          {meta.propertyPrice && <span>€{Number(meta.propertyPrice).toLocaleString()}</span>}
        </div>
      )}
    </div>
  );
};

export default PropertyUpdateCard;
