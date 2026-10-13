import React, { useMemo, useState } from 'react';

const sharedPhotos = [
  ['Chess Match', 'Sports', '/images/shared-chess-match.jpg', 'A chess match from the EVEGE community.'],
  ['Campus Sports Event', 'Sports', '/images/shared-sports-event.jpg', 'A team gathering at a campus sports event.'],
  ['Chess Club', 'Sports', '/images/shared-chess-club.jpg', 'Students enjoying a game of chess.'],
  ['Gaming Night', 'Technical', '/images/shared-gaming-event.jpg', 'A gaming moment from the EVEGE community.']
];

const eventImages = {
  Cricket: '/images/shared-cricket-event.png',
  Football: '/images/shared-football-event.jpg',
  'Code Challenge': '/images/code-challenge-event.jpg',
  Robotics: '/images/shared-robotics-event.jpg',
  'Dance Competition': '/images/shared-dance-event.jpg',
  'Singing Competition': '/images/shared-singing-event.jpg'
};

export default function GallerySection({ events = [] }) {
  const [selected, setSelected] = useState(null);
  const items = useMemo(() => [
    ...events.filter((event) => (event.title || event.name) !== 'Code Challenge').map((event) => {
      const name = event.title || event.name;
      return [name, event.category, eventImages[name] || '/images/technical-event.jpg',
        `${event.eventDate || 'Upcoming'} · ${event.venue || 'Campus venue'}`];
    }),
    ...sharedPhotos
  ], [events]);

  return (
    <section className="gallery-section" aria-labelledby="gallery-title">
      <div className="enhanced-section-heading">
        <p className="section-eyebrow">LITTLE MOMENTS. BIG MEMORIES.</p>
        <h2 id="gallery-title">Campus gallery</h2>
        <p>Snapshots from the EVEGE experience</p>
      </div>
      <div className="gallery-grid">
        {items.map(([name, category, image, details], index) => (
          <button className="gallery-item" type="button" key={`${name}-${index}`} onClick={() => setSelected({ name, category, image, details })}>
            <img src={image} alt={name} loading="lazy" />
            <span className="gallery-item-caption"><strong>{name}</strong><small>{category}</small></span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={selected.name} onClick={() => setSelected(null)}>
          <div className="gallery-lightbox-card" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="gallery-close" onClick={() => setSelected(null)} aria-label="Close gallery">&times;</button>
            <img src={selected.image} alt={selected.name} />
            <div><span className="story-label">{selected.category}</span><h3>{selected.name}</h3><p>{selected.details}</p></div>
          </div>
        </div>
      )}
    </section>
  );
}
