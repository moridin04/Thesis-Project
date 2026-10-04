"""Comprehensive staff/admin PDF report.

Source: src/ML-thesis-updated/Manila_Barangay_Flood_Risk_Pipeline.ipynb, appendix cell
"Comprehensive PDF Report Generator with Clear Tables" (the cell that writes
Manila_Barangay_Flood_Risk_Comprehensive_Report_READABLE.pdf). Styles, helpers, section
order, wording and table layout are kept as in the notebook. Differences:

* Inputs are only the stored ML outputs in src/ML-thesis-updated/Output (the ml-final
  files); nothing is re-run. The notebook's in-memory DataFrames are replaced by the same
  CSV fallbacks the notebook itself uses.
* Charts are the PNGs the notebook saved next to those CSVs, embedded at the notebook's
  size, instead of being redrawn with matplotlib.
* "Generated:" is the real build time in Asia/Manila, and page 1's footer also carries
  the data version (SHA-256 over every input file).
"""

from __future__ import annotations

import hashlib
from datetime import datetime
from pathlib import Path
from typing import BinaryIO, Union
from zoneinfo import ZoneInfo

import numpy as np
import pandas as pd
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Image, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

ML_OUTPUT_DIR = Path(__file__).resolve().parents[3] / "src" / "ML-thesis-updated" / "Output"
MANILA_TZ = ZoneInfo("Asia/Manila")

INPUT_FILES = (
    "barangay_flood_risk_predictions.csv",
    "model_comparison_results.csv",
    "entropy_component_weights.csv",
    "feature_importance_gradient_boosting.csv",
    "feature_importance_random_forest.csv",
    "permutation_feature_importance.csv",
    "dpi_component_class_summary.csv",
    "top_rank_explanation.csv",
    "high_dpi_medium_flood_audit.csv",
    "elevation_outlier_audit.csv",
    "population_change_sensitivity_audit.csv",
    "chart_entropy_weights.png",
    "chart_risk_class_counts.png",
    "chart_model_comparison.png",
    "chart_gb_importance.png",
    "chart_rf_importance.png",
    "chart_perm_importance.png",
)

SECTION_TITLES = (
    "1. Project Overview",
    "2. Methodological Summary",
    "3. Exposure-Weight Interpretation",
    "4. Entropy Component Weights",
    "5. DPI Risk Class Distribution",
    "6. DPI Component and Class Summary",
    "7. Top-Ranked Barangays by DPI",
    "8. High-DPI but medium-Flood Audit",
    "9. Elevation Outlier Audit",
    "10. Population-Change Sensitivity Audit",
    "11. Machine Learning Model Comparison",
    "12. Gradient Boosting Feature Importance",
    "13. Random Forest Feature Importance",
    "14. Permutation Importance",
    "15. Limitations and Usage Notes",
)


class MissingReportInput(RuntimeError):
    pass


def input_paths(output_dir: Path | None = None) -> list[Path]:
    base = output_dir or ML_OUTPUT_DIR
    return [base / name for name in INPUT_FILES]


def report_data_version(output_dir: Path | None = None) -> str:
    """Short SHA-256 over every input file, so any change to the ML outputs is a new version."""
    digest = hashlib.sha256()
    for path in input_paths(output_dir):
        if not path.is_file():
            raise MissingReportInput(f"Missing report input: {path.name}")
        digest.update(path.name.encode())
        digest.update(path.read_bytes())
    return digest.hexdigest()[:16]


# ------------------------------------------------------------
# 2. Styles
# ------------------------------------------------------------

styles = getSampleStyleSheet()

TITLE_STYLE = ParagraphStyle(
    "CustomTitle",
    parent=styles["Title"],
    fontSize=18,
    leading=22,
    alignment=TA_CENTER,
    spaceAfter=14,
)

