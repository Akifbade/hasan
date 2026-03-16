import {
  Document, Page, Text, View, StyleSheet, Image, Font
} from '@react-pdf/renderer'
import { formatDate, formatVolume, formatCurrency } from '@/lib/utils'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '2px solid #1a56db', paddingBottom: 16 },
  logo: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#1a56db' },
  logoSub: { fontSize: 9, color: '#6b7280', marginTop: 2 },
  title: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#1a56db', textAlign: 'right' },
  subtitle: { fontSize: 10, color: '#6b7280', textAlign: 'right' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1a56db', marginBottom: 8, borderBottom: '1px solid #e5e7eb', paddingBottom: 4 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 140, color: '#6b7280' },
  value: { flex: 1, fontFamily: 'Helvetica-Bold' },
  table: { border: '1px solid #e5e7eb', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', padding: '6 8', borderBottom: '1px solid #e5e7eb' },
  tableHeaderCell: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#374151' },
  tableRow: { flexDirection: 'row', padding: '5 8', borderBottom: '1px solid #f9fafb' },
  tableCell: { fontSize: 9, color: '#374151' },
  roomTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', backgroundColor: '#eff6ff', padding: '4 8', marginBottom: 0 },
  volumeBox: { backgroundColor: '#1a56db', padding: '10 16', borderRadius: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  volumeLabel: { color: '#bfdbfe', fontSize: 10 },
  volumeValue: { color: '#ffffff', fontSize: 18, fontFamily: 'Helvetica-Bold' },
  containerBox: { backgroundColor: '#f0fdf4', border: '1px solid #86efac', padding: '8 12', borderRadius: 6, marginBottom: 8 },
  conditionBadge: { fontSize: 8, padding: '1 4', borderRadius: 3 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTop: '1px solid #e5e7eb', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: '#9ca3af' },
  signatureBox: { border: '1px solid #e5e7eb', borderRadius: 4, height: 60, marginTop: 8, justifyContent: 'flex-end', padding: 6 },
  signatureLabel: { fontSize: 8, color: '#9ca3af' },
})

interface Props {
  survey: any
  surveyRequest: any
  rooms: any[]
  finalSurvey: any
  signatureUrl?: string
}

export default function SurveyReport({ survey, surveyRequest, rooms, finalSurvey, signatureUrl }: Props) {
  const totalVolume = rooms.reduce((total, room) => {
    return total + (room.items || []).reduce((t: number, item: any) => {
      return t + (item.length_cm * item.width_cm * item.height_cm * item.quantity) / 1000000
    }, 0)
  }, 0)

  const containerLabels: Record<string, string> = {
    lcl: 'LCL Groupage',
    '20ft': '20ft Container (33.2 m³)',
    '40ft': '40ft Container (67.7 m³)',
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>QGO Relocation</Text>
            <Text style={styles.logoSub}>Professional Moving & Relocation Services</Text>
          </View>
          <View>
            <Text style={styles.title}>SURVEY REPORT</Text>
            <Text style={styles.subtitle}>#{surveyRequest.tracking_code}</Text>
            <Text style={styles.subtitle}>{formatDate(new Date().toISOString())}</Text>
          </View>
        </View>

        {/* Volume Summary */}
        <View style={styles.volumeBox}>
          <View>
            <Text style={styles.volumeLabel}>Total Volume</Text>
            <Text style={styles.volumeValue}>{totalVolume.toFixed(3)} m³</Text>
          </View>
          {finalSurvey?.container_type && (
            <View>
              <Text style={styles.volumeLabel}>Container</Text>
              <Text style={{ color: '#ffffff', fontSize: 12, fontFamily: 'Helvetica-Bold' }}>
                {containerLabels[finalSurvey.container_type]}
              </Text>
            </View>
          )}
          {finalSurvey?.quoted_price && (
            <View>
              <Text style={styles.volumeLabel}>Quoted Price</Text>
              <Text style={{ color: '#ffffff', fontSize: 12, fontFamily: 'Helvetica-Bold' }}>
                {formatCurrency(finalSurvey.quoted_price, finalSurvey.currency)}
              </Text>
            </View>
          )}
        </View>

        {/* Customer Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{surveyRequest.customer_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{surveyRequest.customer_email}</Text>
          </View>
          {surveyRequest.customer_phone && (
            <View style={styles.row}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{surveyRequest.customer_phone}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Pickup Address:</Text>
            <Text style={styles.value}>{surveyRequest.pickup_address}, {surveyRequest.pickup_city}, {surveyRequest.pickup_country}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Destination:</Text>
            <Text style={styles.value}>{surveyRequest.destination_city ? `${surveyRequest.destination_city}, ` : ''}{surveyRequest.destination_country}</Text>
          </View>
          {surveyRequest.property_type && (
            <View style={styles.row}>
              <Text style={styles.label}>Property Type:</Text>
              <Text style={[styles.value, { textTransform: 'capitalize' }]}>{surveyRequest.property_type}</Text>
            </View>
          )}
        </View>

        {/* Shipment Details */}
        {finalSurvey && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipment Details</Text>
            <View style={styles.containerBox}>
              <View style={styles.row}>
                <Text style={styles.label}>Container Type:</Text>
                <Text style={styles.value}>{containerLabels[finalSurvey.container_type] || '-'}</Text>
              </View>
              {finalSurvey.origin_port && (
                <View style={styles.row}>
                  <Text style={styles.label}>Origin Port:</Text>
                  <Text style={styles.value}>{finalSurvey.origin_port}</Text>
                </View>
              )}
              {finalSurvey.destination_port && (
                <View style={styles.row}>
                  <Text style={styles.label}>Destination Port:</Text>
                  <Text style={styles.value}>{finalSurvey.destination_port}</Text>
                </View>
              )}
              {finalSurvey.estimated_departure && (
                <View style={styles.row}>
                  <Text style={styles.label}>Est. Departure:</Text>
                  <Text style={styles.value}>{formatDate(finalSurvey.estimated_departure)}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Inventory */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inventory by Room</Text>
          {rooms.map((room: any) => {
            const roomVol = (room.items || []).reduce((t: number, i: any) =>
              t + (i.length_cm * i.width_cm * i.height_cm * i.quantity) / 1000000, 0)
            return (
              <View key={room.id} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#eff6ff', padding: '4 8', borderBottom: '1px solid #dbeafe' }}>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10 }}>{room.name}</Text>
                  <Text style={{ fontSize: 9, color: '#1a56db' }}>{formatVolume(roomVol)}</Text>
                </View>
                {room.items && room.items.length > 0 && (
                  <View style={styles.table}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Item</Text>
                      <Text style={[styles.tableHeaderCell, { width: 30, textAlign: 'center' }]}>Qty</Text>
                      <Text style={[styles.tableHeaderCell, { width: 80, textAlign: 'center' }]}>L×W×H (cm)</Text>
                      <Text style={[styles.tableHeaderCell, { width: 55, textAlign: 'right' }]}>Volume</Text>
                      <Text style={[styles.tableHeaderCell, { width: 50, textAlign: 'center' }]}>Condition</Text>
                    </View>
                    {room.items.map((item: any) => {
                      const vol = (item.length_cm * item.width_cm * item.height_cm * item.quantity) / 1000000
                      return (
                        <View key={item.id} style={styles.tableRow}>
                          <Text style={[styles.tableCell, { flex: 2 }]}>{item.name}</Text>
                          <Text style={[styles.tableCell, { width: 30, textAlign: 'center' }]}>{item.quantity}</Text>
                          <Text style={[styles.tableCell, { width: 80, textAlign: 'center', color: '#6b7280' }]}>
                            {item.length_cm}×{item.width_cm}×{item.height_cm}
                          </Text>
                          <Text style={[styles.tableCell, { width: 55, textAlign: 'right', color: '#1a56db' }]}>{formatVolume(vol)}</Text>
                          <Text style={[styles.tableCell, { width: 50, textAlign: 'center', color: item.condition === 'good' ? '#16a34a' : item.condition === 'fragile' ? '#ca8a04' : '#dc2626' }]}>
                            {item.condition}
                          </Text>
                        </View>
                      )
                    })}
                  </View>
                )}
              </View>
            )
          })}
        </View>

        {/* Signature */}
        {signatureUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Signature</Text>
            <Image src={signatureUrl} style={{ width: 200, height: 60 }} />
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>QGO Relocation · info@qgorelocation.com · Dubai, UAE</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
