export const SERVICE_CATEGORIES = [
  'General & Preventive',
  'Orthodontics',
  'Oral Surgery',
]

export function categoryForService(service) {
  if (SERVICE_CATEGORIES.includes(service.category)) return service.category

  const name = service.name.toLowerCase()
  if (name.includes('braces') || name.includes('retainer')) return 'Orthodontics'
  if (name.includes('extraction') || name.includes('wisdom')) return 'Oral Surgery'
  return 'General & Preventive'
}