SUBTITLE_STYLE = ParagraphStyle(
    "CustomSubtitle",
    parent=styles["Normal"],
    fontSize=11,
    leading=15,
    alignment=TA_CENTER,
    textColor=colors.darkslategray,
    spaceAfter=18,
)

SECTION_STYLE = ParagraphStyle(
    "SectionHeading",
    parent=styles["Heading1"],
    fontSize=14,
    leading=18,
    spaceBefore=12,
    spaceAfter=8,
    textColor=colors.HexColor("#1F4E79"),
)

SUBSECTION_STYLE = ParagraphStyle(
    "SubsectionHeading",
    parent=styles["Heading2"],
    fontSize=11,
    leading=14,
    spaceBefore=8,
    spaceAfter=6,
    textColor=colors.HexColor("#2F5597"),
)

BODY_STYLE = ParagraphStyle(
    "BodyTextCustom",
    parent=styles["BodyText"],
    fontSize=9,
    leading=13,
    alignment=TA_LEFT,
    spaceAfter=8,
)

NOTE_STYLE = ParagraphStyle(
    "NoteStyle",
    parent=styles["BodyText"],
    fontSize=8,
    leading=11,
    textColor=colors.dimgray,
    leftIndent=8,
    rightIndent=8,
    spaceAfter=8,
)

TABLE_CELL_STYLE = ParagraphStyle(
    "TableCell",
    parent=styles["BodyText"],
    fontSize=6.5,
    leading=8,
    alignment=TA_CENTER,
)

TABLE_HEADER_STYLE = ParagraphStyle(
    "TableHeader",
    parent=styles["BodyText"],
    fontSize=6.5,
    leading=8,
    alignment=TA_CENTER,
    textColor=colors.white,
)

SMALL_TABLE_CELL_STYLE = ParagraphStyle(
    "SmallTableCell",
    parent=styles["BodyText"],
    fontSize=6,
    leading=7,
    alignment=TA_CENTER,
)

SMALL_TABLE_HEADER_STYLE = ParagraphStyle(
    "SmallTableHeader",
    parent=styles["BodyText"],
    fontSize=6,
    leading=7,
    alignment=TA_CENTER,
    textColor=colors.white,
)


# ------------------------------------------------------------
# 3. Helper Functions
# ------------------------------------------------------------


def safe_read_csv(path):
    path = Path(path)
    if path.exists():
        return pd.read_csv(path)
    return None


def clean_value(value, decimals=4):
    if pd.isna(value):
        return ""

    if isinstance(value, float):
        return f"{value:.{decimals}f}"

    if isinstance(value, (int, np.integer)):
        return f"{value:,}"

    value = str(value)

    # Shorten very long dictionary strings, usually best params
    if len(value) > 120:
        value = value[:117] + "..."

    return value


def prepare_table_data(df, decimals=4, max_text_len=120, small=False):
    """
    Convert a dataframe into ReportLab Paragraph table data.
    This prevents columns from being visually merged.
    """
    if df is None or df.empty:
        return None

    cell_style = SMALL_TABLE_CELL_STYLE if small else TABLE_CELL_STYLE
    header_style = SMALL_TABLE_HEADER_STYLE if small else TABLE_HEADER_STYLE

    # Header row
    data = []
    header_row = []
    for col in df.columns:
        col_text = str(col).replace("_", "_<br/>")
        header_row.append(Paragraph(col_text, header_style))
    data.append(header_row)

    # Body rows
    for _, row in df.iterrows():
        body_row = []
        for value in row:
            value_text = clean_value(value, decimals=decimals)
            if len(value_text) > max_text_len:
                value_text = value_text[: max_text_len - 3] + "..."
            value_text = value_text.replace("_", "_<br/>")
            body_row.append(Paragraph(value_text, cell_style))
        data.append(body_row)

    return data


def get_table_style():
    return TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2F5597")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 1), (-1, -1), 4),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F2F2F2")]),
        ]
    )


