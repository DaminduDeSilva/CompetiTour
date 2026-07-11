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

    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        textColor=colors.HexColor("#0f172a"),
        fontName='Helvetica-Bold',
        fontSize=20,
        spaceAfter=4,
    )

    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        textColor=colors.HexColor("#1e293b"),
        fontName='Helvetica-Bold',
        fontSize=13,
        spaceAfter=10,
        spaceBefore=16,
    )

    label_style = ParagraphStyle(
        'Label',
        parent=styles['Normal'],
        textColor=colors.HexColor("#475569"),
        fontName='Helvetica',
        fontSize=9,
    )

    story = []

    # ── Title ──────────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.25 * inch))
    story.append(Paragraph("Competitiveness Audit", subtitle_style))
    story.append(Paragraph(package_name, title_style))
    story.append(Spacer(1, 0.1 * inch))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#3b82f6"), spaceAfter=0.3 * inch))

    # ── Audit Summary ──────────────────────────────────────────────────────
    story.append(Paragraph("Audit Summary", subtitle_style))

    markets_raw = report_data.get("markets", report_data.get("market", "N/A"))
    markets_clean = re.sub(r'[^\x00-\x7F]+', '', str(markets_raw)).strip()

    audited = report_data.get("audited_components", "N/A")
    total   = report_data.get("total_components", "N/A")

    summary_data = [
        ["Source Markets",        markets_clean],
        ["Audit Date",            report_data.get("date", "N/A")],
        ["Audited Components",    f"{audited} of {total}"],
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

    # ── Component Breakdown ────────────────────────────────────────────────
    story.append(Paragraph("Component Price Breakdown — Per Market", subtitle_style))
    story.append(Paragraph(
        "Each row shows the OTA-matched equivalent price for this component in the source market's local booking context.",
        label_style
    ))
    story.append(Spacer(1, 0.15 * inch))

    comp_data = [["Component", "Your Cost", "Market", "Platform", "OTA Price", "Delta"]]

    for comp in components:
        comp_name = comp.get("name", "")
        your_cost = comp.get("your_cost_usd")
        your_cost_str = f"${float(your_cost):,.0f}" if your_cost is not None else "N/A"
        comp_type = comp.get("type", "hotel").title()

        market_rows = comp.get("markets", [])

        if not market_rows:
            # Component was not audited
            comp_data.append([f"{comp_name}\n({comp_type})", your_cost_str, "—", "Not Audited", "—", "—"])
            continue

        first = True
        for mkt in market_rows:
            if mkt.get("is_unavailable"):
                ota_price_str = "Sold Out / N/A"
                delta_str = "—"
            else:
                ota_usd = mkt.get("ota_price_usd")
                ota_price_str = f"${float(ota_usd):,.0f}" if ota_usd is not None else "N/A"
                delta = mkt.get("delta")
                if delta is not None:
                    delta_str = f"+{delta:.1f}%" if delta > 0 else f"{delta:.1f}%"
                else:
                    delta_str = "—"

            market_name = mkt.get("market", "Unknown")
            platform    = mkt.get("platform", "N/A")

            if first:
                comp_data.append([
                    f"{comp_name}\n({comp_type})",
                    your_cost_str,
                    market_name,
                    platform,
                    ota_price_str,
                    delta_str
                ])
                first = False
            else:
                # Continuation rows for the same component — no repeat of name/cost
                comp_data.append(["", "", market_name, platform, ota_price_str, delta_str])

    comp_table = Table(
        comp_data,
        colWidths=[1.8 * inch, 0.75 * inch, 1.1 * inch, 1.0 * inch, 0.85 * inch, 0.7 * inch]
    )

    comp_table_style = [
        # Header row
        ('BACKGROUND',    (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('TEXTCOLOR',     (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME',      (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE',      (0, 0), (-1, 0), 9),
        ('ALIGN',         (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME',      (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE',      (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING',    (0, 0), (-1, -1), 6),
        ('INNERGRID',     (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('BOX',           (0, 0), (-1, -1), 1,   colors.HexColor("#cbd5e1")),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
    ]

    # Alternate shading per data row
    for i in range(1, len(comp_data)):
        if i % 2 == 0:
            comp_table_style.append(('BACKGROUND', (0, i), (-1, i), colors.HexColor("#f8fafc")))

    comp_table.setStyle(TableStyle(comp_table_style))
    story.append(comp_table)
    story.append(Spacer(1, 0.2 * inch))

    # Note
    note_style = ParagraphStyle(
        'Note',
        parent=styles['Normal'],
        textColor=colors.HexColor("#94a3b8"),
        fontName='Helvetica-Oblique',
        fontSize=8,
    )
    story.append(Paragraph(
        "Note: OTA prices reflect publicly available rates at time of audit. "
        "Delta (%) = (Your Cost − OTA Price) / OTA Price × 100. "
        "Positive delta indicates your price is above OTA retail; negative indicates below.",
        note_style
    ))

    # ── Render ────────────────────────────────────────────────────────────
    doc.build(story, onFirstPage=_header_footer, onLaterPages=_header_footer)

    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
