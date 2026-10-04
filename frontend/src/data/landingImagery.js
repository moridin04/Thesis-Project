/*
 * Photos for the landing page hero carousel and the flood mosaic.
 * Landing.jsx imports heroCarouselImages and floodMosaicImages.
 * Replacing a file in assets/img updates the picture without layout changes.
 */
import heroFloodJeepney from '../assets/img/hero-flood-jeepney.jpg'
import heroJeepneyCommuter from '../assets/img/hero-jeepney-commuter.jpg'
import floodedMarketAlley from '../assets/img/flooded-market-alley.jpg'
import aftermath from '../assets/img/aftermath.jpg'
import heroFatherSon from '../assets/img/hero-father-son.jpg'
import heroGirlsPlaying from '../assets/img/hero-girls-playing.jpg'
import heroBicycleVendor from '../assets/img/hero-bicycle-vendor.jpg'

/** Shared photographer credits for hero / mosaic attribution. */
const creditTearCordezPexels = {
  photographer: 'Tear Cordez',
  photographerUrl: 'https://www.pexels.com/@teardrop/',
  source: 'Pexels',
  sourceUrl: 'https://www.pexels.com',
}

/** Hero carousel — replace src files in assets/img/ without changing layout code. */
export const heroCarouselImages = [
  {
    src: heroFloodJeepney,
    alt: 'Flooded jeepney on a flooded Metro Manila street during monsoon season.',
    caption:
      'Daily commutes disrupted by rising floodwaters in Metro Manila.',
    credit: creditTearCordezPexels,
  },
  {
    src: heroFatherSon,
    alt: 'A father carrying his young son piggyback through murky floodwater while navigating a flooded residential street.',
    caption:
      'Families adapt to reach safety and shelter when streets become impassable.',
    credit: creditTearCordezPexels,
  },
  {
    src: heroGirlsPlaying,
    alt: 'Children playing and moving through floodwater in a Metro Manila neighborhood.',
    caption:
      'Community and youth press on — flood risk is woven into everyday life.',
    credit: creditTearCordezPexels,
  },
  {
    src: heroBicycleVendor,
    alt: 'A bicycle vendor and customer completing a transaction in ankle-deep floodwater beside a flooded roadside stall.',
    caption:
      'Informal livelihoods continue even as floodwaters disrupt normal commerce.',
    credit: creditTearCordezPexels,
  },
]

/** Everyday Cost mosaic — transport, direct impact, infrastructure aftermath. */
export const floodMosaicImages = [
  {
    id: 'jeepney',
    src: heroJeepneyCommuter,
    alt: 'Commuter stepping off a flooded jeepney in Malabon, Metro Manila',
    caption: 'Flooded streets slow down daily commutes',
    theme: 'Transport Disruption',
  },
  {
    id: 'market-wade',
    src: floodedMarketAlley,
    alt: 'Man and child wading through a flooded market alley lined with clothing stalls',
    caption: 'Residents wade through floodwater just to get by',
    theme: 'Direct Impact',
  },
  {
    id: 'aftermath',
    src: aftermath,
    alt: 'Fallen power pole with tangled wires over a street, residents walking and riding motorcycles past storm debris',
    caption: 'Storms cripple the infrastructure meant to keep communities running',
    theme: 'Infrastructure Aftermath',
  },
]
