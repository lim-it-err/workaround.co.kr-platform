import { EAST_EUROPE_2026 } from './east-europe-2026.js'
import { ICELAND_2025 } from './iceland-2025.js'
import { SPAIN_2024 } from './spain-2024.js'

export const VOYAGES = [EAST_EUROPE_2026, ICELAND_2025, SPAIN_2024]

export const VOYAGE = VOYAGES.find((voyage) => voyage.status === 'boarding') || VOYAGES[0]

export function findVoyageById(voyageId) {
  return VOYAGES.find((voyage) => voyage.id === voyageId) || null
}
