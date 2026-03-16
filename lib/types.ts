export type UserRole = 'super_admin' | 'admin' | 'surveyor' | 'agent'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  phone?: string
  branch_id?: string
  is_available: boolean
  avatar_url?: string
  created_at: string
}

export interface Branch {
  id: string
  name: string
  city?: string
  country?: string
  email?: string
  phone?: string
}

export interface SurveyRequest {
  id: string
  tracking_token: string
  tracking_code: string
  branch_id?: string
  agent_id?: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  customer_whatsapp?: string
  pickup_address: string
  pickup_city?: string
  pickup_country: string
  destination_country?: string
  destination_city?: string
  preferred_date?: string
  property_type?: string
  notes?: string
  status: SurveyStatus
  documents_uploaded: boolean
  created_at: string
  updated_at: string
  // joins
  survey_assignments?: SurveyAssignment[]
}

export type SurveyStatus =
  | 'pending' | 'assigned' | 'in_progress' | 'completed'
  | 'cancelled' | 'quoted' | 'invoice_sent' | 'paid'

export interface SurveyAssignment {
  id: string
  survey_request_id: string
  surveyor_id: string
  assigned_at: string
  scheduled_date?: string
  started_at?: string
  completed_at?: string
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  profiles?: Profile
}

export interface Room {
  id: string
  survey_request_id: string
  name: string
  name_ar?: string
  order_index: number
  photo_urls: string[]
  notes?: string
  items?: Item[]
}

export interface Item {
  id: string
  room_id: string
  library_item_id?: string
  name: string
  name_ar?: string
  length_cm: number
  width_cm: number
  height_cm: number
  quantity: number
  condition: 'good' | 'fragile' | 'damaged'
  photo_urls: string[]
  notes?: string
  is_manual: boolean
  volume_m3?: number
}

export interface ItemCategory {
  id: string
  name: string
  name_ar?: string
  icon?: string
  order_index: number
  item_library?: ItemLibrary[]
}

export interface ItemLibrary {
  id: string
  category_id: string
  name: string
  name_ar?: string
  default_length_cm: number
  default_width_cm: number
  default_height_cm: number
  icon?: string
}

export interface Survey {
  id: string
  survey_request_id: string
  surveyor_id: string
  total_volume_m3: number
  container_type: 'lcl' | '20ft' | '40ft'
  fill_percentage: number
  origin_port?: string
  destination_port?: string
  estimated_departure?: string
  estimated_arrival?: string
  quoted_price?: number
  currency: string
  price_breakdown?: Record<string, number>
  special_notes?: string
  signature_url?: string
  pdf_url?: string
  completed_at: string
}

export interface GpsLocation {
  id: string
  surveyor_id: string
  survey_request_id?: string
  lat: number
  lng: number
  accuracy?: number
  speed?: number
  recorded_at: string
}

export interface ChatMessage {
  id: string
  survey_request_id: string
  sender_id?: string
  sender_email?: string
  sender_name: string
  sender_role: 'admin' | 'surveyor' | 'customer'
  message: string
  is_read: boolean
  created_at: string
}

export interface Invoice {
  id: string
  survey_id: string
  survey_request_id: string
  invoice_number: string
  amount: number
  currency: string
  payment_method?: string
  payment_status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  stripe_payment_intent_id?: string
  paid_at?: string
  pdf_url?: string
  due_date?: string
  created_at: string
}
