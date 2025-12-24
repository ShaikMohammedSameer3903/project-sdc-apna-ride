import React, { useEffect, useState } from 'react';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE)
    ? import.meta.env.VITE_API_BASE
    : '/api';

export default function CampaignBanner({ onCta }) {
    const [campaign, setCampaign] = useState(null);
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        let ignore = false;
        fetch(`${API_BASE}/campaigns/active`).then(async (r) => {
            if (!r.ok) return;
            const data = await r.json();
            if (!ignore) setCampaign(data);
        }).catch(() => {});
        return () => { ignore = true; };
    }, []);

    if (!campaign || hidden) return null;

    return (
        <div className="slide-in-down" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
            background: 'linear-gradient(90deg, #1a1a1a 0%, #000 100%)',
            color: '#fff',
            padding: '10px 16px',
            boxShadow: '0 6px 24px rgba(0,0,0,0.4)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 1100, margin: '0 auto' }}>
                <div className="neon-text" style={{ fontWeight: 800 }}>{campaign.title}</div>
                <div style={{ opacity: 0.9, flex: 1 }}>{campaign.message}</div>
                {campaign.cta && (
                    <button className="modern-btn modern-btn-secondary ripple" onClick={() => onCta && onCta()}>
                        {campaign.cta}
                    </button>
                )}
                <button onClick={() => setHidden(true)} className="modern-btn modern-btn-ghost" style={{ padding: '8px 12px' }}>✕</button>
            </div>
        </div>
    );
}
