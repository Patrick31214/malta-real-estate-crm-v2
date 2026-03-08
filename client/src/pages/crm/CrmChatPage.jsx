import React from 'react';
import ChatPanel from '../../components/crm/chat/ChatPanel';
import usePageTimeTracker from '../../hooks/usePageTimeTracker';

const CrmChatPage = () => {
  usePageTimeTracker('chat', { entityType: 'chat' });
  return <ChatPanel />;
};

export default CrmChatPage;
