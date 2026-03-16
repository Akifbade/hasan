export function surveyRequestConfirmationEmail(data: {
  customerName: string
  trackingCode: string
  appUrl: string
  pickupAddress: string
  destinationCountry: string
  preferredDate?: string
}): { subject: string; html: string } {
  return {
    subject: `Survey Request Confirmed - #${data.trackingCode} | QGO Relocation`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f3f4f6; padding: 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1a56db, #1e40af); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">QGO Relocation</h1>
      <p style="color: #bfdbfe; margin: 8px 0 0;">Professional Moving & Relocation Services</p>
    </div>
    <!-- Body -->
    <div style="padding: 32px;">
      <h2 style="color: #1a1a1a; margin: 0 0 8px;">Survey Request Confirmed! ✅</h2>
      <p style="color: #6b7280; margin: 0 0 24px;">Dear ${data.customerName},</p>
      <p style="color: #374151; margin: 0 0 24px;">
        Thank you for requesting a survey with QGO Relocation. We've received your request and our team will contact you within 24 hours to confirm your survey appointment.
      </p>
      <!-- Tracking Code -->
      <div style="background: #eff6ff; border: 2px solid #bfdbfe; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px;">
        <p style="color: #1d4ed8; font-size: 12px; font-weight: 600; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Your Tracking Code</p>
        <p style="color: #1e40af; font-size: 32px; font-weight: 900; margin: 0; letter-spacing: 4px; font-family: monospace;">${data.trackingCode}</p>
        <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0;">Keep this code to track your survey status</p>
      </div>
      <!-- Details -->
      <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
        <p style="color: #374151; font-size: 14px; margin: 0 0 8px;"><strong>📍 From:</strong> ${data.pickupAddress}</p>
        <p style="color: #374151; font-size: 14px; margin: 0 0 8px;"><strong>🌍 To:</strong> ${data.destinationCountry}</p>
        ${data.preferredDate ? `<p style="color: #374151; font-size: 14px; margin: 0;"><strong>📅 Preferred Date:</strong> ${data.preferredDate}</p>` : ''}
      </div>
      <!-- CTA -->
      <div style="text-align: center;">
        <a href="${data.appUrl}/track?code=${data.trackingCode}" style="display: inline-block; background: #1a56db; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">
          Track My Survey 📍
        </a>
      </div>
    </div>
    <!-- Footer -->
    <div style="background: #1f2937; padding: 20px; text-align: center;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">QGO Relocation · Dubai, UAE · info@qgorelocation.com</p>
    </div>
  </div>
</body>
</html>
    `,
  }
}

export function surveyorAssignedEmail(data: {
  customerName: string
  surveyorName: string
  scheduledDate?: string
  trackingCode: string
  appUrl: string
}): { subject: string; html: string } {
  return {
    subject: `Surveyor Assigned - #${data.trackingCode} | QGO Relocation`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f3f4f6; padding: 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
    <div style="background: linear-gradient(135deg, #059669, #047857); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">QGO Relocation</h1>
    </div>
    <div style="padding: 32px;">
      <h2 style="color: #1a1a1a; margin: 0 0 8px;">Surveyor Assigned! 👷</h2>
      <p style="color: #374151; margin: 0 0 24px;">
        Dear ${data.customerName}, great news! A surveyor has been assigned to your request.
      </p>
      <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 20px; margin: 0 0 24px;">
        <p style="color: #166534; font-weight: 700; font-size: 16px; margin: 0 0 4px;">👷 ${data.surveyorName}</p>
        ${data.scheduledDate ? `<p style="color: #374151; margin: 0;">📅 ${data.scheduledDate}</p>` : ''}
      </div>
      <div style="text-align: center;">
        <a href="${data.appUrl}/track?code=${data.trackingCode}" style="display: inline-block; background: #059669; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700;">
          Track Surveyor Live 📍
        </a>
      </div>
    </div>
    <div style="background: #1f2937; padding: 20px; text-align: center;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">QGO Relocation · info@qgorelocation.com</p>
    </div>
  </div>
</body>
</html>
    `,
  }
}

export function surveyCompletedEmail(data: {
  customerName: string
  trackingCode: string
  totalVolume: number
  containerType?: string
  quotedPrice?: number
  currency?: string
  pdfUrl?: string
  appUrl: string
}): { subject: string; html: string } {
  const containerLabels: Record<string, string> = {
    lcl: 'LCL Groupage', '20ft': '20ft Container', '40ft': '40ft Container',
  }
  return {
    subject: `Survey Completed - Quote Ready #${data.trackingCode} | QGO Relocation`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f3f4f6; padding: 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
    <div style="background: linear-gradient(135deg, #7c3aed, #5b21b6); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">QGO Relocation</h1>
    </div>
    <div style="padding: 32px;">
      <h2 style="color: #1a1a1a; margin: 0 0 8px;">Survey Complete! 🎉</h2>
      <p style="color: #374151; margin: 0 0 24px;">
        Dear ${data.customerName}, your home survey is complete and your quote is ready.
      </p>
      <div style="background: #f5f3ff; border: 2px solid #c4b5fd; border-radius: 12px; padding: 20px; margin: 0 0 24px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #7c3aed; font-weight: 600;">Total Volume:</span>
          <span style="font-weight: 700;">${data.totalVolume.toFixed(3)} m³</span>
        </div>
        ${data.containerType ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #7c3aed; font-weight: 600;">Container:</span>
          <span style="font-weight: 700;">${containerLabels[data.containerType] || data.containerType}</span>
        </div>` : ''}
        ${data.quotedPrice ? `
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #7c3aed; font-weight: 600;">Quoted Price:</span>
          <span style="font-weight: 900; font-size: 18px; color: #7c3aed;">${data.currency || 'USD'} ${data.quotedPrice.toLocaleString()}</span>
        </div>` : ''}
      </div>
      <div style="text-align: center; display: flex; gap: 12px; justify-content: center;">
        <a href="${data.appUrl}/track?code=${data.trackingCode}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 700;">
          View Full Report
        </a>
        ${data.pdfUrl ? `<a href="${data.pdfUrl}" style="display: inline-block; background: #6b7280; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 700;">Download PDF</a>` : ''}
      </div>
    </div>
    <div style="background: #1f2937; padding: 20px; text-align: center;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">QGO Relocation · info@qgorelocation.com</p>
    </div>
  </div>
</body>
</html>
    `,
  }
}