def add_table(
    story,
    title,
    df,
    note=None,
    max_rows=25,
    preferred_cols=None,
    column_groups=None,
    repeat_header=True,
    page_break_before=True,
):
    """
    Add a readable table to the PDF.

    If column_groups is provided, the dataframe is split into multiple smaller tables.
    This is the best way to avoid compressed unreadable wide tables.
    """
    if page_break_before:
        story.append(PageBreak())

    story.append(Paragraph(title, SECTION_STYLE))

    if note:
        story.append(Paragraph(note, NOTE_STYLE))

    if df is None or df.empty:
        story.append(Paragraph("No data available for this section.", BODY_STYLE))
        return

    display_df = df.copy()

    if preferred_cols is not None:
        existing_cols = [c for c in preferred_cols if c in display_df.columns]
        if existing_cols:
            display_df = display_df[existing_cols]

    if max_rows is not None and len(display_df) > max_rows:
        display_df = display_df.head(max_rows)
        story.append(Paragraph(f"Showing first {max_rows} rows for readability.", NOTE_STYLE))

    # If column groups are provided, create separate tables
    if column_groups:
        for group_title, cols in column_groups:
            existing_cols = [c for c in cols if c in display_df.columns]
            if not existing_cols:
                continue

            group_df = display_df[existing_cols].copy()

            story.append(Spacer(1, 0.15 * inch))
            story.append(Paragraph(group_title, SUBSECTION_STYLE))

            table_data = prepare_table_data(group_df, small=(len(existing_cols) > 8))

            available_width = landscape(A4)[0] - 1.0 * inch
            col_width = available_width / len(existing_cols)
            col_widths = [col_width] * len(existing_cols)

            table = Table(table_data, colWidths=col_widths, repeatRows=1 if repeat_header else 0, hAlign="CENTER")

            table.setStyle(get_table_style())
            story.append(table)
            story.append(Spacer(1, 0.2 * inch))

        return

    # Normal single table
    num_cols = display_df.shape[1]
    table_data = prepare_table_data(display_df, small=(num_cols > 8))

    available_width = landscape(A4)[0] - 1.0 * inch
    col_width = available_width / num_cols
    col_widths = [col_width] * num_cols

    table = Table(table_data, colWidths=col_widths, repeatRows=1 if repeat_header else 0, hAlign="CENTER")

    table.setStyle(get_table_style())
    story.append(table)


def add_chart(story, title, chart_path, note=None):
    """The notebook's add_bar_chart page, using the chart PNG it saved."""
    story.append(PageBreak())
    story.append(Paragraph(title, SECTION_STYLE))

    if note:
        story.append(Paragraph(note, NOTE_STYLE))

    story.append(Image(str(chart_path), width=9.2 * inch, height=5.0 * inch))


# ------------------------------------------------------------
# 6. Build the PDF Report
# ------------------------------------------------------------


