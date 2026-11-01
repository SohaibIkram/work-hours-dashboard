# Work Hours & Compliance Dashboard (FY 2026–27)

A modern, client-side executive dashboard for tracking 8-hour daily working compliance, surplus/deficit balances, and attendance analytics for Fiscal Year 2026–27.

![Dashboard Preview](screenshot.png)

## ✨ Key Features

- **Executive KPI Cards**: Real-time Net Balance (hours & minutes), Daily Compliance %, Fulfillment Rate, and Average Work Hours.
- **Interactive Analytics**:
  - Daily Work Hours vs. 8h Target bar chart.
  - Cumulative Balance trajectory line chart.
  - Weekday Performance distribution (Monday–Friday).
  - Work Hours Histogram.
  - Full-year GitHub-style Calendar Heatmap.
- **Natural Language Assistant (Local NLP)**: Type entries in plain English (e.g. `Nov 2 came at 10:45 left at 19:15 with 8.30 hours` or `Nov 3 took sick leave`) to immediately update the dashboard without any paid AI API.
- **Flexible Data Input**:
  - **Drag-and-Drop Excel**: Drop any updated `Time_In_Out_Tracking.xlsx` file.
  - **Clipboard Text Parsing**: Paste directly from office attendance portals.
  - **Manual Column Entry**: Enter date, in/out, hours, and status.
- **Row-Level Actions**: In-line Edit and Delete for any individual day with instant recalculation.
- **Multi-Tab Excel Export**: Downloads a complete `.xlsx` workbook containing the `Total FY` tab alongside individual monthly tabs (`July`, `August`, `September`, `October`, etc.).
- **Zero Backend / 100% Private**: Runs entirely in the browser using HTML5, CSS3, JavaScript, and `localStorage`.

## 🚀 Live Demo

Access the live dashboard on GitHub Pages:
**[https://sohaibikram.github.io/work-hours-dashboard/](https://sohaibikram.github.io/work-hours-dashboard/)**

## 🛠 Tech Stack

- **HTML5 & Vanilla CSS**: Glassmorphism design system with responsive layouts.
- **JavaScript (ES6+)**: Custom analytics and natural language understanding parser.
- **SheetJS (xlsx.full.min.js)**: Client-side Excel parsing and multi-sheet workbook generation.
- **Chart.js**: Interactive responsive charts.
