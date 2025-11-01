import { NextResponse } from 'next/server';
import { nextTuesday, formatDateCH } from '../../../lib/date';
import { extractChf } from '../../../lib/price';
import { canDeliverBy } from '../../../lib/availability';
import { RETAILERS } from '../../../lib/retailers';
import * as cheerio from 'cheerio';
import { request } from 'undici';

export const dynamic = 'force-dynamic';

function getBest2025Model() {
  // Curated 2025 pick with robust search tokens across CH stores
  return {
    name: 'LG OLED55G5 (G5 OLED, 55")',
    rationale: 'Top OLED 2025 mit sehr guter Helligkeit, Gaming-Features (120/144 Hz), starker Bildverarbeitung und breiter Verf?gbarkeit in der Schweiz.',
    searchTokens: ['OLED55G5', 'LG G5 55', 'LG OLED G5 55'],
  };
}

async function fetchText(url: string): Promise<string> {
  const { body, statusCode } = await request(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; TVFinder/1.0; +https://agentic-4f9d3439.vercel.app)'
    },
  });
  if (statusCode >= 400) throw new Error(`Bad status ${statusCode}`);
  return await body.text();
}

function pickAvailabilityText(html: string): string | null {
  const $ = cheerio.load(html);
  // Try some common containers
  const candidates = [
    $('[class*="availability"], [class*="Availability"]').first().text(),
    $('[class*="stock"], [class*="Stock"]').first().text(),
    $('body').text().slice(0, 20000) // fallback scan in body text subset
  ].filter(Boolean) as string[];
  for (const c of candidates) {
    const slim = c.replace(/\s+/g, ' ').trim();
    if (/(sofort|ab lager|verf?gbar|verfuegbar|lieferbar|in \d+[-?]?\d? tage|werktage|lieferung am)/i.test(slim)) {
      return slim;
    }
  }
  return null;
}

function findFirstPrice(html: string): number | null {
  const $ = cheerio.load(html);
  const textBlocks: string[] = [];
  // Grab likely price nodes
  $('[class*="price"], [class*="Price"], [data-test*="price"]').each((_, el) => {
    textBlocks.push($(el).text());
  });
  // Also scan first part of body text for CHF
  textBlocks.push($('body').text().slice(0, 20000));
  for (const t of textBlocks) {
    const price = extractChf(t.replace(/\s+/g, ' '));
    if (price) return price;
  }
  return null;
}

export async function GET() {
  const now = new Date();
  const target = nextTuesday(now);
  const best = getBest2025Model();

  const offers = await Promise.all(
    RETAILERS.map(async (r) => {
      const url = r.buildSearchUrl(best.searchTokens);
      try {
        const html = await fetchText(url);
        const price = findFirstPrice(html);
        const availability = pickAvailabilityText(html);
        const ok = canDeliverBy(availability, now, target);
        return { retailer: r.name, url, priceChf: price, availabilityText: availability, canDeliverByDate: ok };
      } catch (e) {
        return { retailer: r.name, url, priceChf: null, availabilityText: null, canDeliverByDate: false };
      }
    })
  );

  const eligible = offers.filter(o => o.canDeliverByDate && o.priceChf != null) as { retailer: string; url: string; priceChf: number; availabilityText: string | null; canDeliverByDate: boolean; }[];
  eligible.sort((a, b) => a.priceChf - b.priceChf);

  return NextResponse.json({
    bestModel: best,
    targetDate: formatDateCH(target),
    offers,
    cheapestEligible: eligible[0] ?? null,
  });
}
