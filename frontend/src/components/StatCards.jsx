import React from 'react';

export default function StatCards({ stats }) {
  const s = stats || {};
  const cards = [
    {
      label: 'Upcoming Events',
      value: s.totalEvents ?? 0,
      icon: 'bi-calendar-event',
      tint: 'tint-blue'
    },
    {
      label: 'Total Registrations',
      value: s.totalRegistrations ?? 0,
      icon: 'bi-person-check',
      tint: 'tint-green'
    },
    {
      label: 'Total Collected Fees',
      value: `₹${Number(s.totalCollectedFees ?? 0).toFixed(2)}`,
      icon: 'bi-wallet2',
      tint: 'tint-amber'
    },
    {
      label: 'Fest Tracks',
      value: s.festTracks ?? 0,
      icon: 'bi-trophy',
      tint: 'tint-purple'
    }
  ];

  return (
    <div className="row g-3 mb-4">
      {cards.map((card) => (
        <div className="col-12 col-sm-6 col-xl-3" key={card.label}>
          <div className="stat-box">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="stat-label">{card.label}</div>
                <div className="stat-value">{card.value}</div>
              </div>
              <span className={`stat-icon ${card.tint}`}>
                <i className={`bi ${card.icon}`}></i>
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
