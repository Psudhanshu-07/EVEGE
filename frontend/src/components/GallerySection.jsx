import React, { useMemo, useRef } from 'react';

const defaultGalleryItems = [
  {
    name: 'Cricket',
    category: 'Sports',
    image: '/images/shared-cricket-event.png',
    details: 'Sports · Oct 10, 2026 · College Ground'
  },
  {
    name: 'Football',
    category: 'Sports',
    image: '/images/shared-football-event.jpg',
    details: 'Sports · Oct 12, 2026 · Sports Ground'
  },
  {
    name: 'Robotics',
    category: 'Technical',
    image: '/images/shared-robotics-event.jpg',
    details: 'Technical · Oct 16, 2026 · Engineering Lab'
  },
  {
    name: 'Dance Competition',
    category: 'Cultural',
    image: '/images/shared-dance-event.jpg',
    details: 'Cultural · Oct 18, 2026 · Auditorium'
  },
  {
    name: 'Singing Competition',
    category: 'Cultural',
    image: '/images/shared-singing-event.jpg',
    details: 'Cultural · Oct 19, 2026 · Auditorium'
  },
  {
    name: 'Chess Match',
    category: 'Sports',
    image: '/images/shared-chess-match.jpg',
    details: 'Sports · A chess match from the evege community.'
  },
  {
    name: 'Campus Sports Event',
    category: 'Sports',
    image: '/images/shared-sports-event.jpg',
    details: 'Sports · A team gathering at a campus sports event.'
  },
  {
    name: 'Chess Club',
    category: 'Sports',
    image: '/images/shared-chess-club.jpg',
    details: 'Sports · Students enjoying a game of chess.'
  },
  {
    name: 'Gaming Night',
    category: 'Technical',
    image: '/images/shared-gaming-event.jpg',
    details: 'Technical · A gaming moment from the evege community.'
  }
];

export default function GallerySection({ events = [] }) {
  const dialogRef = useRef(null);

  const items = useMemo(() => {
    // If dynamic events exist, keep the canonical 9 items first then append extra events
    const defaultNames = new Set(defaultGalleryItems.map((d) => d.name.toLowerCase()));
    const extraEvents = events
      .filter((ev) => {
        const title = (ev.title || ev.name || '').toLowerCase();
        return !defaultNames.has(title) && title !== 'code challenge';
      })
      .map((ev) => ({
        name: ev.title || ev.name,
        category: ev.category || 'Event',
        image: ev.imageUrl || '/images/technical-event.jpg',
        details: `${ev.category || 'Event'} · ${ev.eventDate || 'Upcoming'} · ${ev.venue || 'Campus'}`
      }));
    return [...defaultGalleryItems, ...extraEvents];
  }, [events]);

  const openGallery = (item) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const img = dialog.querySelector('.gallery-dialog-image');
    if (img) {
      img.src = item.image;
      img.alt = `${item.category} event: ${item.name}`;
    }
    const title = dialog.querySelector('.gallery-dialog-title');
    if (title) title.textContent = item.name;
    const cat = dialog.querySelector('.gallery-dialog-category');
    if (cat) cat.textContent = item.category;
    const det = dialog.querySelector('.gallery-dialog-details');
    if (det) det.textContent = item.details;
    dialog.showModal();
  };

  return (
    <section className="gallery-section" id="gallery" aria-labelledby="gallery-title">
      <div className="gallery-header-wrapper">
        <button
          type="button"
          className="gallery-dismiss-btn"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="Back to top"
        >
          &times;
        </button>
        <div className="section-heading">
          <p className="section-eyebrow">LITTLE MOMENTS. BIG MEMORIES.</p>
          <h2 id="gallery-title">Campus gallery</h2>
          <p>Snapshots from the TSDCEM experience</p>
        </div>
      </div>
      <div className="gallery-grid" aria-label="College event photo gallery">
        {items.map((item, index) => (
          <button
            className="gallery-item"
            type="button"
            key={`${item.name}-${index}`}
            onClick={() => openGallery(item)}
            aria-label={`View ${item.name} in the gallery`}
          >
            <img src={item.image} alt="" loading="lazy" />
            <span className="gallery-item-caption">
              <strong>{item.name}</strong>
              <span>{item.details}</span>
            </span>
          </button>
        ))}
      </div>
      <dialog className="gallery-dialog" ref={dialogRef} aria-labelledby="gallery-dialog-title">
        <button
          className="gallery-close"
          type="button"
          aria-label="Close gallery"
          onClick={() => dialogRef.current?.close()}
        >
          &times;
        </button>
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
