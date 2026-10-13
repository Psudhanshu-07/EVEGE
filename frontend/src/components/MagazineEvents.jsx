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

const referenceEvents = [
  {
    id: 1,
    name: 'Cricket',
    category: 'Sports',
    eventDate: '2026-10-10',
    venue: 'College Ground',
    description: 'Cheer on your college teams at a lively match on the ground.',
    image: '/images/shared-cricket-event.png'
  },
  {
    id: 2,
    name: 'Football',
    category: 'Sports',
    eventDate: '2026-10-12',
    venue: 'Sports Ground',
    description: 'Get together for an exciting match on the sports field.',
    image: '/images/shared-football-event.jpg'
  },
  {
    id: 3,
    name: 'Code Challenge',
    category: 'Technical',
    eventDate: '2025-10-15',
    venue: 'Computer Lab',
    description: 'Take on coding challenges and show off your problem-solving skills.',
    image: '/images/code-challenge-event.jpg'
  },
  {
    id: 4,
    name: 'Robotics',
    category: 'Technical',
    eventDate: '2026-10-16',
    venue: 'Engineering Lab',
    description: 'Explore creative builds and hands-on engineering projects.',
    image: '/images/shared-robotics-event.jpg'
  },
  {
    id: 5,
    name: 'Dance Competition',
    category: 'Cultural',
    eventDate: '2026-10-18',
    venue: 'Auditorium',
    description: 'Celebrate student talent with music, dance and performances.',
    image: '/images/shared-dance-event.jpg'
  },
  {
    id: 6,
    name: 'Singing Competition',
    category: 'Cultural',
    eventDate: '2026-10-19',
    venue: 'Auditorium',
    description: 'Enjoy live performances from talented student singers.',
    image: '/images/shared-singing-event.jpg'
  }
];

function getEventImage(event) {
  if (event.image) return event.image;
  const name = event.title || event.name || '';
  if (images[name]) return images[name];
  const lower = name.toLowerCase();
  if (lower.includes('cricket')) return '/images/shared-cricket-event.png';
  if (lower.includes('football')) return '/images/shared-football-event.jpg';
  if (lower.includes('code') || lower.includes('hack') || lower.includes('tech fest')) return '/images/code-challenge-event.jpg';
  if (lower.includes('robot') || lower.includes('drone')) return '/images/shared-robotics-event.jpg';
  if (lower.includes('dance')) return '/images/shared-dance-event.jpg';
  if (lower.includes('sing') || lower.includes('music')) return '/images/shared-singing-event.jpg';
  if (lower.includes('chess')) return '/images/shared-chess-match.jpg';
  if (lower.includes('game') || lower.includes('gaming')) return '/images/shared-gaming-event.jpg';
  
  const cat = (event.category || '').toLowerCase();
  if (cat.includes('sport')) return '/images/shared-cricket-event.png';
  if (cat.includes('cultur')) return '/images/shared-dance-event.jpg';
  return '/images/code-challenge-event.jpg';
}

function formatDate(value) {
  if (!value) return 'Date to be announced';
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
}

export default function MagazineEvents({ events = [], onRegister }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const sourceEvents = useMemo(() => {
    const refMap = new Map();
    referenceEvents.forEach((ev) => refMap.set(ev.name.toLowerCase(), { ...ev }));

    // Link backend IDs if matching events exist in PostgreSQL
    (events || []).forEach((be) => {
      const name = (be.title || be.name || '').toLowerCase();
      if (refMap.has(name)) {
        refMap.get(name).id = be.id;
      }
    });

    const list = Array.from(refMap.values());

    // Only append newly created custom events (excluding old legacy mock tags)
    const customEvents = (events || []).filter((be) => {
      const name = (be.title || be.name || '').toLowerCase();
      return !refMap.has(name) && !name.includes('[srujanam]') && !name.includes('[naad]');
    }).map((be) => ({
      id: be.id,
      name: be.title || be.name,
      category: be.category || 'Technical',
      eventDate: be.eventDate || '2026-10-25',
      venue: be.venue || 'Campus',
      description: be.description || 'Join us for this exciting campus event.',
      image: getEventImage(be)
    }));

    return [...list, ...customEvents];
  }, [events]);

  const filtered = useMemo(() => sourceEvents.filter((event) => {
    const name = event.title || event.name || '';
    const matchesCategory = category === 'all' || (event.category || '').toLowerCase() === category.toLowerCase();
    return matchesCategory && `${name} ${event.category || ''} ${event.venue || ''}`.toLowerCase().includes(query.toLowerCase());
  }), [sourceEvents, query, category]);

  return (
    <section className="events-section" id="events" aria-labelledby="events-title">
      <div className="section-heading">
        <p className="section-eyebrow">MAKE IT A DAY TO REMEMBER</p>
        <h2 id="events-title">Upcoming Events</h2>
        <p>Explore our upcoming college events</p>
      </div>
      <div className="event-tools">
        <label className="search-box" htmlFor="event-search">
          <span aria-hidden="true">&#x2315;</span>
          <input
            id="event-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search events, categories or venues"
          />
        </label>
        <div className="filter-list" role="group" aria-label="Filter events by category">
          {['all', 'Technical', 'Cultural', 'Sports'].map((value) => (
            <button
              type="button"
              key={value}
              className={`filter-button ${category.toLowerCase() === value.toLowerCase() ? 'active' : ''}`}
              onClick={() => setCategory(value)}
            >
              {value === 'all' ? 'All events' : value}
            </button>
          ))}
        </div>
      </div>
      <div className="event-grid">
        {filtered.length ? filtered.map((event) => {
          const name = event.title || event.name;
          const kind = categoryClass(event.category);
          return (
            <article className="event-card" key={event.id || name}>
              <img
                className="event-image"
                src={event.image || getEventImage(event)}
                alt={`${event.category} event`}
                loading="lazy"
              />
              <div className="event-content">
                <span className={`category ${kind}`}>{event.category}</span>
                <h3>{name}</h3>
                <p className="event-description">
                  {event.description || details[name] || `Join us for this ${String(event.category || 'campus').toLowerCase()} event.`}
                </p>
                <p className="event-meta">
                  <span>&#x1F5D3; {formatDate(event.eventDate)}</span>
                  <span>&#x1F4CD; {event.venue || 'Campus venue'}</span>
                </p>
                <button
                  type="button"
                  className={`register-button ${kind}`}
                  onClick={() => onRegister(event)}
                >
                  Register
                </button>
              </div>
            </article>
          );
        }) : <p className="empty-state">No events match your search. Try another filter.</p>}
      </div>
    </section>
  );
}