def build_comprehensive_report(
    output_path_or_buffer: Union[str, Path, BinaryIO],
    *,
    generated_at: datetime | None = None,
    output_dir: Path | None = None,
) -> dict:
    """Write the PDF and return {"generated_at", "data_version", "page_count"}."""
    base = output_dir or ML_OUTPUT_DIR
    data_version = report_data_version(base)
    moment = (generated_at or datetime.now(MANILA_TZ)).astimezone(MANILA_TZ)
    GENERATED_AT = moment.strftime("%Y-%m-%d %H:%M:%S") + " (Asia/Manila)"

    # ------------------------------------------------------------
    # 4. Load Result Tables
    # ------------------------------------------------------------

    df_predictions = safe_read_csv(base / "barangay_flood_risk_predictions.csv")
    df_model_results = safe_read_csv(base / "model_comparison_results.csv")
    df_entropy = safe_read_csv(base / "entropy_component_weights.csv")
    df_gb_importance = safe_read_csv(base / "feature_importance_gradient_boosting.csv")
    df_rf_importance = safe_read_csv(base / "feature_importance_random_forest.csv")
    df_perm_importance = safe_read_csv(base / "permutation_feature_importance.csv")
    df_component_summary = safe_read_csv(base / "dpi_component_class_summary.csv")
    df_top_rank = safe_read_csv(base / "top_rank_explanation.csv")
    df_high_dpi_medium_flood = safe_read_csv(base / "high_dpi_medium_flood_audit.csv")
    df_elevation_audit = safe_read_csv(base / "elevation_outlier_audit.csv")
    df_population_sensitivity = safe_read_csv(base / "population_change_sensitivity_audit.csv")

    # ------------------------------------------------------------
    # 5. Generate Missing Summary Tables If Needed
    # ------------------------------------------------------------

    if df_predictions is not None and "DPI_Risk_Class" in df_predictions.columns:
        risk_class_counts = (
            df_predictions["DPI_Risk_Class"].value_counts().rename_axis("DPI_Risk_Class").reset_index(name="Barangay_Count")
        )
    else:
        risk_class_counts = None

    if df_component_summary is None and df_predictions is not None and "DPI_Risk_Class" in df_predictions.columns:
        summary_cols = [
            "DPI_Scaled",
            "Flood_PCT_25yr",
            "Population_2024",
            "Affected_Population_25yr",
            "Elevation_Mean",
            "Hazard",
            "CSI",
            "Exposure",
            "Vulnerability",
        ]

        existing = [c for c in summary_cols if c in df_predictions.columns]

        agg = {
            f"Mean_{c}": (c, "mean") for c in existing if pd.api.types.is_numeric_dtype(df_predictions[c])
        }

        df_component_summary = (
            df_predictions.groupby("DPI_Risk_Class")
            .agg(Barangay_Count=("DPI_Risk_Class", "count"), **agg)
            .reset_index()
        )

    if df_top_rank is None and df_predictions is not None:
        if "DPI_Rank" in df_predictions.columns:
            df_top_rank = df_predictions.sort_values("DPI_Rank", ascending=True).head(25)
        elif "DPI_Scaled" in df_predictions.columns:
            df_top_rank = df_predictions.sort_values("DPI_Scaled", ascending=False).head(25)

    def add_footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(colors.grey)
        page_num = canvas.getPageNumber()
        canvas.drawCentredString(landscape(A4)[0] / 2, 0.35 * inch, f"Generated: {GENERATED_AT} | Page {page_num}")
        canvas.restoreState()

    def add_first_page_footer(canvas, doc):
        add_footer(canvas, doc)
        canvas.saveState()
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(colors.grey)
        canvas.drawCentredString(
            landscape(A4)[0] / 2,
            0.22 * inch,
            f"Data version: {data_version} (SHA-256 of the ML output files this report reads)",
        )
        canvas.restoreState()

    doc = SimpleDocTemplate(
        output_path_or_buffer if not isinstance(output_path_or_buffer, Path) else str(output_path_or_buffer),
        pagesize=landscape(A4),
        rightMargin=0.45 * inch,
        leftMargin=0.45 * inch,
        topMargin=0.45 * inch,
        bottomMargin=0.55 * inch,
        title="Manila Barangay Flood Risk Priority Classification Report",
    )

    story = []

    # ------------------------------------------------------------
    # Cover Page
    # ------------------------------------------------------------

    story.append(Spacer(1, 1.0 * inch))
    story.append(Paragraph("Manila Barangay Flood Risk Priority Classification Report", TITLE_STYLE))
    story.append(
        Paragraph(
            "Disaster Prioritization Index (DPI) and Machine Learning Classification-Reproduction Results",
            SUBTITLE_STYLE,
        )
    )

    cover_info = """
<b>Study Area:</b> City of Manila, Philippines<br/>
<b>Unit of Analysis:</b> Barangay-level total enumeration<br/>
<b>Expected Barangay Count:</b> 897 barangays<br/>
<b>Main Outputs:</b> Disaster Prioritization Index, Low/Medium/High priority classes, machine learning model comparison, barangay ranking table, diagnostic audit tables, and feature importance results.<br/>
<b>Generated:</b> {}
""".format(GENERATED_AT)

    story.append(Paragraph(cover_info, BODY_STYLE))
    story.append(PageBreak())

    # ------------------------------------------------------------
    # Text Sections
    # ------------------------------------------------------------

    story.append(Paragraph("1. Project Overview", SECTION_STYLE))
    story.append(
        Paragraph(
            """
This report summarizes the outputs of the Manila barangay-level flood risk priority classification pipeline. The study covers all 897 barangays of the City of Manila and integrates LiPAD 5-year and 25-year flood hazard layers, PSA 2020 and PSA 2024 population data, barangay administrative information, and DEM-derived elevation.
""",
            BODY_STYLE,
        )
    )

    story.append(
        Paragraph(
            """
The 100-year flood layer is excluded from the main Disaster Prioritization Index and machine learning feature set because it failed return-period consistency checks. The Disaster Prioritization Index combines three major components: Hazard, Exposure, and Vulnerability. Component scores are normalized and combined using entropy-derived weights.
""",
            BODY_STYLE,
        )
    )

    story.append(
        Paragraph(
            """
The machine learning stage is interpreted as a classification-reproduction experiment. The target variable is the DPI-derived risk class. Therefore, model performance indicates how well selected raw and engineered features reproduce the DPI-derived priority structure. It should not be interpreted as independent prediction of actual flood events, flood damage, casualties, or future flood conditions.
""",
            BODY_STYLE,
        )
    )

    story.append(Spacer(1, 0.15 * inch))

    story.append(Paragraph("2. Methodological Summary", SECTION_STYLE))
    story.append(
        Paragraph(
            """
<b>Spatial Processing:</b> Flood polygons are intersected with barangay boundaries to compute flood area and flood percentage for 5-year and 25-year return-period scenarios. Area-related calculations are performed using EPSG:32651.
""",
            BODY_STYLE,
        )
    )
    story.append(
        Paragraph(
            """
<b>Population Integration:</b> PSA 2020 and PSA 2024 barangay-level population values are integrated. Population change and population density per hectare are computed for vulnerability assessment and machine learning.
""",
            BODY_STYLE,
        )
    )
    story.append(
        Paragraph(
            """
<b>Affected Population:</b> Affected population is estimated by multiplying barangay population by flood percentage. This assumes uniform population distribution within each barangay.
""",
            BODY_STYLE,
        )
    )
    story.append(
        Paragraph(
            """
<b>DPI Computation:</b> Hazard, Exposure, and Vulnerability component scores are computed from normalized indicators. Entropy weighting is then applied to determine final component weights. DPI scores are scaled from 0 to 100 and classified into Low, Medium, and High priority groups using tertiles.
""",
            BODY_STYLE,
        )
    )

    story.append(Spacer(1, 0.15 * inch))

    story.append(Paragraph("3. Exposure-Weight Interpretation", SECTION_STYLE))
    story.append(
        Paragraph(
            """
The entropy-weighted DPI may assign a larger weight to the Exposure component when affected-population values vary more strongly across barangays than the Hazard or Vulnerability components. This does not mean that hazard or vulnerability indicators are unimportant. Instead, it means that, within the Manila barangay dataset, differences in potentially affected population are a major source of variation in final priority scores.
""",
            BODY_STYLE,
        )
    )
    story.append(
        Paragraph(
            """
As a result, some highly populated barangays may rank highly even if their flood coverage percentage is lower than that of smaller barangays. This is consistent with a disaster-prioritization objective, where the number of potentially affected residents is an important consideration for preparedness planning, monitoring, and resource allocation.
""",
            BODY_STYLE,
        )
    )

    # ------------------------------------------------------------
    # Entropy Weights
    # ------------------------------------------------------------

    add_table(
        story,
        "4. Entropy Component Weights",
        df_entropy,
        note="Entropy weights describe the data-driven contribution of Hazard, Exposure, and Vulnerability to the final DPI.",
        max_rows=10,
        preferred_cols=["Component", "Entropy_Value", "Diversification_Value", "Entropy_Weight"],
        page_break_before=True,
    )

    if df_entropy is not None:
        component_col = "Component" if "Component" in df_entropy.columns else None
        weight_col = "Entropy_Weight" if "Entropy_Weight" in df_entropy.columns else None

        if component_col and weight_col:
            add_chart(
                story,
                "Entropy Weights by DPI Component",
                base / "chart_entropy_weights.png",
                note="Higher entropy weight indicates greater component contribution based on data dispersion.",
            )

    # ------------------------------------------------------------
    # Risk Class Distribution
    # ------------------------------------------------------------

    add_table(
        story,
        "5. DPI Risk Class Distribution",
        risk_class_counts,
        note="Tertile classification produces equal Low, Medium, and High priority groups.",
        max_rows=10,
        preferred_cols=["DPI_Risk_Class", "Barangay_Count"],
        page_break_before=True,
    )

    if risk_class_counts is not None:
        add_chart(
            story,
            "DPI Risk Class Counts",
            base / "chart_risk_class_counts.png",
            note="The classes are relative priority tertiles within Manila.",
        )

    # ------------------------------------------------------------
    # Component Summary
    # ------------------------------------------------------------

    component_summary_groups = [
        ("DPI and Count", ["DPI_Risk_Class", "Barangay_Count", "Mean_DPI", "Min_DPI", "Max_DPI"]),
        (
            "Component and Hazard Summary",
            ["DPI_Risk_Class", "Mean_Hazard", "Mean_CSI", "Mean_Exposure", "Mean_Vulnerability", "Mean_Flood_25yr"],
        ),
        (
            "Population and Elevation Summary",
            ["DPI_Risk_Class", "Mean_Population_2024", "Mean_Affected_Population_25yr", "Mean_Elevation"],
        ),
    ]

    add_table(
        story,
        "6. DPI Component and Class Summary",
        df_component_summary,
        note="Wide tables are split into smaller sub-tables to improve readability.",
        max_rows=10,
        column_groups=component_summary_groups,
        page_break_before=True,
    )

    # ------------------------------------------------------------
    # Top-Ranked Barangays
    # ------------------------------------------------------------

    top_rank_groups = [
        ("Identification and Ranking", ["DPI_Rank", "Barangay", "Barangay_No", "DPI_Risk_Class", "DPI_Scaled"]),
        ("Population and Flood Exposure", ["Barangay", "Population_2024", "Flood_PCT_25yr", "Affected_Population_25yr"]),
        (
            "Component Scores and Elevation",
            ["Barangay", "Elevation_Mean", "Hazard", "CSI", "Exposure", "Vulnerability"],
        ),
    ]

    add_table(
        story,
        "7. Top-Ranked Barangays by DPI",
        df_top_rank,
        note="High-ranking barangays may be driven by flood coverage, high exposed population, low elevation, density, or combined factors.",
        max_rows=25,
        column_groups=top_rank_groups,
        page_break_before=True,
    )

    # ------------------------------------------------------------
    # High-DPI medium-Flood Audit
    # ------------------------------------------------------------

    high_dpi_groups = [
        ("Identification and DPI", ["DPI_Rank", "Barangay", "DPI_Risk_Class", "DPI_Scaled"]),
        (
            "Flood and Exposure",
            ["Barangay", "Population_2024", "Flood_PCT_25yr", "Affected_Population_25yr", "Exposure"],
        ),
        ("Vulnerability Context", ["Barangay", "Elevation_Mean", "Hazard", "CSI", "Vulnerability"]),
    ]

    add_table(
        story,
        "8. High-DPI but medium-Flood Audit",
        df_high_dpi_medium_flood,
        note="These barangays are classified as High priority despite below-median 25-year flood percentage. This often reflects high exposed population or vulnerability factors.",
        max_rows=25,
        column_groups=high_dpi_groups,
        page_break_before=True,
    )

    # ------------------------------------------------------------
    # Elevation Outlier Audit
    # ------------------------------------------------------------

    elevation_groups = [
        (
            "Elevation Statistics",
            [
                "Barangay",
                "Barangay_No",
                "Elevation_Mean",
                "Elevation_Median",
                "Elevation_Min",
                "Elevation_Max",
                "Elevation_Count",
            ],
        ),
        ("Flood and Population Context", ["Barangay", "Flood_PCT_25yr", "Population_2024", "Affected_Population_25yr"]),
        ("DPI Context", ["Barangay", "Vulnerability", "Exposure", "DPI_Scaled", "DPI_Risk_Class"]),
    ]

    add_table(
        story,
        "9. Elevation Outlier Audit",
        df_elevation_audit,
        note="Elevation outliers should be retained unless confirmed as data errors, but they should be interpreted carefully in relation to exposure and vulnerability.",
        max_rows=20,
        column_groups=elevation_groups,
        page_break_before=True,
    )

    # ------------------------------------------------------------
    # Population Change Sensitivity Audit
    # ------------------------------------------------------------

    population_groups = [
        (
            "Population Change",
            [
                "Barangay",
                "Population_2020",
                "Population_2024",
                "Population_Change_2020_2024_Pct",
                "Population_Change_2020_2024_Pct_Winsorized",
            ],
        ),
        (
            "Vulnerability Sensitivity",
            ["Barangay", "Vulnerability", "Vulnerability_WinsorizedPopChange", "Vulnerability_Sensitivity_Diff"],
        ),
        ("DPI Context", ["Barangay", "DPI_Scaled", "DPI_Risk_Class"]),
    ]

    add_table(
        story,
        "10. Population-Change Sensitivity Audit",
        df_population_sensitivity,
        note="This diagnostic checks whether extreme population-change percentages materially affect the Vulnerability component.",
        max_rows=25,
        column_groups=population_groups,
        page_break_before=True,
    )

    # ------------------------------------------------------------
    # Model Comparison
    # ------------------------------------------------------------

    model_groups = [
        ("Cross-Validation Performance", ["Model", "CV_F1_Macro_Mean", "CV_F1_Macro_Std", "Best_Params"]),
        (
            "Held-Out Test Performance",
            ["Model", "Accuracy", "Balanced_Accuracy", "F1_Macro", "F1_Weighted", "ROC_AUC_OVR_Macro"],
        ),
        ("High-Class Performance", ["Model", "Precision_High", "Recall_High", "F1_High", "Support_High"]),
        ("Low-Class Performance", ["Model", "Precision_Low", "Recall_Low", "F1_Low", "Support_Low"]),
        ("Medium-Class Performance", ["Model", "Precision_Medium", "Recall_Medium", "F1_Medium", "Support_Medium"]),
    ]

    add_table(
        story,
        "11. Machine Learning Model Comparison",
        df_model_results,
        note="Model performance reflects classification-reproduction of DPI-derived risk classes, not independent prediction of real flood outcomes.",
        max_rows=10,
        column_groups=model_groups,
        page_break_before=True,
    )

    if df_model_results is not None and "Model" in df_model_results.columns:
        metric_col = None
        for candidate in ["CV_F1_Macro_Mean", "F1_Macro", "Accuracy", "Balanced_Accuracy"]:
            if candidate in df_model_results.columns:
                metric_col = candidate
                break

        if metric_col:
            add_chart(
                story,
                f"Model Comparison by {metric_col}",
                base / "chart_model_comparison.png",
                note="The selected model should be based on the predefined model-selection metric, typically cross-validation F1-macro.",
            )

    # ------------------------------------------------------------
    # Feature Importance Tables
    # ------------------------------------------------------------

    add_table(
        story,
        "12. Gradient Boosting Feature Importance",
        df_gb_importance,
        note="Impurity-based feature importance explains how the Gradient Boosting model reproduced DPI-derived classes.",
        max_rows=20,
        preferred_cols=["Feature", "Importance", "Model"],
        page_break_before=True,
    )

    if df_gb_importance is not None and {"Feature", "Importance"}.issubset(df_gb_importance.columns):
        add_chart(
            story,
            "Top Gradient Boosting Feature Importances",
            base / "chart_gb_importance.png",
            note="Higher values indicate stronger contribution to the model's classification-reproduction behavior.",
        )

    add_table(
        story,
        "13. Random Forest Feature Importance",
        df_rf_importance,
        note="Impurity-based feature importance from the Random Forest model.",
        max_rows=20,
        preferred_cols=["Feature", "Importance", "Model"],
        page_break_before=True,
    )

    if df_rf_importance is not None and {"Feature", "Importance"}.issubset(df_rf_importance.columns):
        add_chart(
            story,
            "Top Random Forest Feature Importances",
            base / "chart_rf_importance.png",
            note="Feature importance should be interpreted cautiously when predictors are correlated.",
        )

    add_table(
        story,
        "14. Permutation Importance",
        df_perm_importance,
        note="Permutation importance estimates how much each feature contributes to held-out F1-macro when feature values are randomly shuffled.",
        max_rows=20,
        preferred_cols=["Feature", "Permutation_Importance_Mean", "Permutation_Importance_Std", "Model"],
        page_break_before=True,
    )

    if df_perm_importance is not None:
        feature_col = "Feature" if "Feature" in df_perm_importance.columns else None
        perm_col = "Permutation_Importance_Mean" if "Permutation_Importance_Mean" in df_perm_importance.columns else None

        if feature_col and perm_col:
            add_chart(
                story,
                "Top Permutation Importances",
                base / "chart_perm_importance.png",
                note="Permutation importance is model-agnostic and helps validate impurity-based feature-importance patterns.",
            )

    # ------------------------------------------------------------
    # Limitations
    # ------------------------------------------------------------

    story.append(PageBreak())
    story.append(Paragraph("15. Limitations and Usage Notes", SECTION_STYLE))

    limitations = [
        "The study relies on secondary datasets and does not include field validation, household surveys, or complete barangay-level historical damage records.",
        "LiPAD flood layers represent modeled hazard scenarios and may not fully reflect real-time flooding, drainage constraints, rainfall intensity, tidal influence, pumping conditions, land-use changes, or recent infrastructure updates.",
        "The 100-year flood layer is excluded from the main analysis due to return-period consistency anomalies. Any retained 100-year fields in intermediate files are for traceability only.",
        "Affected population is estimated using barangay-level flood percentage and total population. This assumes a uniform distribution of residents within each barangay, which may not fully reflect actual settlement patterns.",
        "Elevation is summarized at the barangay level and does not capture micro-scale road depressions, building elevation, local drainage obstructions, land subsidence, or flood depth.",
        "Low, Medium, and High classes are relative tertiles within Manila. They are not official flood-warning categories or externally calibrated hazard levels.",
        "Machine learning performance measures classification-reproduction of DPI-derived classes. The models do not independently predict actual flood occurrence, flood depth, damage, casualties, or future flood conditions.",
        "The prototype and outputs are intended for research and planning support only. They should not replace official government hazard advisories, evacuation orders, or operational disaster response systems.",
    ]

    for i, item in enumerate(limitations, start=1):
        story.append(Paragraph(f"<b>{i}.</b> {item}", BODY_STYLE))

    # ------------------------------------------------------------
    # 7. Build PDF
    # ------------------------------------------------------------

    doc.build(story, onFirstPage=add_first_page_footer, onLaterPages=add_footer)

    return {"generated_at": moment, "data_version": data_version, "page_count": doc.page}
