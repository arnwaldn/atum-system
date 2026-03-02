---
name: xlsx
description: "Use this skill any time a spreadsheet file is the primary input or output. This means any task where the user wants to: open, read, edit, or fix an existing .xlsx, .xlsm, .csv, or .tsv file; create a new spreadsheet from scratch or from other data sources; or convert between tabular file formats. Trigger especially when the user references a spreadsheet file by name or path. Also trigger for cleaning or restructuring messy tabular data files into proper spreadsheets."
version: "1.0.0"
---

# XLSX creation, editing, and analysis

## Requirements for Outputs

### Professional Font
- Use a consistent, professional font (e.g., Arial, Times New Roman) unless otherwise instructed

### Zero Formula Errors
- Every Excel model MUST be delivered with ZERO formula errors (#REF!, #DIV/0!, #VALUE!, #N/A, #NAME?)

### Financial Models Color Coding
- **Blue text (0,0,255)**: Hardcoded inputs
- **Black text (0,0,0)**: ALL formulas and calculations
- **Green text (0,128,0)**: Links from other worksheets
- **Red text (255,0,0)**: External links to other files
- **Yellow background (255,255,0)**: Key assumptions needing attention

### Number Formatting Standards
- **Years**: Format as text strings ("2024" not "2,024")
- **Currency**: Use $#,##0 format; specify units in headers
- **Zeros**: Format to show as "-"
- **Percentages**: Default 0.0% (one decimal)
- **Multiples**: Format as 0.0x
- **Negative numbers**: Use parentheses (123) not minus -123

## CRITICAL: Use Formulas, Not Hardcoded Values

Always use Excel formulas instead of calculating values in Python:

```python
# WRONG
total = df['Sales'].sum()
sheet['B10'] = total

# CORRECT
sheet['B10'] = '=SUM(B2:B9)'
sheet['C5'] = '=(C4-C2)/C2'
sheet['D20'] = '=AVERAGE(D2:D19)'
```

## Reading and Analyzing Data

```python
import pandas as pd

df = pd.read_excel('file.xlsx')
all_sheets = pd.read_excel('file.xlsx', sheet_name=None)
df.head()
df.info()
df.describe()
df.to_excel('output.xlsx', index=False)
```

## Creating New Excel Files

```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment

wb = Workbook()
sheet = wb.active

sheet['A1'] = 'Hello'
sheet['B1'] = 'World'
sheet.append(['Row', 'of', 'data'])
sheet['B2'] = '=SUM(A1:A10)'

sheet['A1'].font = Font(bold=True, color='FF0000')
sheet['A1'].fill = PatternFill('solid', start_color='FFFF00')
sheet['A1'].alignment = Alignment(horizontal='center')
sheet.column_dimensions['A'].width = 20

wb.save('output.xlsx')
```

## Editing Existing Excel Files

```python
from openpyxl import load_workbook

wb = load_workbook('existing.xlsx')
sheet = wb.active

for sheet_name in wb.sheetnames:
    sheet = wb[sheet_name]

sheet['A1'] = 'New Value'
sheet.insert_rows(2)
sheet.delete_cols(3)

new_sheet = wb.create_sheet('NewSheet')
new_sheet['A1'] = 'Data'

wb.save('modified.xlsx')
```

## Recalculating Formulas

```bash
python scripts/recalc.py <excel_file> [timeout_seconds]
python scripts/recalc.py output.xlsx 30
```

The script returns JSON with error details:
```json
{
  "status": "success",
  "total_errors": 0,
  "total_formulas": 42,
  "error_summary": {}
}
```

## Formula Verification Checklist

- Test 2-3 sample references before building full model
- Confirm Excel columns match (column 64 = BL, not BK)
- Remember Excel rows are 1-indexed (DataFrame row 5 = Excel row 6)
- Check for null values with `pd.notna()`
- Verify all cell references point to intended cells
- Test formulas on 2-3 cells before applying broadly

## Best Practices

### Library Selection
- **pandas**: Best for data analysis, bulk operations, simple data export
- **openpyxl**: Best for complex formatting, formulas, Excel-specific features

### Working with openpyxl
- Cell indices are 1-based
- Use `data_only=True` to read calculated values
- WARNING: If opened with `data_only=True` and saved, formulas are permanently lost
- For large files: `read_only=True` for reading or `write_only=True` for writing

### Working with pandas
- Specify data types: `pd.read_excel('file.xlsx', dtype={'id': str})`
- For large files: `pd.read_excel('file.xlsx', usecols=['A', 'C', 'E'])`
- Handle dates: `pd.read_excel('file.xlsx', parse_dates=['date_column'])`
