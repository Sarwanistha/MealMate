// Food photos served from /public/images (downloaded from Unsplash, free to use under the Unsplash License).
// There is no image field on listings, so a photo is picked from a pool by category + title keywords,
// and varied per listing with its id.

const POOLS = {
  biryani: ['m1', 'm2', 'm7', 'm8'],
  thali: ['m3', 'm4', 'm9', 'm10', 'm6'],
  croissant: ['b1', 'b4'],
  bakery: ['b2', 'b5', 'b6'],
  jamun: ['s3'],
  sweets: ['s1', 's2', 's4'],
  dosa: ['n1', 'n2', 'n3', 'n4'],
  snacks: ['n5', 'n1', 'n4'],
  fruit: ['f1', 'f3', 'f4'],
  veg: ['f5', 'f6', 'f7'],
  beverages: ['v1', 'v2', 'v3', 'v5'],
  groceries: ['g1', 'g2', 'g3', 'f7'],
}

function poolFor(category, title = '') {
  const t = title.toLowerCase()
  switch (category) {
    case 'meals':
      return /biryani|fried rice|curry|rice box/.test(t) ? POOLS.biryani : POOLS.thali
    case 'bakery':
      return /croissant/.test(t) ? POOLS.croissant : POOLS.bakery
    case 'sweets':
      return /jamun/.test(t) ? POOLS.jamun : POOLS.sweets
    case 'snacks':
      return /dosa|wrap|taco/.test(t) ? POOLS.dosa : POOLS.snacks
    case 'fruits_veg':
      return /veg|bag/.test(t) && !/fruit/.test(t) ? POOLS.veg : POOLS.fruit
    case 'beverages':
      return POOLS.beverages
    case 'groceries':
      return POOLS.groceries
    default:
      return POOLS.thali
  }
}

export const photoUrl = (key) => `/images/${key}.jpg`

/** item: anything with category, title and an id / listing_id (listing, order item, form preview). */
export function foodPhoto(item) {
  if (!item?.category) return null
  const pool = poolFor(item.category, item.title)
  const seed = Number(item.id ?? item.listing_id ?? 0) || 0
  return photoUrl(pool[seed % pool.length])
}

// Named shots for the landing page
export const SHOTS = {
  thali: photoUrl('m3'),
  platter: photoUrl('m10'),
  biryani: photoUrl('m2'),
  croissants: photoUrl('b1'),
  bakeryShop: photoUrl('b2'),
  fruits: photoUrl('f3'),
  sweets: photoUrl('s3'),
  volunteers: photoUrl('c3'),
  handover: photoUrl('c4'),
  packing: photoUrl('c2'),
  sorting: photoUrl('c1'),
}

// One representative photo per category (chips, marquee)
export const CATEGORY_PHOTO = {
  meals: photoUrl('m1'),
  bakery: photoUrl('b1'),
  sweets: photoUrl('s3'),
  snacks: photoUrl('n1'),
  fruits_veg: photoUrl('f3'),
  beverages: photoUrl('v3'),
  groceries: photoUrl('g1'),
}
