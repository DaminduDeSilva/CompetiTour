import io
import re
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.pdfgen import canvas

def _header_footer(canvas, doc):
    canvas.saveState()
    # Header
    canvas.setFont('Helvetica-Bold', 10)
    canvas.setFillColor(colors.HexColor("#64748b"))
    canvas.drawString(inch, letter[1] - 0.5 * inch, "ZeroTrace / CompetiTour")
    canvas.drawRightString(letter[0] - inch, letter[1] - 0.5 * inch, "CONFIDENTIAL AUDIT")
    
    # Footer
    canvas.setFont('Helvetica', 9)
    canvas.setFillColor(colors.HexColor("#94a3b8"))
    canvas.drawString(inch, 0.75 * inch, f"Generated {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} (UTC)")
    canvas.drawRightString(letter[0] - inch, 0.75 * inch, f"Page {doc.page}")
    canvas.restoreState()

def generate_competitiveness_pdf(package_name: str, report_data: dict, components: list) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=inch,
        leftMargin=inch,
        topMargin=inch,
        bottomMargin=inch
    )

    styles = getSampleStyleSheet()
    title_style = styles['Heading1']
    title_style.textColor = colors.HexColor("#0f172a")
    title_style.fontName = 'Helvetica-Bold'
    title_style.fontSize = 20
    
    subtitle_style = styles['Heading2']
    subtitle_style.textColor = colors.HexColor("#1e293b")
    subtitle_style.fontName = 'Helvetica-Bold'
    subtitle_style.fontSize = 14
    subtitle_style.spaceAfter = 10
    
    story = []

    # Title
    story.append(Spacer(1, 0.25 * inch))
    story.append(Paragraph(f"Competitiveness Audit", subtitle_style))
    story.append(Paragraph(package_name, title_style))
    story.append(Spacer(1, 0.1 * inch))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#3b82f6"), spaceAfter=0.3 * inch))

    # Executive Summary Table
    story.append(Paragraph("Executive Summary", subtitle_style))

    market_raw = report_data.get("market", "N/A")
    market_clean = re.sub(r'[^\x00-\x7F]+', '', market_raw).strip()

    summary_data = [
        ["Target Market", market_clean],
        ["Audit Date", report_data.get("date", "N/A")],
        ["DMC Price (USD)", f"${float(report_data.get('dmc_usd', 0)):,.2f}"],
        ["Market Price (USD)", f"${float(report_data.get('market_usd', 0)):,.2f}"],
        ["Pricing Gap", f"{report_data.get('variance', '0%')}"],
        ["Overall Status", report_data.get("status", "N/A").replace("_", " ").title()]
    ]

    summary_table = Table(summary_data, colWidths=[2 * inch, 4.5 * inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#f1f5f9")),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor("#475569")),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor("#0f172a")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1"))
    ]))
    
    story.append(summary_table)
    story.append(Spacer(1, 0.4 * inch))

    # Component Breakdown
    story.append(Paragraph("Component-Level Breakdown", subtitle_style))
    story.append(Spacer(1, 0.1 * inch))

    comp_data = [["Component", "Platform", "OTA Price", "Variance"]]
    
    for comp in components:
        comp_name = comp.get("name", "")
        platform = comp.get("platform", "N/A")
        
        if comp.get("is_unavailable"):
            ota_price = "Sold Out / N/A"
            variance = "—"
        else:
            ota_price = f"${float(comp.get('market_usd', 0)):,.2f}"
            delta = float(comp.get('delta', 0))
            variance = f"+{delta}%" if delta > 0 else f"{delta}%"
            
        comp_data.append([comp_name, platform, ota_price, variance])

    comp_table = Table(comp_data, colWidths=[3 * inch, 1.25 * inch, 1.25 * inch, 1 * inch])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
    ]))
    
    # Alternate row colors
    for i in range(1, len(comp_data)):
        if i % 2 == 0:
            comp_table.setStyle(TableStyle([('BACKGROUND', (0, i), (-1, i), colors.HexColor("#f8fafc"))]))
    
    story.append(comp_table)
    
    # Render PDF
    doc.build(story, onFirstPage=_header_footer, onLaterPages=_header_footer)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
