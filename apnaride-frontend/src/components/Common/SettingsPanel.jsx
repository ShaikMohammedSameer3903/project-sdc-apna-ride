import React, { useEffect, useState } from 'react';

export default function SettingsPanel({ isOpen, onClose, role = 'customer', onSettingsChange }) {
  const [globalSettings, setGlobalSettings] = useState({ darkMode: false, chatNotifications: true, sosAutoOpen: false });
  const [customerSettings, setCustomerSettings] = useState({ showHeatmap: false });
  const [riderSettings, setRiderSettings] = useState({ lockRideType: false, autoAcceptKm: 0, serviceRadius: 10 });

  useEffect(() => {
    try {
      const g = JSON.parse(localStorage.getItem('settings_global') || '{}');
      const c = JSON.parse(localStorage.getItem('settings_customer') || '{}');
      const r = JSON.parse(localStorage.getItem('settings_rider') || '{}');
      setGlobalSettings({ darkMode: !!g.darkMode, chatNotifications: g.chatNotifications !== false, sosAutoOpen: !!g.sosAutoOpen });
      setCustomerSettings({ showHeatmap: !!c.showHeatmap });
      setRiderSettings({ lockRideType: !!r.lockRideType, autoAcceptKm: Number(r.autoAcceptKm) || 0, serviceRadius: Number(r.serviceRadius) || 10 });
    } catch {
      // ignore
    }
  }, [isOpen]);

  useEffect(() => {
    try {
      localStorage.setItem('settings_global', JSON.stringify(globalSettings));
      if (onSettingsChange) onSettingsChange({ scope: 'global', settings: globalSettings });
      if (globalSettings.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    } catch {}
  }, [globalSettings, onSettingsChange]);

  useEffect(() => {
    try {
      localStorage.setItem('settings_customer', JSON.stringify(customerSettings));
      if (onSettingsChange && role === 'customer') onSettingsChange({ scope: 'customer', settings: customerSettings });
    } catch {}
  }, [customerSettings, onSettingsChange, role]);

  useEffect(() => {
    try {
      localStorage.setItem('settings_rider', JSON.stringify(riderSettings));
      if (onSettingsChange && role === 'rider') onSettingsChange({ scope: 'rider', settings: riderSettings });
    } catch {}
  }, [riderSettings, onSettingsChange, role]);

  if (!isOpen) return null;

  return (
    <div className="uber-floating-card uber-floating-card-right" style={{ width: 360, zIndex: 1004, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>Settings</h3>
        <button className="uber-btn-icon" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontWeight: 700, marginTop: 4 }}>General</div>
        <label className="uber-switch">
          <input type="checkbox" checked={globalSettings.darkMode} onChange={e => setGlobalSettings(s => ({ ...s, darkMode: e.target.checked }))} />
          <span>Dark mode</span>
        </label>
        <label className="uber-switch">
          <input type="checkbox" checked={globalSettings.chatNotifications} onChange={e => setGlobalSettings(s => ({ ...s, chatNotifications: e.target.checked }))} />
          <span>Chat notifications</span>
        </label>
        <label className="uber-switch">
          <input type="checkbox" checked={globalSettings.sosAutoOpen} onChange={e => setGlobalSettings(s => ({ ...s, sosAutoOpen: e.target.checked }))} />
          <span>SOS auto-open</span>
        </label>

        {role === 'customer' && (
          <>
            <div style={{ fontWeight: 700, marginTop: 8 }}>Customer</div>
            <label className="uber-switch">
              <input type="checkbox" checked={customerSettings.showHeatmap} onChange={e => setCustomerSettings(s => ({ ...s, showHeatmap: e.target.checked }))} />
              <span>Show heatmap</span>
            </label>
          </>
        )}

        {role === 'rider' && (
          <>
            <div style={{ fontWeight: 700, marginTop: 8 }}>Driver</div>
            <label className="uber-switch">
              <input type="checkbox" checked={riderSettings.lockRideType} onChange={e => setRiderSettings(s => ({ ...s, lockRideType: e.target.checked }))} />
              <span>Lock to my vehicle type</span>
            </label>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#666' }}>Auto-accept within (km)</label>
              <input type="number" min="0" step="0.5" value={riderSettings.autoAcceptKm}
                onChange={e => setRiderSettings(s => ({ ...s, autoAcceptKm: Number(e.target.value) }))}
                className="uber-input" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#666' }}>Service radius (km)</label>
              <input type="number" min="1" step="1" value={riderSettings.serviceRadius}
                onChange={e => setRiderSettings(s => ({ ...s, serviceRadius: Number(e.target.value) }))}
                className="uber-input" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
