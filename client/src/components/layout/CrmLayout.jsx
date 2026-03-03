import React, { useState, useCallback, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import CrmSidebar from './CrmSidebar';
import CrmHeader  from './CrmHeader';

const TABLET_BREAKPOINT = 1024;
const MOBILE_BREAKPOINT = 768;

const CrmLayout = () => {
  const [collapsed,   setCollapsed]   = useState(() => window.innerWidth <= TABLET_BREAKPOINT);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  /* Collapse sidebar automatically on resize */
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w <= MOBILE_BREAKPOINT) {
        setCollapsed(false);   // full sidebar when opened as drawer
        setMobileOpen(false);  // always start closed on mobile
      } else if (w <= TABLET_BREAKPOINT) {
        setCollapsed(true);
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar   = useCallback(() => setCollapsed(c => !c), []);
  const openMobileSidebar  = useCallback(() => setMobileOpen(true),  []);
  const closeMobileSidebar = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="crm-layout">
      <CrmSidebar
        collapsed={collapsed}
        onToggle={toggleSidebar}
        mobileOpen={mobileOpen}
        onMobileClose={closeMobileSidebar}
      />

      <div className="crm-main">
        <CrmHeader onMenuClick={openMobileSidebar} />
        <main className="crm-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CrmLayout;
