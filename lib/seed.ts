import { createWedding, newEvent, type Wedding } from './wedding'

// Reference wedding: the original Shad Ali & Kohinoor invitation, expressed as data.
const shadKohinoor: Wedding = {
  id: 'seed-shad-kohinoor',
  slug: 'shad-kohinoor',
  status: 'published',
  template: 'royal',
  partner1: 'Shad Ali',
  partner2: 'Kohinoor',
  connector: 'weds',
  date: '2026-07-10',
  time: '10:00',
  timezone: 'Asia/Kolkata',
  copy: {
    coverEyebrow: 'A luminous invitation',
    coverMessage: 'Open a modern celebration of faith, love, light, and unforgettable moments.',
    openingLine: 'BISMILLAH-IR-RAHMAN-IR-RAHIM',
    heroEyebrow: 'With love, prayers, and joy',
    heroMessage: 'With love, prayers, and joy, we invite you to celebrate our wedding.',
    countdownTitle: 'Counting down to Rasm-E-Nikah.',
    familyHeading: 'From Shad and Kohinoor family',
    childrenIntro: 'A graceful space for the younger hearts in the family, arranged neatly in one row.',
    footerNote: 'May your presence make our day complete.',
  },
  families: {
    sideA: { label: 'Groom side', title: "Shad Ali's Family", description: 'Joined together in love, prayers, and celebration.', members: [] },
    sideB: { label: 'Bride side', title: "Kohinoor's Family", description: 'A warm circle of blessings around the wedding day.', members: [] },
    note: { label: 'A special request', title: 'A warm request from both families.', description: 'Please keep us in your prayers and grace the occasion with your presence.' },
  },
  children: ['Amir Hamza'],
  events: [
    newEvent({ id: 'e1', name: 'Rasm-E-Baan & Haldi', date: '2026-07-07', dressCode: 'Yellow' }),
    newEvent({ id: 'e2', name: 'Rasm-E-Mehndi', date: '2026-07-09', time: '21:00', dressCode: 'Dark Green' }),
    newEvent({ id: 'e3', name: 'Rasm-E-Nikah', date: '2026-07-10', time: '10:00', dressCode: 'Formal & Casual', venueName: 'Husaini Masjid, Chounkuti', venueAddress: 'Husaini Masjid, Chounkuti' }),
    newEvent({ id: 'e4', name: 'Departure of Bharat', date: '2026-07-10', time: '20:00' }),
    newEvent({ id: 'e5', name: 'Dawat-E-Walima', date: '2026-07-12', time: '20:00', dressCode: 'Formal', venueName: 'PMV Palace, Old Gajner Road Bridge', venueAddress: 'PMV Palace, Old Gajner Road Bridge' }),
  ],
  gallery: [],
  couplePhoto: null,
  musicUrl: '/wedding-music.mp3',
  features: { countdown: true, family: true, venues: true, children: true, gallery: true, rsvp: true, music: true },
  rsvp: { maxGuests: 4 },
}

// Two clearly fictional sample drafts so the other templates can be previewed.
function sample(partner1: string, partner2: string, date: string, template: Wedding['template'], venue: string): Wedding {
  const w = createWedding({ partner1, partner2, date, time: '17:00', timezone: 'Asia/Kolkata', template, venue, takenSlugs: [] })
  return { ...w, id: `seed-${w.slug}` }
}

export const seedWeddings: Wedding[] = [
  shadKohinoor,
  sample('Rahul', 'Priya', '2027-02-14', 'floral', 'Rose Garden Lawns, Jaipur'),
  sample('Aman', 'Sana', '2027-03-20', 'minimal', 'The Courtyard Hall, Jaipur'),
]

/** Weddings the public /w/[slug] route may serve without a backend. */
export const publicWeddings = seedWeddings.filter((w) => w.status === 'published')
