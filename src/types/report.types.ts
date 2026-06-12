export type ReportTargetType = 'user' | 'event' | 'review'
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'

export interface Report {
  id: string
  reporter_id: string
  target_type: ReportTargetType
  target_id: string
  reason: string
  details: string | null
  status: ReportStatus
  resolved_by: string | null
  created_at: string
  resolved_at: string | null
}
