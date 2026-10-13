import React, { useMemo, useRef } from 'react';

const sharedPhotos = [
  { name: 'Chess Match', category: 'Sports', image: '/images/shared-chess-match.jpg', details: 'A chess match from the evege community.' },
  { name: 'Campus Sports Event', category: 'Sports', image: '/images/shared-sports-event.jpg', details: 'A team gathering at a campus sports event.' },
  { name: 'Chess Club', category: 'Sports', image: '/images/shared-chess-club.jpg', details: 'Students enjoying a game of chess.' },
  { name: 'Gaming Night', category: 'Technical', image: '/images/shared-gaming-event.jpg', details: 'A gaming moment from the evege community.' }
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
  const dialogRef = useRef(null);
  const items = useMemo(() => [
    ...events.filter((event) => (event.title || event.name) !== 'Code Challenge').map((event) => {
      const name = event.title || event.name;
      return {
        name,
        category: event.category,
        image: eventImages[name] || '/images/technical-event.jpg',
        details: `${event.eventDate || 'Upcoming'} · ${event.venue || 'Campus venue'}`
      };
    }),
    ...sharedPhotos
  ], [events]);

  const openGallery = (item) => {
    const dialog = dialogRef.current;
    dialog.querySelector('.gallery-dialog-image').src = item.image;
    dialog.querySelector('.gallery-dialog-image').alt = `${item.category} event: ${item.name}`;
    dialog.querySelector('.gallery-dialog-title').textContent = item.name;
    dialog.querySelector('.gallery-dialog-category').textContent = item.category;
    dialog.querySelector('.gallery-dialog-details').textContent = item.details;
    dialog.showModal();
  };

  return (
    <section className="gallery-section" aria-labelledby="gallery-title">
      <div className="section-heading">
        <p className="section-eyebrow">LITTLE MOMENTS. BIG MEMORIES.</p>
        <h2 id="gallery-title">Campus gallery</h2>
        <p>Snapshots from the TSDCEM experience</p>
      </div>
      <div className="gallery-grid" aria-label="College event photo gallery">
        {items.map((item, index) => (
          <button className="gallery-item" type="button" key={`${item.name}-${index}`} onClick={() => openGallery(item)} aria-label={`View ${item.name} in the gallery`}>
            <img src={item.image} alt="" loading="lazy" />
            <span className="gallery-item-caption">
              <strong>{item.name}</strong>
              <span>{item.category} &middot; {item.details}</span>
            </span>
          </button>
        ))}
      </div>
      <dialog className="gallery-dialog" ref={dialogRef} aria-labelledby="gallery-dialog-title">
        <button className="gallery-close" type="button" aria-label="Close gallery" onClick={() => dialogRef.current.close()}>&times;</button>
        <img className="gallery-dialog-image" src="" alt="" />
        <div className="gallery-dialog-caption">
          <span className="category gallery-dialog-category"></span>
          <h2 className="gallery-dialog-title" id="gallery-dialog-title"></h2>
          <p className="gallery-dialog-details"></p>
        </div>
      </dialog>
    </section>
  );
}
