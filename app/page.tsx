"use client";
import { useEffect, useState } from 'react';

type Offer = {
  retailer: string;
  url: string;
  priceChf: number | null;
  availabilityText: string | null;
  canDeliverByDate: boolean;
};

type Result = {
  bestModel: {
    name: string;
    rationale: string;
    searchTokens: string[];
  };
  targetDate: string;
  offers: Offer[];
  cheapestEligible: Offer | null;
};

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/find', { cache: 'no-store' });
      if (!res.ok) throw new Error('Fehler bei der Suche');
      const data: Result = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e?.message ?? 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { run(); }, []);

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1 className="h1">Bester 55" Fernseher 2025 ? Schweiz</h1>
          <p className="sub">Automatische Suche nach dem besten Modell und dem g?nstigsten Anbieter, der bis Dienstag liefern kann.</p>
        </div>
        <button className="btn" onClick={run} disabled={loading}>
          {loading ? <span className="spinner"/> : null}
          <span>{loading ? 'Suche l?uft?' : 'Neu suchen'}</span>
        </button>
      </div>

      <div className="card">
        {!result && !error && <p>Suche wird initial ausgef?hrt?</p>}
        {error && <p style={{color:'#fca5a5'}}>Fehler: {error}</p>}
        {result && (
          <div>
            <p className="small">Lieferziel: <span className="mono">{result.targetDate}</span></p>
            <h2 style={{marginTop:8}}>Empfohlenes Modell</h2>
            <p><strong>{result.bestModel.name}</strong></p>
            <p className="small">Begr?ndung: {result.bestModel.rationale}</p>

            <h3 style={{marginTop:18}}>Angebote in der Schweiz</h3>
            <div className="row">
              {result.offers.map((o) => (
                <div key={o.retailer} className="offer">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span><strong>{o.retailer}</strong></span>
                    {o.canDeliverByDate ? <span className="badge">Lieferbar bis Di</span> : null}
                  </div>
                  <div className="price">{o.priceChf ? `CHF ${o.priceChf.toLocaleString('de-CH', { minimumFractionDigits: 2 })}` : 'Preis n/a'}</div>
                  <div className="small">{o.availabilityText ?? 'Verf?gbarkeit unbekannt'}</div>
                  <a className="link small" href={o.url} target="_blank" rel="noreferrer">Zum Angebot</a>
                </div>
              ))}
            </div>

            <div className="card" style={{marginTop:18}}>
              <h3>G?nstigster Anbieter (lieferbar bis Dienstag)</h3>
              {result.cheapestEligible ? (
                <p>
                  <strong>{result.cheapestEligible.retailer}</strong>: CHF {result.cheapestEligible.priceChf?.toLocaleString('de-CH', { minimumFractionDigits: 2 })}
                  {' '}? <a className="link" href={result.cheapestEligible.url} target="_blank" rel="noreferrer">Jetzt ansehen</a>
                </p>
              ) : (
                <p>Kein Anbieter mit best?tigter Lieferung bis Dienstag gefunden. Pr?fe Verf?gbarkeit manuell ?ber die Links.</p>
              )}
            </div>
          </div>
        )}
      </div>
      <p className="footer small">Hinweis: Verf?gbarkeiten werden heuristisch ermittelt ("Sofort lieferbar", "Ab Lager", Zeitangaben). Bitte final auf H?ndlerseite pr?fen.</p>
    </div>
  );
}
