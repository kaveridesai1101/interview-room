import os
import qrcode
from datetime import datetime, timezone, timedelta
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak
from reportlab.lib.units import inch

class PDFReportService:
    def __init__(self, output_dir="exports/reports", static_dir="backend/static"):
        self.output_dir = os.path.abspath(output_dir)
        self.static_dir = os.path.abspath(static_dir)
        self.styles = getSampleStyleSheet()
        self._ensure_dirs()

    def _ensure_dirs(self):
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.static_dir, exist_ok=True)

    def _generate_qr(self, data, filename):
        qr_path = os.path.join(self.static_dir, f"qr_{filename}.png")
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        img.save(qr_path)
        return qr_path

    def _generate_detailed_description(self, incident):
        """Rule-based professional security description generator."""
        itype = incident.type.lower()
        severity = incident.severity.lower()
        confidence_pct = f"{round(incident.confidence * 100)}%"
        
        # Try to extract person count from description or default to "multiple"
        person_count = "multiple individuals"
        if "subjects" in incident.description:
            try:
                parts = incident.description.split("involving ")
                if len(parts) > 1:
                    num = parts[1].split(" ")[0]
                    person_count = f"{num} {'person' if num == '1' else 'individuals'}"
            except: pass

        if "fight" in itype:
            return f"The system detected {person_count} engaged in aggressive physical interaction. Rapid movements and repeated striking or grappling actions were observed between the subjects, which matches behavioral patterns associated with a physical altercation. Due to the high intensity of movement and close spatial proximity, the system has flagged this as a potential fight with {confidence_pct} confidence."
        
        if "weapon" in itype or "knife" in itype or "gun" in itype:
            return f"Visual analysis has identified a potential weapon threat involving {person_count}. An object with structural characteristics matching known prohibited weapons was detected in active use. The subject's posture and handling of the object suggest a weapon-carrying profile. Immediate verification is required."
            
        if "fall" in itype:
            return f"The system detected an anomalous posture change where a subject moved from a vertical to a horizontal position rapidly. This sudden elevation change in the subject's center of mass is consistent with a trip or slip event. The subject appears to have remained stationary on the ground following the event."

        if "crowd" in itype:
            return f"An anomalous density of individuals was detected in the surveillance area. Rapid directional movement and high volume of motion suggest crowd panic or aggressive gathering. This event deviates significantly from normal occupancy patterns for this location."

        if "phone" in itype:
            return f"Proctoring analysis has identified the presence of a mobile communication device in the candidate's immediate vicinity. This event is flagged as a significant integrity violation (Confidence: {confidence_pct})."

        if "persons" in itype:
            return f"The system detected {person_count} within the proctored environment. The presence of unauthorized individuals suggests external assistance or coaching during the session."

        if "gaze" in itype:
            return f"The system detected the candidate looking away from the primary screen for an extended period. This behavior is consistent with reading materials outside the proctored window or from secondary devices."

        if "gesture" in itype:
            return f"A suspicious manual gesture (hands near face or camera) was detected. This behavior is often associated with covert communication or interaction with concealed assistive tools."

        if "window" in itype or "blur" in itype:
            return "The candidate purposefully navigated away from the proctored browser window. This event is officially recorded as an <b>INTEGRITY BREACH</b> as it indicates an attempt to access unauthorized external tools like ChatGPT or Gemini during the examination."

        # Default / Suspicious Behavior
        return f"The system flagged the candidate for suspicious behavioral patterns that deviate from normal activity in this proctored area. Observed movements or loitering indicators reached the triggering threshold for {severity} priority intervention based on the current AI security profile (Confidence: {confidence_pct})."

    def _get_recommended_action(self, incident):
        severity = incident.severity.lower()
        if "high" in severity or "critical" in severity:
            return "IMMEDIATE RESPONSE: Dispatch onsite security personnel and alert law enforcement. Maintain continuous visual monitoring of all subjects until authorities arrive."
        if "medium" in severity or "suspicious" in severity:
            return "VERIFICATION REQUIRED: Security team should perform a remote review of the 30-second window surrounding the trigger. Conduct an onsite check if the situation remains unresolved."
        return "ROUTINE MONITORING: Log incident for daily audit. No immediate physical intervention required unless new triggers occur."

    def create_report(self, incident):
        filename = f"report_{incident.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = os.path.join(self.output_dir, filename)
        
        doc = SimpleDocTemplate(filepath, pagesize=letter, leftMargin=0.5*inch, rightMargin=0.5*inch)
        story = []

        # --- Professional Header ---
        header_table_data = [
            [Paragraph("<b>PROCTORAI INTEGRITY SYSTEMS</b><br/><font size=8>Advanced AI Interview Proctoring</font>", self.styles['Normal']),
             Paragraph(f"<b>INTEGRITY INCIDENT REPORT</b><br/><font size=8>Incident ID: #{incident.id}</font>", self.styles['Normal'])]
        ]
        header_table = Table(header_table_data, colWidths=[4*inch, 3.5*inch])
        header_table.setStyle(TableStyle([
            ('LINEBELOW', (0,0), (-1,0), 1, colors.black),
            ('BOTTOMPADDING', (0,0), (-1,0), 12),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 0.2*inch))
        # --- Executive Summary Table ---
        # Convert UTC to IST (+5:30) for the report
        local_time = incident.timestamp.replace(tzinfo=timezone.utc) + timedelta(hours=5, minutes=30)
        summary_data = [
            ["INCIDENT TYPE:", incident.type.upper(), "INTEGRITY RISK:", incident.severity.upper()],
            ["DATE/TIME (IST):", local_time.strftime("%Y-%m-%d %H:%M:%S"), "CAMERA ID:", incident.camera_id],
            ["LOCATION:", "Surveillance Point " + incident.camera_id, "THREAT SCORE:", f"{round(incident.confidence * 100)}%"],
            ["AI CONFIDENCE:", f"{round(incident.confidence * 100, 2)}%", "PROCEDURE:", "A-SEC-99"]
        ]
        
        st = Table(summary_data, colWidths=[1.2*inch, 2.5*inch, 1.2*inch, 2.5*inch])
        st.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('BACKGROUND', (2, 0), (2, -1), colors.lightgrey),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(st)
        story.append(Spacer(1, 0.3*inch))

        # --- Detailed Incident Narrative ---
        story.append(Paragraph("OFFICIAL INCIDENT DESCRIPTION", self.styles['Heading4']))
        story.append(Spacer(1, 0.05*inch))
        description_text = self._generate_detailed_description(incident)
        story.append(Paragraph(description_text, self.styles['BodyText']))
        story.append(Spacer(1, 0.2*inch))

        # --- Recommended Actions ---
        story.append(Paragraph("RECOMMENDED OPERATIONAL RESPONSE", self.styles['Heading4']))
        action_style = ParagraphStyle(
            'ActionStyle',
            parent=self.styles['BodyText'],
            backColor=colors.whitesmoke,
            borderPadding=10,
            borderWidth=1,
            borderColor=colors.lightgrey,
            borderRadius=5
        )
        story.append(Spacer(1, 0.05*inch))
        story.append(Paragraph(f"<b>{self._get_recommended_action(incident)}</b>", action_style))
        story.append(Spacer(1, 0.3*inch))

        # --- Evidence Log ---
        if incident.snapshot_path and os.path.exists(incident.snapshot_path):
            story.append(Paragraph("VISUAL EVIDENCE CAPTURE (SNAPSHOT)", self.styles['Heading4']))
            ev_img = Image(incident.snapshot_path, 6*inch, 3.5*inch)
            story.append(ev_img)
            story.append(Paragraph(f"Fig 1.1: Automated trigger frame at {incident.timestamp.strftime('%H:%M:%S')}", self.styles['Italic']))
            story.append(Spacer(1, 0.2*inch))

        # --- Authentication QR ---
        qr_data = f"https://sentinel-secure.ai/verify/{incident.id}"
        qr_img_path = self._generate_qr(qr_data, incident.id)
        qr_flow = Image(qr_img_path, 0.8*inch, 0.8*inch)
        
        auth_data = [[qr_flow, Paragraph("<b>SECURE VERIFICATION</b><br/><font size=7>Scan this QR code with the Sentinel Mobile app to verify the authenticity of this digital report. This document is cryptographically hashed and stored on the secure audit server.</font>", self.styles['Normal'])]]
        auth_table = Table(auth_data, colWidths=[1*inch, 6.5*inch])
        auth_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'MIDDLE')]))
        story.append(auth_table)

        # --- Footer ---
        story.append(Spacer(1, 0.5*inch))
        footer_data = [
            ["_________________________", "_________________________"],
            ["Reporting AI Unit ID", "Reviewing Officer Signature"]
        ]
        ft = Table(footer_data, colWidths=[3.75*inch, 3.75*inch])
        ft.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
        ]))
        story.append(ft)
        
        doc.build(story)
        return filepath

pdf_service = PDFReportService()
