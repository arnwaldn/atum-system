---
name: pptx
description: "Use this skill whenever the user wants to create, read, edit, or manipulate PowerPoint presentations (.pptx files). Triggers include: any mention of PowerPoint, presentation, slides, .pptx, or requests to produce slide decks. Also use when extracting content from presentations, adding charts or images to slides, or converting content into presentation format."
version: "1.0.0"
---

# PPTX creation, editing, and analysis

## Overview

A .pptx file is a ZIP archive containing XML files (Open XML Presentation format).

## Quick Reference

| Task | Approach |
|------|----------|
| Read/extract content | python-pptx or unpack for raw XML |
| Create new presentation | pptxgenjs (JavaScript) or python-pptx |
| Edit existing presentation | python-pptx or unpack/edit XML/repack |
| Convert to images | LibreOffice headless -> PDF -> images |

## Reading Presentations

### Extract Text with python-pptx
```python
from pptx import Presentation

prs = Presentation("presentation.pptx")
for i, slide in enumerate(prs.slides):
    print(f"--- Slide {i+1} ---")
    for shape in slide.shapes:
        if shape.has_text_frame:
            for paragraph in shape.text_frame.paragraphs:
                print(paragraph.text)
        if shape.has_table:
            table = shape.table
            for row in table.rows:
                for cell in row.cells:
                    print(cell.text, end="\t")
                print()
```

### Extract Metadata
```python
prs = Presentation("presentation.pptx")
print(f"Slides: {len(prs.slides)}")
print(f"Width: {prs.slide_width}")
print(f"Height: {prs.slide_height}")

core = prs.core_properties
print(f"Title: {core.title}")
print(f"Author: {core.author}")
```

## Creating Presentations with python-pptx

### Basic Presentation
```python
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

prs = Presentation()
prs.slide_width = Inches(13.333)   # Widescreen 16:9
prs.slide_height = Inches(7.5)

slide_layout = prs.slide_layouts[0]  # Title layout
slide = prs.slides.add_slide(slide_layout)
title = slide.shapes.title
subtitle = slide.placeholders[1]

title.text = "Presentation Title"
subtitle.text = "Subtitle goes here"

prs.save("output.pptx")
```

### Adding Text Boxes
```python
slide_layout = prs.slide_layouts[6]  # Blank layout
slide = prs.slides.add_slide(slide_layout)

txBox = slide.shapes.add_textbox(Inches(1), Inches(1), Inches(8), Inches(2))
tf = txBox.text_frame
tf.word_wrap = True

p = tf.paragraphs[0]
p.text = "First paragraph"
p.font.size = Pt(24)
p.font.bold = True
p.font.color.rgb = RGBColor(0x2E, 0x75, 0xB6)
p.alignment = PP_ALIGN.LEFT

p2 = tf.add_paragraph()
p2.text = "Second paragraph"
p2.font.size = Pt(18)
p2.space_before = Pt(12)
```

### Adding Images
```python
slide = prs.slides.add_slide(prs.slide_layouts[6])
slide.shapes.add_picture(
    "image.png",
    left=Inches(1), top=Inches(1.5),
    width=Inches(5), height=Inches(3.5)
)
```

### Adding Tables
```python
slide = prs.slides.add_slide(prs.slide_layouts[6])
rows, cols = 4, 3
table_shape = slide.shapes.add_table(
    rows, cols, Inches(1), Inches(1.5), Inches(8), Inches(3)
)
table = table_shape.table

table.columns[0].width = Inches(3)
table.columns[1].width = Inches(2.5)
table.columns[2].width = Inches(2.5)

headers = ["Name", "Role", "Department"]
for i, header in enumerate(headers):
    cell = table.cell(0, i)
    cell.text = header
    for paragraph in cell.text_frame.paragraphs:
        paragraph.font.bold = True
        paragraph.font.size = Pt(14)
        paragraph.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    cell.fill.solid()
    cell.fill.fore_color.rgb = RGBColor(0x2E, 0x75, 0xB6)

data = [["Alice", "Engineer", "R&D"], ["Bob", "Designer", "UX"], ["Carol", "Manager", "Ops"]]
for row_idx, row_data in enumerate(data, start=1):
    for col_idx, value in enumerate(row_data):
        table.cell(row_idx, col_idx).text = value
```

### Adding Charts
```python
from pptx.chart.data import CategoryChartData
from pptx.enum.chart import XL_CHART_TYPE

slide = prs.slides.add_slide(prs.slide_layouts[6])
chart_data = CategoryChartData()
chart_data.categories = ['Q1', 'Q2', 'Q3', 'Q4']
chart_data.add_series('Revenue', (120, 135, 148, 162))
chart_data.add_series('Expenses', (95, 102, 108, 115))

chart = slide.shapes.add_chart(
    XL_CHART_TYPE.COLUMN_CLUSTERED,
    Inches(1), Inches(1.5), Inches(8), Inches(5),
    chart_data
).chart
chart.has_legend = True
```

## Creating with pptxgenjs (JavaScript)

```javascript
const pptxgen = require("pptxgenjs");
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";

let slide = pres.addSlide();
slide.addText("Title", {
    x: 0.5, y: 2, w: 12, h: 1.5,
    fontSize: 36, bold: true, color: "2E75B6", align: "center"
});

slide = pres.addSlide();
slide.addText([
    { text: "Point 1", options: { bullet: true, fontSize: 18 } },
    { text: "Point 2", options: { bullet: true, fontSize: 18 } },
], { x: 0.5, y: 1.5, w: 11, h: 4 });

pres.writeFile({ fileName: "output.pptx" });
```

## Editing Existing Presentations

```python
from pptx import Presentation

prs = Presentation("existing.pptx")
slide = prs.slides[0]
if slide.shapes.title:
    slide.shapes.title.text = "Updated Title"
prs.save("modified.pptx")
```

## Converting to Images

```bash
python scripts/office/soffice.py --headless --convert-to pdf presentation.pptx
pdftoppm -jpeg -r 150 presentation.pdf slide
```

## Design Best Practices

- Consistent fonts: Arial/Calibri for body; limit to 2-3 fonts
- Color palette: primary + 2-3 complementary colors
- 16:9 widescreen (13.333 x 7.5 inches) is standard
- One main idea per slide
- High-quality images (min 150 DPI)
- Title: 28-36pt; body: 18-24pt; minimum 14pt

## Dependencies

- **python-pptx**: pip install python-pptx
- **pptxgenjs**: npm install pptxgenjs
- **LibreOffice**: PDF/image conversion
- **Poppler**: pdftoppm for PDF to images
