import React, { useMemo, useState } from 'react';

const images = {
  Cricket: '/images/shared-cricket-event.png',
  Football: '/images/shared-football-event.jpg',
  'Code Challenge': '/images/code-challenge-event.jpg',
  Robotics: '/images/shared-robotics-event.jpg',
  'Dance Competition': '/images/shared-dance-event.jpg',
  'Singing Competition': '/images/shared-singing-event.jpg'
};

const details = {
  Cricket: 'Cheer on your college teams at a lively match on the ground.',
  Football: 'Get together for an exciting match on the sports field.',
  'Code Challenge': 'Take on coding challenges and show off your problem-solving skills.',
  Robotics: 'Explore creative builds and hands-on engineering projects.',
  'Dance Competition': 'Celebrate student talent with music, dance and performances.',
  'Singing Competition': 'Enjoy live performances from talented student singers.'
};

function categoryClass(category = '') {
  const value = category.toLowerCase();
  return value.includes('sport') ? 'category-sports' : value.includes('cultur') ? 'category-cultural' : 'category-technical';
}

function formatDate(value) {
  if (!value) return 'Date to be announced';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

export default function MagazineEvents({ events = [], onRegister }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const filtered = useMemo(() => events.filter((event) => {
    const name = event.title || event.name || '';
    const matchesCategory = category === 'all' || event.category === category;
    return matchesCategory && `${name} ${event.category || ''} ${event.venue || ''}`.toLowerCase().includes(query.toLowerCase());
  }), [events, query, category]);

  return (
    <section className="events-section" id="events" aria-labelledby="events-title">
      <div className="section-heading"><p className="section-eyebrow">MAKE IT A DAY TO REMEMBER</p><h2 id="events-title">Upcoming Events</h2><p>Explore our upcoming college events</p></div>
      <div className="event-tools">
        <label className="search-box" htmlFor="event-search"><span aria-hidden="true">⌕</span><input id="event-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search events, categories or venues" /></label>
        <div className="filter-list" role="group" aria-label="Filter events by category">
          {['all', 'Technical', 'Cultural', 'Sports'].map((value) => <button type="button" key={value} className={`filter-button ${category === value ? 'active' : ''}`} onClick={() => setCategory(value)}>{value === 'all' ? 'All events' : value}</button>)}
        </div>
      </div>
      <div className="event-grid">
        {filtered.length ? filtered.map((event) => {
          const name = event.title || event.name;
          const kind = categoryClass(event.category);
          return (
            <article className="event-card" key={event.id}>
              <img className="event-image" src={images[name] || `/images/${kind.replace('category-', '')}-event.jpg`} alt={`${event.category} event`} loading="lazy" />
              <div className="event-content">
                <span className={`category ${kind}`}>{event.category}</span>
                <h3>{name}</h3>
                <p className="event-description">{event.description || details[name] || `Join us for this ${String(event.category || 'campus').toLowerCase()} event.`}</p>
                <p className="event-meta"><span>🗓 {formatDate(event.eventDate)}</span><span>📍 {event.venue || 'Campus venue'}</span></p>
                <button type="button" className={`register-button ${kind}`} onClick={() => onRegister(event)}>Register</button>
              </div>
            </article>
          );
        }) : <p className="empty-state">No events match your search. Try another filter.</p>}
      </div>
    </section>
  );
}
