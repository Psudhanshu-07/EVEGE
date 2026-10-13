import React from 'react';

const stories = [
  {
    image: '/images/shared-gaming-event.jpg',
    label: 'Tech pulse',
    title: 'Ideas that turn into action.',
    text: 'Innovation, code, and creativity come together through student-led technical events.'
  },
  {
    image: '/images/shared-team-huddle.jpg',
    label: 'Sports energy',
    title: 'Momentum built through teamwork.',
    text: 'Campus sport days and match-day energy bring the whole community together.'
  },
  {
    image: '/images/shared-dance-event.jpg',
    label: 'Culture & creativity',
    title: 'Moments worth remembering.',
    text: 'From dance nights to performances, campus culture thrives in every celebration.'
  }
];

export default function StoryStrip() {
  return (
    <section className="story-strip" aria-labelledby="story-strip-title">
      <div className="enhanced-section-heading">
        <p className="section-eyebrow">CAMPUS HIGHLIGHTS</p>
        <h2 id="story-strip-title">Inside the EVEGE experience</h2>
      </div>
      <div className="story-grid">
        {stories.map((story) => (
          <article className="story-card" key={story.label}>
            <img src={story.image} alt={story.title} loading="lazy" />
            <div className="story-card-body">
              <span className="story-label">{story.label}</span>
              <h3>{story.title}</h3>
              <p>{story.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
