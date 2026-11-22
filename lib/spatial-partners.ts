// Shared option lists for the Spatial Partner Registry, used by the public
// form, the API route's validation and the admin view so they never drift.

export const PRACTICE_TYPES = {
  architecture: 'Architecture',
  interior_design: 'Interior Design',
  architecture_interiors: 'Architecture + Interiors',
  hospitality_design: 'Hospitality Design',
  landscape: 'Landscape & Outdoor',
  styling: 'Styling & Set Design',
  other: 'Other spatial practice',
} as const

export const PROJECT_FOCUS = {
  residential: 'Private residences',
  hospitality: 'Hospitality',
  workplace: 'Workplace',
  retail: 'Retail & gallery',
  wellness: 'Wellness & retreat',
  cultural: 'Cultural & public',
} as const

export const TIMELINES = {
  active_now: 'Active project now',
  within_3_months: 'Within 3 months',
  within_6_months: 'Within 6 months',
  exploring: 'Building our library',
} as const

export const PARTNER_STATUSES = {
  pending_review: 'Pending Review',
  approved: 'Approved',
  waitlisted: 'Waitlisted',
  declined: 'Declined',
} as const

export type PracticeType = keyof typeof PRACTICE_TYPES
export type ProjectFocus = keyof typeof PROJECT_FOCUS
export type Timeline = keyof typeof TIMELINES
export type PartnerStatus = keyof typeof PARTNER_STATUSES

export function isKeyOf<T extends object>(map: T, value: string): value is Extract<keyof T, string> {
  return Object.prototype.hasOwnProperty.call(map, value)
}
