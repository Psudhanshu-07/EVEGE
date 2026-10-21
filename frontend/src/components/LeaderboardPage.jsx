import React, { useEffect, useState } from 'react';
import { leaderboard, myLeaderboardResults } from '../services/apiService';

const CATEGMeta = {
  Sports: { icon: '🏆', blurb: 'Inter-college matches, athletics meets and leagues.' },
  Cultural: { icon: '🎭', blurb: 'Dance, drama, music and stage competitions.' },
  Techfest: { icon: '🤖', blurb: 'Hackathons, robotics, coding marathons and showcases.' }
};

export default function LeaderboardPage({ category, currentUser, onBack, onPickCategory }) {
  const [data, setData] = useState(null);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);
    leaderboard(category)
      .then((r) => { if (alive) setData(r.data); })
      .catch((e) => { if (alive) setErr(e?.response?.data?.message || 'Leaderboard unavailable.'); })
      .finally(() => { if (alive) setLoading(false); });
    if (currentUser?.email) {
      myLeaderboardResults(category)
        .then((r) => { if (alive) setMine(r.data || []); })
        .catch(() => {});
    }
    return () => { alive = false; };
  }, [category, currentUser?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  const rankClass = (i) => (i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '');

  return (
    <div className="feature-shell">
      <button type="button" className="feature-back" onClick={onBack}>
        <i className="bi bi-arrow-left me-1"></i> Back to Home
      </button>

      <div className="feature-hero mb-4">
        <h2>{CATEGMeta[category]?.icon} {category} Leaderboard</h2>
        <p>{CATEGMeta[category]?.blurb} Standings aggregate verified event scores from the current academic year.</p>
      </div>

      <ul className="nav nav-pills mb-4" role="tablist">
        {Object.keys(CATEGMeta).map((c) => (
          <li key={c} className="nav-item">
            <button
              type="button"
              className={`nav-link ${c === category ? 'active' : ''}`}
              onClick={() => onPickCategory(c)}
            >
              {CATEGMeta[c].icon} {c}
            </button>
          </li>
        ))}
      </ul>

      {loading && <div className="form-card py-5 text-center"><div className="spinner-border text-primary"></div></div>}

      {!loading && err && (
        <div className="form-card text-center py-5"><i className="bi bi-wifi-off fs-1 text-danger d-block"></i><p className="mt-3 mb-0">{err}</p></div>
      )}

      {!loading && data && (
        <>
          <div className="feature-stats">
            <div className="feature-stat"><div className="num">{data.totalEvents}</div><div className="lbl">{category} events</div></div>
            <div className="feature-stat"><div className="num">{data.totalEligible}</div><div className="lbl">Eligible participants</div></div>
            <div className="feature-stat"><div className="num" style={{ fontSize: '0.95rem' }}>{data.scoringPeriod}</div><div className="lbl">Scoring period</div></div>
            <div className="feature-stat"><div className="num" style={{ fontSize: '0.8rem' }}>{(data.lastUpdated || '').replace('T', ' ').slice(0, 19)}</div><div className="lbl">Last updated</div></div>
          </div>

          <div className="row g-4">
            <div className="col-lg-6">
              <h5 className="fw-bold mb-2">Class / Division ranking</h5>
              {data.divisionStandings.length === 0 ? (
                <div className="form-card text-muted text-center py-4 small mb-3">No division scores recorded yet.</div>
              ) : (
                <table className="leader-table mb-4">
                  <thead><tr><th>Rank</th><th>Division</th><th>Total points</th><th>Participants</th></tr></thead>
                  <tbody>
                    {data.divisionStandings.map((d, i) => (
                      <tr key={d.division}>
                        <td><span className={`rank-badge ${rankClass(i)}`}>{d.rank}</span></td>
                        <td className="fw-bold">{d.division}</td>
                        <td>{d.points}</td>
                        <td>{d.participants}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <h5 className="fw-bold mb-2">Branch ranking</h5>
              {data.branchStandings.length === 0 ? (
                <div className="form-card text-muted text-center py-4 small">No branch scores recorded yet.</div>
              ) : (
                <table className="leader-table">
                  <thead><tr><th>Rank</th><th>Branch</th><th>Total points</th><th>Participants</th></tr></thead>
                  <tbody>
                    {data.branchStandings.map((b, i) => (
                      <tr key={b.branch}>
                        <td><span className={`rank-badge ${rankClass(i)}`}>{b.rank}</span></td>
                        <td className="fw-bold">{b.branch}</td>
                        <td>{b.points}</td>
                        <td>{b.participants}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="col-lg-6">
              <h5 className="fw-bold mb-2">Top individuals</h5>
              {data.individuals.length === 0 ? (
                <div className="form-card text-muted text-center py-4 small">No scores recorded yet — results appear after the admin publishes marks.</div>
              ) : (
                <table className="leader-table mb-4">
                  <thead><tr><th>#</th><th>Participant</th><th>Events</th><th>Marks</th></tr></thead>
                  <tbody>
                    {data.individuals.slice(0, 10).map((p, i) => (
                      <tr key={p.name + i} className={currentUser && p.name === (currentUser.fullName || currentUser.email) ? 'me' : ''}>
                        <td><span className={`rank-badge ${rankClass(i)}`}>{i + 1}</span></td>
                        <td>{p.name}</td>
                        <td>{p.events}</td>
                        <td className="fw-bold">{p.marks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {data.externals.length > 0 && (
                <>
                  <h5 className="fw-bold mb-2">External participants</h5>
                  <table className="leader-table">
                    <thead><tr><th>#</th><th>Participant</th><th>Points</th></tr></thead>
                    <tbody>
                      {data.externals.map((p, i) => (
                        <tr key={p.name + i}>
                          <td>{i + 1}</td>
                          <td>{p.name}</td>
                          <td className="fw-bold">{p.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-muted small mt-2 mb-0">
                    External college guests are ranked separately and never enter internal division standings.
                  </p>
                </>
              )}

              {currentUser && mine.length > 0 && (
                <>
                  <h5 className="fw-bold mt-4 mb-2">My results in {category}</h5>
                  <table className="leader-table">
                    <thead><tr><th>Event</th><th>Marks</th></tr></thead>
                    <tbody>
                      {mine.map((m) => (
                        <tr key={m.id}><td>{m.eventCategory} #{m.eventId}</td><td className="fw-bold">{m.marks}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              <p className="text-muted small mt-3 mb-0"><i className="bi bi-info-circle me-1"></i>{data.tieRule}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
