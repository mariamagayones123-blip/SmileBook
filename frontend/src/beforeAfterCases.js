// Before & After gallery (grouped by service category).
//
// To add or replace a case:
//   1. Put your two photos in frontend/public/before-after/ (jpg, png, webp or svg)
//   2. Point `before` and `after` to them below
//   3. Set `sample: false` once the photos are real, so the "Sample" badge disappears
//
// `service` must match a service name in your Services list so the
// "Book this service" button can preselect it, and `category` must match
// one of the categories in serviceCategories.js.
export const BEFORE_AFTER_CASES = [
  {
    category: "General & Preventive",
    service: "Dental Check-up",
    note: "A thorough exam spots plaque, cavities and gum problems early, so treatment can start before they get worse.",
    before: '/before-after/dental-checkup-before.svg',
    after: '/before-after/dental-checkup-after.svg',
    sample: true,
  },
  {
    category: "General & Preventive",
    service: "Teeth Cleaning",
    note: "Professional cleaning removes stains and tartar for a brighter, healthier smile.",
    before: '/before-after/teeth-cleaning-before.svg',
    after: '/before-after/teeth-cleaning-after.svg',
    sample: true,
  },
  {
    category: "General & Preventive",
    service: "Tooth Filling",
    note: "A cavity is cleaned and restored so the tooth looks and feels natural again.",
    before: '/before-after/tooth-filling-before.svg',
    after: '/before-after/tooth-filling-after.svg',
    sample: true,
  },
  {
    category: "Orthodontics",
    service: "Braces Adjustment",
    note: "Regular adjustments keep the right tension on your braces so teeth keep moving toward their final position.",
    before: '/before-after/braces-adjustment-before.svg',
    after: '/before-after/braces-adjustment-after.svg',
    sample: true,
  },
  {
    category: "Orthodontics",
    service: "Braces Check-up",
    note: "Check-ups track your progress and make sure your braces are working as planned.",
    before: '/before-after/braces-checkup-before.svg',
    after: '/before-after/braces-checkup-after.svg',
    sample: true,
  },
  {
    category: "Orthodontics",
    service: "Metal Braces Installation",
    note: "Braces gradually guide crooked or crowded teeth into a straighter, aligned smile.",
    before: '/before-after/metal-braces-before.svg',
    after: '/before-after/metal-braces-after.svg',
    sample: true,
  },
  {
    category: "Oral Surgery",
    service: "Alveoloplasty",
    note: "The jawbone ridge is smoothed and reshaped so the area heals well and fits dentures comfortably.",
    before: '/before-after/alveoloplasty-before.svg',
    after: '/before-after/alveoloplasty-after.svg',
    sample: true,
  },
  {
    category: "Oral Surgery",
    service: "Retained Root Removal",
    note: "Leftover tooth roots are removed to prevent infection and let the gum heal cleanly.",
    before: '/before-after/retained-root-removal-before.svg',
    after: '/before-after/retained-root-removal-after.svg',
    sample: true,
  },
  {
    category: "Oral Surgery",
    service: "Tooth Extraction",
    note: "A damaged tooth is gently removed and the area heals cleanly.",
    before: '/before-after/tooth-extraction-before.svg',
    after: '/before-after/tooth-extraction-after.svg',
    sample: true,
  },
]
