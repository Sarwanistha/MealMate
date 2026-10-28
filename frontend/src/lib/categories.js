// Single source of truth for category / diet / status visuals. No photos: gradient + emoji tiles.

export const CATEGORIES = {
  meals: { label: 'Meals', emoji: '🍛', from: '#F0583A', to: '#A3203A' },
  bakery: { label: 'Bakery', emoji: '🥐', from: '#D6A86B', to: '#B7791F' },
  sweets: { label: 'Sweets', emoji: '🍮', from: '#F472B6', to: '#E11D48' },
  snacks: { label: 'Snacks', emoji: '🌮', from: '#FDE047', to: '#D99A06' },
  fruits_veg: { label: 'Fruits & Veg', emoji: '🥭', from: '#A3E635', to: '#16A34A' },
  beverages: { label: 'Beverages', emoji: '🧋', from: '#38BDF8', to: '#6366F1' },
  groceries: { label: 'Groceries', emoji: '🧺', from: '#2DD4BF', to: '#0F766E' },
}

export const CATEGORY_LIST = Object.entries(CATEGORIES).map(([value, meta]) => ({ value, ...meta }))

export const categoryMeta = (key) => CATEGORIES[key] ?? CATEGORIES.meals

export const DIETS = {
  veg: { label: 'Veg', color: '#16A34A' },
  vegan: { label: 'Vegan', color: '#16A34A' },
  egg: { label: 'Egg', color: '#D97706' },
  nonveg: { label: 'Non-veg', color: '#DC2626' },
}

export const SELLER_TYPES = {
  restaurant: 'Restaurant',
  bakery: 'Bakery',
  home_cook: 'Home cook',
  caterer: 'Caterer',
  store: 'Store',
}

// Order status -> label, emoji, badge classes (work in light + dark)
export const ORDER_STATUS = {
  placed: { label: 'Placed', emoji: '🕒', cls: 'bg-warning-soft text-warning-foreground dark:text-warning' },
  accepted: { label: 'Accepted', emoji: '👍', cls: 'bg-primary-soft text-primary' },
  ready: { label: 'Ready for pickup', emoji: '🛍️', cls: 'bg-success-soft text-success' },
  completed: { label: 'Collected', emoji: '🎉', cls: 'bg-success text-success-foreground' },
  rejected: { label: 'Declined', emoji: '🚫', cls: 'bg-destructive/10 text-destructive' },
  cancelled: { label: 'Cancelled', emoji: '✖️', cls: 'bg-muted text-muted-foreground' },
  expired: { label: 'Expired', emoji: '⌛', cls: 'bg-muted text-muted-foreground' },
  no_show: { label: 'Missed pickup', emoji: '😕', cls: 'bg-destructive/10 text-destructive' },
}

export const ACTIVE_STATUSES = ['placed', 'accepted', 'ready']
// Happy-path steps for the tracking stepper
export const ORDER_STEPS = ['placed', 'accepted', 'ready', 'completed']

export const ROLE_LABEL = { buyer: 'Customer', seller: 'Seller', ngo: 'NGO' }
