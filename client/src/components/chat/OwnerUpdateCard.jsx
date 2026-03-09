import React from 'react';
import { useNavigate } from 'react-router-dom';

const OwnerUpdateCard = ({ message }) => {
  const navigate = useNavigate();
  const meta = message.metadata || {};
  const ownerId = message.ownerId || meta.ownerId;

  const handleClick = () => {
    if (ownerId) {
      navigate(`/crm/owners/${ownerId}`);
    }
  };

  return (
    <div
      className="cw-prop-card"
      onClick={handleClick}
      role={ownerId ? 'button' : undefined}
      tabIndex={ownerId ? 0 : undefined}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
    >
      <div className="cw-prop-card-action">👤 {meta.action || 'Owner Update'}</div>
      <div className="cw-prop-card-title">{meta.ownerName || 'Owner'}</div>
    </div>
  );
};

export default OwnerUpdateCard;
