/**
 * Work Hours & Compliance Dashboard - Application Logic & Analytics Engine
 * Fiscal Year 2026-27 | 8-Hour Compliance System
 */

(function () {
  'use strict';

  // --- Constants & Storage Keys ---
  const STORAGE_KEY_DATA = 'compliance_dashboard_data_v1';
  const STORAGE_KEY_SETTINGS = 'compliance_dashboard_settings_v1';

  // Default configuration settings
  const defaultSettings = {
    targetHours: 8.0,
    targetMinutes: 480,
    balanceMode: 'calculated', // 'calculated' (exact from WH) or 'typed' (from col N)
    showWeekends: true,
    fyStartMonth: 7 // July
  };

  let state = {
    records: [],
    settings: { ...defaultSettings },
    selectedPeriod: 'ALL', // 'ALL' or 'YYYY-MM'
    activeTableFilter: 'all',
    searchQuery: '',
    editingRecordDate: null
  };

  // Chart instances
  let charts = {
    dailyBalance: null,
    cumulativeBalance: null,
    weekday: null,
    distribution: null
  };

  // --- Helper Functions ---

  function parseMinutes(val) {
    if (val === null || val === undefined || val === '' || val === '-') return null;
    if (typeof val === 'number') return isNaN(val) ? null : val;
    val = String(val).trim();
    if (val.includes(':')) {
      const parts = val.split(':');
      const h = parseFloat(parts[0]) || 0;
      const m = parseFloat(parts[1]) || 0;
      return h * 60 + m;
    }
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  }

  function minutesToHoursStr(min, showSign = false) {
    if (min === null || min === undefined || isNaN(min)) return '-';
    const sign = min > 0 ? (showSign ? '+' : '') : (min < 0 ? '-' : '');
    const absMin = Math.abs(min);
    const h = (absMin / 60).toFixed(1);
    return `${sign}${h}`;
  }

  function minutesToHourMinStr(min, showSign = false) {
    if (min === null || min === undefined || isNaN(min)) return '-';
    const sign = min > 0 ? (showSign ? '+' : '') : (min < 0 ? '-' : '');
    const absTotalMin = Math.round(Math.abs(min));
    const h = Math.floor(absTotalMin / 60);
    const m = absTotalMin % 60;
    return `${sign}${h}h ${m}m`;
  }

  function formatTime(val) {
    if (!val || val === '-' || val === 'None') return '-';
    val = String(val).trim();
    if (/^\d{1,2}:\d{2}$/.test(val)) {
      const parts = val.split(':');
      let h = parseInt(parts[0], 10);
      const m = parts[1];
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${h}:${m} ${ampm}`;
    }
    return val;
  }

  function parseTimeToMinutesFromMidnight(timeStr) {
    if (!timeStr || timeStr === '-' || timeStr === 'None') return null;
    const parts = timeStr.trim().split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
    }
    return null;
  }

  function minutesToTimeOfDay(min) {
    if (min === null || isNaN(min)) return '-';
    let totalMin = Math.round(min) % (24 * 60);
    if (totalMin < 0) totalMin += 24 * 60;
    let h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m} ${ampm}`;
  }

  function getMonthKey(dateStr) {
    if (!dateStr || dateStr === 'None') return '';
    return dateStr.substring(0, 7); // YYYY-MM
  }

  function getMonthLabel(monthKey) {
    if (!monthKey) return '';
    const [y, m] = monthKey.split('-').map(Number);
    const date = new Date(y, m - 1, 1);
    return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  }

  function getDayName(dateStr) {
    if (!dateStr || dateStr === 'None') return '';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d, 12, 0, 0);
      return dt.toLocaleDateString('en-US', { weekday: 'long' });
    } catch {
      return '';
    }
  }

  function isWeekendStatus(record) {
    const st = (record.status || '').toLowerCase();
    const day = (record.day || '').toLowerCase();
    return st.includes('weekend') || day === 'saturday' || day === 'sunday';
  }

  function isHolidayStatus(record) {
    const st = (record.status || '').toLowerCase();
    return st.includes('holiday') || st.includes('birthday') || st.includes('independence');
  }

  function isExceptionStatus(record) {
    const st = (record.status || '').toLowerCase();
    return st.includes('leave') || st.includes('short') || st.includes('karachi') || st.includes('absent');
  }

  function isWorkingDay(record) {
    // A day is counted as required if:
    // 1. It has logged working hours > 0
    // 2. OR it is a weekday that is not a recognized holiday without hours
    if (record.workingHoursMin !== null && record.workingHoursMin > 0) {
      return true;
    }
    if (isWeekendStatus(record)) return false;
    if (isHolidayStatus(record)) return false;
    // Absent without hours counts as a working day (deficit of 480)
    if ((record.status || '').toLowerCase().includes('absent')) return true;
    return false;
  }

  function getRecordBalance(record) {
    if (!isWorkingDay(record)) return 0;
    if (state.settings.balanceMode === 'typed' && record.minutesBalance !== null && record.minutesBalance !== undefined) {
      return record.minutesBalance;
    }
    const wh = record.workingHoursMin || 0;
    return wh - state.settings.targetMinutes;
  }

  // --- Core Analytics & Calculations ---

  function computeMetrics(records, periodKey) {
    let filtered = records;
    if (periodKey && periodKey !== 'ALL') {
      filtered = records.filter(r => getMonthKey(r.date) === periodKey);
    }

    let totalWorkingDays = 0;
    let totalWorkedMinutes = 0;
    let totalBalanceMinutes = 0;
    let compliantDaysCount = 0;
    let sumInMinutes = 0;
    let countIn = 0;
    let sumOutMinutes = 0;
    let countOut = 0;

    let bestDay = null;
    let worstDay = null;

    let longestStreak = 0;
    let currentStreak = 0;
    let runningStreak = 0;

    // Daily records for charting
    const chartDailyData = [];
    let cumulativeMin = 0;

    filtered.forEach(r => {
      const isWork = isWorkingDay(r);
      const bal = getRecordBalance(r);

      if (isWork) {
        totalWorkingDays++;
        const wh = r.workingHoursMin || 0;
        totalWorkedMinutes += wh;
        totalBalanceMinutes += bal;

        if (bal >= 0) {
          compliantDaysCount++;
          runningStreak++;
          if (runningStreak > longestStreak) longestStreak = runningStreak;
        } else {
          runningStreak = 0;
        }

        // Best and worst
        if (!bestDay || bal > bestDay.balance) {
          bestDay = { date: r.date, day: r.day, balance: bal, hours: wh };
        }
        if (!worstDay || bal < worstDay.balance) {
          worstDay = { date: r.date, day: r.day, balance: bal, hours: wh };
        }

        // Time In/Out stats
        const tinMin = parseTimeToMinutesFromMidnight(r.timeIn);
        const toutMin = parseTimeToMinutesFromMidnight(r.timeOut);
        if (tinMin !== null) {
          sumInMinutes += tinMin;
          countIn++;
        }
        if (toutMin !== null) {
          sumOutMinutes += toutMin;
          countOut++;
        }

        cumulativeMin += bal;

        chartDailyData.push({
          date: r.date,
          day: r.day,
          whMin: wh,
          balanceMin: bal,
          cumulativeHours: cumulativeMin / 60,
          status: r.status,
          timeIn: r.timeIn,
          timeOut: r.timeOut
        });
      }
    });

    currentStreak = runningStreak;

    const requiredMinutes = totalWorkingDays * state.settings.targetMinutes;
    const requiredHours = requiredMinutes / 60;
    const netHours = totalWorkedMinutes / 60;
    const balanceHours = totalBalanceMinutes / 60;
    const avgDailyHours = totalWorkingDays > 0 ? (totalWorkedMinutes / totalWorkingDays) / 60 : 0;
    const complianceDailyPct = totalWorkingDays > 0 ? (compliantDaysCount / totalWorkingDays) * 100 : 0;
    const hoursFulfillmentPct = requiredHours > 0 ? Math.min(100, (netHours / requiredHours) * 100) : 0;

    const avgInStr = countIn > 0 ? minutesToTimeOfDay(sumInMinutes / countIn) : '-';
    const avgOutStr = countOut > 0 ? minutesToTimeOfDay(sumOutMinutes / countOut) : '-';

    return {
      totalWorkingDays,
      requiredHours,
      netHours,
      balanceMinutes: totalBalanceMinutes,
      balanceHours,
      avgDailyHours,
      compliantDaysCount,
      complianceDailyPct,
      hoursFulfillmentPct,
      avgInStr,
      avgOutStr,
      bestDay,
      worstDay,
      longestStreak,
      currentStreak,
      chartDailyData
    };
  }

  function computeMonthlySummary(records) {
    const monthsMap = new Map();

    records.forEach(r => {
      const mKey = getMonthKey(r.date);
      if (!mKey) return;
      if (!monthsMap.has(mKey)) monthsMap.set(mKey, []);
      monthsMap.get(mKey).push(r);
    });

    const sortedMonthKeys = Array.from(monthsMap.keys()).sort();
    let runningCumulBalanceMin = 0;

    const summary = sortedMonthKeys.map(mKey => {
      const mRecs = monthsMap.get(mKey);
      let workDays = 0;
      let workedMin = 0;
      let balanceMin = 0;
      let compliantDays = 0;

      mRecs.forEach(r => {
        if (isWorkingDay(r)) {
          workDays++;
          const wh = r.workingHoursMin || 0;
          workedMin += wh;
          const bal = getRecordBalance(r);
          balanceMin += bal;
          if (bal >= 0) compliantDays++;
        }
      });

      runningCumulBalanceMin += balanceMin;
      const netHours = workedMin / 60;
      const reqHours = (workDays * state.settings.targetMinutes) / 60;
      const balHours = balanceMin / 60;
      const cumulHours = runningCumulBalanceMin / 60;
      const avgHours = workDays > 0 ? netHours / workDays : 0;
      const compPct = workDays > 0 ? (compliantDays / workDays) * 100 : 0;

      return {
        monthKey: mKey,
        monthLabel: getMonthLabel(mKey),
        workDays,
        netHours,
        reqHours,
        avgHours,
        balanceHours: balHours,
        cumulHours,
        compPct,
        onTarget: balHours >= 0
      };
    });

    return summary;
  }

  function computeWeekdayDistribution(records, periodKey) {
    let filtered = records;
    if (periodKey && periodKey !== 'ALL') {
      filtered = records.filter(r => getMonthKey(r.date) === periodKey);
    }

    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const sums = { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 };
    const counts = { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 };

    filtered.forEach(r => {
      if (isWorkingDay(r) && weekdays.includes(r.day)) {
        sums[r.day] += (r.workingHoursMin || 0) / 60;
        counts[r.day]++;
      }
    });

    return weekdays.map(day => {
      const avg = counts[day] > 0 ? sums[day] / counts[day] : 0;
      return { day, avg: parseFloat(avg.toFixed(2)), count: counts[day] };
    });
  }

  function computeHoursDistribution(records, periodKey) {
    let filtered = records;
    if (periodKey && periodKey !== 'ALL') {
      filtered = records.filter(r => getMonthKey(r.date) === periodKey);
    }

    const bins = {
      '< 6h': 0,
      '6 - 7h': 0,
      '7 - 8h': 0,
      '8 - 9h': 0,
      '9h+': 0
    };

    filtered.forEach(r => {
      if (isWorkingDay(r)) {
        const h = (r.workingHoursMin || 0) / 60;
        if (h < 6.0) bins['< 6h']++;
        else if (h < 7.0) bins['6 - 7h']++;
        else if (h < 8.0) bins['7 - 8h']++;
        else if (h < 9.0) bins['8 - 9h']++;
        else bins['9h+']++;
      }
    });

    return bins;
  }

  // --- Rendering UI & Metrics ---

  function renderPeriodPills() {
    const container = document.getElementById('periodPills');
    if (!container) return;
    container.innerHTML = '';

    // "Whole FY" Pill
    const allPill = document.createElement('button');
    allPill.className = `period-pill ${state.selectedPeriod === 'ALL' ? 'active' : ''}`;
    allPill.textContent = 'Whole FY';
    allPill.addEventListener('click', () => {
      state.selectedPeriod = 'ALL';
      updateDashboard();
    });
    container.appendChild(allPill);

    // Month Pills
    const monthKeys = Array.from(new Set(state.records.map(r => getMonthKey(r.date)).filter(Boolean))).sort();
    monthKeys.forEach(mKey => {
      const pill = document.createElement('button');
      pill.className = `period-pill ${state.selectedPeriod === mKey ? 'active' : ''}`;
      pill.textContent = getMonthLabel(mKey);
      pill.addEventListener('click', () => {
        state.selectedPeriod = mKey;
        updateDashboard();
      });
      container.appendChild(pill);
    });
  }

  function renderKPICards(metrics) {
    const isSurplus = metrics.balanceHours >= 0;

    // Card 1: Balance
    const balValEl = document.getElementById('kpiBalanceVal');
    const balMinEl = document.getElementById('kpiBalanceMin');
    const balCard = document.getElementById('kpiBalanceCard');
    const balDescEl = document.getElementById('kpiBalanceDesc');
    const balFooter = document.getElementById('kpiBalanceFooter');

    const balSign = metrics.balanceHours > 0 ? '+' : '';
    balValEl.textContent = `${balSign}${metrics.balanceHours.toFixed(1)}`;
    balMinEl.textContent = `(${balSign}${metrics.balanceMinutes.toFixed(1)} mins)`;

    balCard.classList.remove('balance-positive', 'balance-negative');
    balCard.classList.add(isSurplus ? 'balance-positive' : 'balance-negative');

    const dot = balFooter.querySelector('.status-indicator-dot');
    if (dot) {
      dot.className = `status-indicator-dot ${isSurplus ? 'positive' : 'negative'}`;
    }
    balDescEl.textContent = isSurplus
      ? `Surplus of ${metrics.balanceHours.toFixed(1)}h above target`
      : `Deficit of ${Math.abs(metrics.balanceHours).toFixed(1)}h against target`;

    // Card 2: Hours Logged vs Required
    document.getElementById('kpiLoggedHours').textContent = metrics.netHours.toFixed(1);
    document.getElementById('kpiRequiredHours').textContent = metrics.requiredHours.toFixed(1);
    document.getElementById('kpiHoursPct').textContent = `${metrics.hoursFulfillmentPct.toFixed(1)}%`;
    document.getElementById('kpiHoursProgressBar').style.width = `${Math.min(100, metrics.hoursFulfillmentPct)}%`;

    // Card 3: Compliance Rate
    document.getElementById('kpiComplianceRate').textContent = metrics.complianceDailyPct.toFixed(1);
    document.getElementById('kpiComplianceDays').textContent = `${metrics.compliantDaysCount} of ${metrics.totalWorkingDays} days ≥ 8:00h`;

    // Card 4: Daily Average
    document.getElementById('kpiDailyAvg').textContent = metrics.avgDailyHours.toFixed(2);
    const avgDiffMin = (metrics.avgDailyHours - state.settings.targetHours) * 60;
    const diffSign = avgDiffMin > 0 ? '+' : '';
    document.getElementById('kpiDailyAvgDiff').textContent = `${diffSign}${avgDiffMin.toFixed(1)} mins vs ${state.settings.targetHours.toFixed(1)}h target`;

    // Card 5: Streak
    document.getElementById('kpiStreakDays').textContent = metrics.longestStreak;
    document.getElementById('kpiCurrentStreak').textContent = `${metrics.currentStreak} day${metrics.currentStreak === 1 ? '' : 's'}`;

    // Card 6: Timing Profile
    document.getElementById('kpiAvgIn').textContent = metrics.avgInStr;
    document.getElementById('kpiAvgOut').textContent = metrics.avgOutStr;
    if (metrics.bestDay && metrics.worstDay) {
      document.getElementById('kpiBestDayPreview').textContent = 
        `Best: +${metrics.bestDay.balance.toFixed(0)}m · Worst: ${metrics.worstDay.balance.toFixed(0)}m`;
    }

    // Top Control Bar Stats
    document.getElementById('periodWorkDays').textContent = metrics.totalWorkingDays;
    const verdictBadge = document.getElementById('periodVerdictBadge');
    verdictBadge.className = `badge-verdict ${isSurplus ? 'on-target' : 'below-target'}`;
    verdictBadge.textContent = isSurplus ? 'On Target' : 'Below Target';
  }

  // --- Chart Visualizations ---

  function renderCharts(metrics) {
    renderDailyBalanceChart(metrics.chartDailyData);
    renderCumulativeChart(metrics.chartDailyData);
    renderWeekdayChart();
    renderDistributionChart();
  }

  function renderDailyBalanceChart(dailyData) {
    const ctx = document.getElementById('dailyBalanceChart');
    if (!ctx) return;

    if (charts.dailyBalance) charts.dailyBalance.destroy();

    const labels = dailyData.map(d => {
      const parts = d.date.split('-');
      return `${parts[2]}/${parts[1]}`;
    });
    const values = dailyData.map(d => Math.round(d.balanceMin));
    const backgroundColors = values.map(v => v >= 0 ? '#10b981' : '#f43f5e');

    charts.dailyBalance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Net Balance (Minutes)',
          data: values,
          backgroundColor: backgroundColors,
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#111827',
            titleColor: '#f8fafc',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              title: (items) => {
                const idx = items[0].dataIndex;
                const rec = dailyData[idx];
                return `${rec.date} (${rec.day})`;
              },
              label: (context) => {
                const idx = context.dataIndex;
                const rec = dailyData[idx];
                const bal = rec.balanceMin;
                const sign = bal >= 0 ? '+' : '';
                const wh = (rec.whMin / 60).toFixed(2);
                const lines = [
                  `Worked: ${wh}h (${minutesToHourMinStr(rec.whMin)})`,
                  `Balance: ${sign}${bal.toFixed(0)} min (${minutesToHoursStr(bal, true)}h)`
                ];
                if (rec.status) lines.push(`Status: ${rec.status}`);
                if (rec.timeIn && rec.timeIn !== '-') lines.push(`Time In: ${formatTime(rec.timeIn)} | Out: ${formatTime(rec.timeOut)}`);
                return lines;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#64748b',
              font: { size: 10 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 25
            }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.06)' },
            ticks: {
              color: '#94a3b8',
              font: { size: 11 },
              callback: (v) => `${v > 0 ? '+' : ''}${v}m`
            }
          }
        }
      }
    });
  }

  function renderCumulativeChart(dailyData) {
    const ctx = document.getElementById('cumulativeBalanceChart');
    if (!ctx) return;

    if (charts.cumulativeBalance) charts.cumulativeBalance.destroy();

    const labels = dailyData.map(d => {
      const parts = d.date.split('-');
      return `${parts[2]}/${parts[1]}`;
    });
    const values = dailyData.map(d => parseFloat(d.cumulativeHours.toFixed(2)));

    // Gradient fill
    const canvas = ctx.getContext('2d');
    const gradient = canvas.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

    charts.cumulativeBalance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Cumulative Balance (Hours)',
          data: values,
          borderColor: '#6366f1',
          borderWidth: 2.5,
          pointRadius: values.length > 50 ? 0 : 3,
          pointHoverRadius: 5,
          pointBackgroundColor: '#818cf8',
          fill: true,
          backgroundColor: gradient,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#111827',
            titleColor: '#f8fafc',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            callbacks: {
              title: (items) => {
                const idx = items[0].dataIndex;
                const rec = dailyData[idx];
                return `${rec.date} (${rec.day})`;
              },
              label: (context) => {
                const val = context.parsed.y;
                const sign = val >= 0 ? '+' : '';
                return `Cumulative: ${sign}${val} hours`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#64748b',
              font: { size: 10 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 15
            }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.06)' },
            ticks: {
              color: '#94a3b8',
              font: { size: 11 },
              callback: (v) => `${v > 0 ? '+' : ''}${v}h`
            }
          }
        }
      }
    });
  }

  function renderWeekdayChart() {
    const ctx = document.getElementById('weekdayChart');
    if (!ctx) return;

    if (charts.weekday) charts.weekday.destroy();

    const data = computeWeekdayDistribution(state.records, state.selectedPeriod);
    const labels = data.map(d => d.day.substring(0, 3));
    const values = data.map(d => d.avg);

    charts.weekday = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: values.map(v => v >= 8.0 ? '#10b981' : '#38bdf8'),
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => `Average: ${c.parsed.y}h (${data[c.dataIndex].count} days)`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#94a3b8',
              autoSkip: false,
              maxRotation: 0,
              minRotation: 0,
              font: {
                size: 11,
                weight: '600'
              }
            }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.06)' },
            min: Math.floor(Math.min(...values, 6.0)),
            suggestedMax: 9.0,
            ticks: {
              color: '#94a3b8',
              callback: (v) => `${v}h`
            }
          }
        }
      }
    });
  }

  function renderDistributionChart() {
    const ctx = document.getElementById('distributionChart');
    if (!ctx) return;

    if (charts.distribution) charts.distribution.destroy();

    const bins = computeHoursDistribution(state.records, state.selectedPeriod);
    const labels = Object.keys(bins);
    const values = Object.values(bins);

    charts.distribution = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: ['#f43f5e', '#fb923c', '#eab308', '#10b981', '#059669'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => `${c.parsed.y} days`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#94a3b8',
              autoSkip: false,
              maxRotation: 0,
              font: { size: 10, weight: '500' }
            }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.06)' },
            ticks: { color: '#94a3b8', stepSize: 5 }
          }
        }
      }
    });
  }

  // --- Monthly Performance Table ---

  function renderMonthlyTable() {
    const tbody = document.getElementById('monthlySummaryTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const summary = computeMonthlySummary(state.records);

    summary.forEach(row => {
      const tr = document.createElement('tr');
      const balClass = row.balanceHours >= 0 ? 'text-surplus' : 'text-deficit';
      const balSign = row.balanceHours > 0 ? '+' : '';
      const cumulClass = row.cumulHours >= 0 ? 'text-surplus' : 'text-deficit';
      const cumulSign = row.cumulHours > 0 ? '+' : '';

      tr.innerHTML = `
        <td><strong>${row.monthLabel}</strong></td>
        <td>${row.workDays}</td>
        <td class="cell-mono">${row.netHours.toFixed(1)}h</td>
        <td class="cell-mono">${row.reqHours.toFixed(1)}h</td>
        <td class="cell-mono">${row.avgHours.toFixed(2)}h</td>
        <td>
          <span class="badge-compliance ${row.compPct >= 50 ? 'met' : 'unmet'}">
            ${row.compPct.toFixed(1)}%
          </span>
        </td>
        <td class="${balClass} cell-mono">${balSign}${row.balanceHours.toFixed(1)}h</td>
        <td class="${cumulClass} cell-mono">${cumulSign}${row.cumulHours.toFixed(1)}h</td>
        <td>
          <span class="badge-status ${row.onTarget ? 'regular text-surplus' : 'absent'}">
            ${row.onTarget ? 'Surplus' : 'Deficit'}
          </span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // --- Calendar Heatmap Matrix ---

  function renderHeatmap() {
    const container = document.getElementById('calendarHeatmap');
    if (!container) return;
    container.innerHTML = '';

    // Group records by Month
    const monthsMap = new Map();
    state.records.forEach(r => {
      const mKey = getMonthKey(r.date);
      if (!mKey) return;
      if (!monthsMap.has(mKey)) monthsMap.set(mKey, []);
      monthsMap.get(mKey).push(r);
    });

    const monthKeys = Array.from(monthsMap.keys()).sort();

    monthKeys.forEach(mKey => {
      const mRecs = monthsMap.get(mKey);
      const [year, month] = mKey.split('-').map(Number);

      const block = document.createElement('div');
      block.className = 'heatmap-month-block';

      const title = document.createElement('div');
      title.className = 'heatmap-month-name';
      title.textContent = getMonthLabel(mKey);
      block.appendChild(title);

      const weekdaysRow = document.createElement('div');
      weekdaysRow.className = 'heatmap-weekdays-row';
      ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach(d => {
        const span = document.createElement('span');
        span.textContent = d;
        weekdaysRow.appendChild(span);
      });
      block.appendChild(weekdaysRow);

      const grid = document.createElement('div');
      grid.className = 'heatmap-grid';

      // First day of month (0 = Sunday, 1 = Monday...)
      const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
      // Adjust so Monday = 0, Sunday = 6
      const startOffset = (firstDayOfMonth + 6) % 7;

      for (let i = 0; i < startOffset; i++) {
        const empty = document.createElement('div');
        empty.className = 'heat-cell empty';
        grid.appendChild(empty);
      }

      // Map date string to record
      const recMap = new Map(mRecs.map(r => [r.date, r]));
      const daysInMonth = new Date(year, month, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const dStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const rec = recMap.get(dStr);
        const cell = document.createElement('div');
        cell.className = 'heat-cell';
        cell.textContent = day;

        if (rec) {
          const isWeekend = isWeekendStatus(rec);
          const isExc = isExceptionStatus(rec);
          const wh = rec.workingHoursMin ? rec.workingHoursMin / 60 : 0;
          const bal = getRecordBalance(rec);

          if (isWeekend) {
            cell.classList.add('is-weekend');
            cell.title = `${dStr} (${rec.day}): Weekend`;
          } else if (isExc && wh >= 7.9) {
            cell.classList.add('cell-leave');
            cell.title = `${dStr} (${rec.day}): ${rec.status || 'Leave'} (${wh.toFixed(1)}h credited)`;
          } else if (wh <= 0) {
            cell.classList.add('cell-deficit');
            cell.title = `${dStr} (${rec.day}): 0 hours (${rec.status || 'Absent'})`;
          } else if (wh < 7.5) {
            cell.classList.add('cell-deficit');
            cell.title = `${dStr} (${rec.day}): ${wh.toFixed(2)}h (Deficit ${bal.toFixed(0)}m)`;
          } else if (wh < 8.0) {
            cell.classList.add('cell-near');
            cell.title = `${dStr} (${rec.day}): ${wh.toFixed(2)}h (${bal.toFixed(0)}m)`;
          } else if (wh <= 8.5) {
            cell.classList.add('cell-met');
            cell.title = `${dStr} (${rec.day}): ${wh.toFixed(2)}h (+${bal.toFixed(0)}m)`;
          } else {
            cell.classList.add('cell-surplus');
            cell.title = `${dStr} (${rec.day}): ${wh.toFixed(2)}h (+${bal.toFixed(0)}m surplus)`;
          }

          // Click to view/edit
          cell.addEventListener('click', () => openEditModal(rec));
        } else {
          cell.classList.add('empty');
        }

        grid.appendChild(cell);
      }

      block.appendChild(grid);
      container.appendChild(block);
    });
  }

  // --- Detailed Daily Log Table ---

  function renderDailyLogTable() {
    const tbody = document.getElementById('dailyLogTableBody');
    const countEl = document.getElementById('tableRowCount');
    if (!tbody) return;
    tbody.innerHTML = '';

    let records = state.records;

    // Filter by selected period
    if (state.selectedPeriod !== 'ALL') {
      records = records.filter(r => getMonthKey(r.date) === state.selectedPeriod);
    }

    // Filter out weekends if preference is disabled
    if (!state.settings.showWeekends) {
      records = records.filter(r => !isWeekendStatus(r));
    }

    // Filter by table pill
    if (state.activeTableFilter === 'working') {
      records = records.filter(r => isWorkingDay(r));
    } else if (state.activeTableFilter === 'exceptions') {
      records = records.filter(r => isExceptionStatus(r) || isHolidayStatus(r));
    } else if (state.activeTableFilter === 'deficit') {
      records = records.filter(r => isWorkingDay(r) && getRecordBalance(r) < 0);
    } else if (state.activeTableFilter === 'surplus') {
      records = records.filter(r => isWorkingDay(r) && getRecordBalance(r) >= 0);
    }

    // Filter by search query
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      records = records.filter(r => 
        (r.date && r.date.toLowerCase().includes(q)) ||
        (r.day && r.day.toLowerCase().includes(q)) ||
        (r.status && r.status.toLowerCase().includes(q))
      );
    }

    if (state.selectedPeriod === 'ALL') {
      countEl.innerHTML = `Showing ${records.length} records across all months of FY 2026-27`;
    } else {
      countEl.innerHTML = `Showing ${records.length} records for <strong>${getMonthLabel(state.selectedPeriod)}</strong> · <a href="javascript:void(0)" id="showAllMonthsLink" style="color:var(--accent-blue); text-decoration:underline; font-weight:600; cursor:pointer;">View All Months (Whole FY)</a>`;
      setTimeout(() => {
        const link = document.getElementById('showAllMonthsLink');
        if (link) {
          link.addEventListener('click', () => {
            state.selectedPeriod = 'ALL';
            updateDashboard();
          });
        }
      }, 10);
    }

    records.forEach(r => {
      const isWork = isWorkingDay(r);
      const isWeekend = isWeekendStatus(r);
      const isExc = isExceptionStatus(r);
      const bal = getRecordBalance(r);
      const wh = r.workingHoursMin !== null ? (r.workingHoursMin / 60).toFixed(2) : '-';
      const tt = r.totalTimeMin !== null ? (r.totalTimeMin / 60).toFixed(2) : '-';

      const tr = document.createElement('tr');

      // Status badge styling
      let statusHtml = '';
      if (r.status) {
        let badgeType = 'regular';
        if (isWeekend) badgeType = 'weekend';
        else if (isExc) badgeType = 'leave';
        else if (isHolidayStatus(r)) badgeType = 'holiday';
        else if (r.status.toLowerCase().includes('absent')) badgeType = 'absent';
        statusHtml = `<span class="badge-status ${badgeType}">${r.status}</span>`;
      } else {
        statusHtml = `<span class="badge-status regular">Normal Day</span>`;
      }

      // Balance cell
      let balHtml = '-';
      if (isWork) {
        const balSign = bal > 0 ? '+' : '';
        const balClass = bal >= 0 ? 'text-surplus' : 'text-deficit';
        balHtml = `<span class="${balClass} cell-mono">${balSign}${bal.toFixed(0)} min (${balSign}${(bal / 60).toFixed(1)}h)</span>`;
      }

      // Compliance badge
      let compHtml = '<span style="color:var(--text-disabled);">-</span>';
      if (isWork) {
        compHtml = bal >= 0 
          ? `<span class="badge-compliance met">Met (≥8h)</span>`
          : `<span class="badge-compliance unmet">Deficit</span>`;
      }

      tr.innerHTML = `
        <td class="cell-mono"><strong>${r.date}</strong></td>
        <td>${r.day}</td>
        <td class="cell-mono">${formatTime(r.timeIn)}</td>
        <td class="cell-mono">${formatTime(r.timeOut)}</td>
        <td class="cell-mono">${wh !== '-' ? `${wh}h` : '-'}</td>
        <td class="cell-mono">${tt !== '-' ? `${tt}h` : '-'}</td>
        <td>${statusHtml}</td>
        <td>${balHtml}</td>
        <td>${compHtml}</td>
        <td>
          <div class="row-actions">
            <button class="btn-action-edit" data-date="${r.date}" title="Edit / correct this day">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>Edit</span>
            </button>
            <button class="btn-action-delete" data-date="${r.date}" title="Delete this day">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              <span>Delete</span>
            </button>
          </div>
        </td>
      `;

      tr.querySelector('.btn-action-edit').addEventListener('click', () => openEditModal(r));
      tr.querySelector('.btn-action-delete').addEventListener('click', () => {
        if (confirm(`Are you sure you want to delete the record for ${r.date} (${r.day})?`)) {
          state.records = state.records.filter(item => item.date !== r.date);
          showToast(`Deleted record for ${r.date}`);
          updateDashboard();
        }
      });

      tbody.appendChild(tr);
    });
  }

  // --- Main Update Routine ---

  function updateDashboard() {
    renderPeriodPills();
    const metrics = computeMetrics(state.records, state.selectedPeriod);
    renderKPICards(metrics);
    renderCharts(metrics);
    renderMonthlyTable();
    renderHeatmap();
    renderDailyLogTable();
    saveToLocalStorage();
  }

  // --- Modals & User Interactions ---

  function setupModals() {
    // Settings Modal
    const settingsModal = document.getElementById('settingsModal');
    document.getElementById('openSettingsBtn').addEventListener('click', () => {
      document.getElementById('settingTargetHours').value = state.settings.targetHours;
      document.getElementById('settingBalanceSource').value = state.settings.balanceMode;
      document.getElementById('settingShowWeekends').checked = state.settings.showWeekends;
      settingsModal.classList.add('open');
    });
    document.getElementById('closeSettingsModalBtn').addEventListener('click', () => {
      settingsModal.classList.remove('open');
    });
    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
      const targetH = parseFloat(document.getElementById('settingTargetHours').value) || 8.0;
      state.settings.targetHours = targetH;
      state.settings.targetMinutes = targetH * 60;
      state.settings.balanceMode = document.getElementById('settingBalanceSource').value;
      state.settings.showWeekends = document.getElementById('settingShowWeekends').checked;
      settingsModal.classList.remove('open');
      showToast('Settings saved & metrics updated');
      updateDashboard();
    });

    // Add Record Button
    const addRowBtn = document.getElementById('addSingleRowBtn');
    if (addRowBtn) {
      addRowBtn.addEventListener('click', () => {
        openEditModal(null); // Add Mode
      });
    }

    // Paste Modal Setup
    const pasteModal = document.getElementById('pasteModal');
    const pasteInput = document.getElementById('pasteInput');
    const commitPasteBtn = document.getElementById('commitPasteBtn');
    const pasteStatusMsg = document.getElementById('pasteStatusMsg');

    let activePasteTab = 'clipboard'; // 'clipboard' or 'manual'

    // Tab buttons
    const tabBtnClipboard = document.getElementById('tabBtnClipboard');
    const tabBtnManualColumns = document.getElementById('tabBtnManualColumns');
    const tabContentClipboard = document.getElementById('tabContentClipboard');
    const tabContentManualColumns = document.getElementById('tabContentManualColumns');

    if (tabBtnClipboard && tabBtnManualColumns) {
      tabBtnClipboard.addEventListener('click', () => {
        activePasteTab = 'clipboard';
        tabBtnClipboard.classList.add('active');
        tabBtnManualColumns.classList.remove('active');
        tabContentClipboard.style.display = 'block';
        tabContentManualColumns.style.display = 'none';
      });

      tabBtnManualColumns.addEventListener('click', () => {
        activePasteTab = 'manual';
        tabBtnManualColumns.classList.add('active');
        tabBtnClipboard.classList.remove('active');
        tabContentManualColumns.style.display = 'block';
        tabContentClipboard.style.display = 'none';
        if (!document.getElementById('colDate').value) {
          initManualColumnDate();
        }
      });
    }

    // Open Modal
    document.getElementById('openPasteModalBtn').addEventListener('click', () => {
      pasteInput.value = '';
      parsedPastedRows = [];
      document.getElementById('pastePreviewArea').style.display = 'none';
      if (pasteStatusMsg) {
        pasteStatusMsg.style.display = 'none';
        pasteStatusMsg.innerHTML = '';
      }
      commitPasteBtn.textContent = 'Append to Dashboard';
      initManualColumnDate();
      pasteModal.classList.add('open');
      if (activePasteTab === 'clipboard') {
        setTimeout(() => pasteInput.focus(), 100);
      }
    });

    document.getElementById('closePasteModalBtn').addEventListener('click', () => {
      pasteModal.classList.remove('open');
    });

    const cancelPasteBtn = document.getElementById('cancelPasteBtn');
    if (cancelPasteBtn) {
      cancelPasteBtn.addEventListener('click', () => {
        pasteModal.classList.remove('open');
      });
    }

    const pasteSampleBtn = document.getElementById('pasteSampleBtn');
    if (pasteSampleBtn) {
      pasteSampleBtn.addEventListener('click', () => {
        pasteInput.value = '30-Oct-2026 10:30 19:00 8.30 8.30\n31-Oct-2026 Saturday - - - - Weekend';
        liveParsePastedInput();
      });
    }

    // Auto-parse live on every keystroke or paste
    pasteInput.addEventListener('input', () => {
      liveParsePastedInput();
    });
    pasteInput.addEventListener('paste', () => {
      setTimeout(liveParsePastedInput, 50);
    });

    // Manual Column Form event listeners
    const colDate = document.getElementById('colDate');
    if (colDate) {
      colDate.addEventListener('change', () => {
        if (colDate.value) {
          document.getElementById('colDay').value = getDayName(colDate.value);
          updateColLivePreview();
        }
      });
    }

    ['colTimeIn', 'colTimeOut', 'colWorkingHours', 'colStatus', 'colBalanceOverride'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', updateColLivePreview);
      if (el) el.addEventListener('change', updateColLivePreview);
    });

    const addColRowBtn = document.getElementById('addColRowBtn');
    if (addColRowBtn) {
      addColRowBtn.addEventListener('click', () => {
        handleAddManualColumnRow();
      });
    }

    const clearColFormBtn = document.getElementById('clearColFormBtn');
    if (clearColFormBtn) {
      clearColFormBtn.addEventListener('click', () => {
        initManualColumnDate();
      });
    }

    const clearPreviewListBtn = document.getElementById('clearPreviewListBtn');
    if (clearPreviewListBtn) {
      clearPreviewListBtn.addEventListener('click', () => {
        parsedPastedRows = [];
        renderQueuedPreviewTable();
      });
    }

    commitPasteBtn.addEventListener('click', () => {
      handleCommitPastedRows();
    });

    // Edit Row Modal
    const editModal = document.getElementById('editRowModal');
    document.getElementById('closeEditModalBtn').addEventListener('click', () => {
      editModal.classList.remove('open');
    });
    const cancelEditBtn = document.getElementById('cancelEditModalBtn');
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', () => {
        editModal.classList.remove('open');
      });
    }
    document.getElementById('saveEditRowBtn').addEventListener('click', () => {
      handleSaveEditedRow();
    });
    document.getElementById('deleteRowBtn').addEventListener('click', () => {
      handleDeleteRow();
    });

    // Dynamic date change listener in Edit modal
    const editDateInput = document.getElementById('editDate');
    editDateInput.addEventListener('change', () => {
      const dVal = editDateInput.value;
      if (dVal) {
        document.getElementById('editDay').value = getDayName(dVal);
        updateEditModalPreview();
      }
    });

    ['editWorkingHours', 'editTimeIn', 'editTimeOut', 'editStatus', 'editMinutesBalance'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', updateEditModalPreview);
    });

    // Close on backdrop click
    [settingsModal, pasteModal, editModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    });

    // Filter pills in daily table
    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.activeTableFilter = pill.getAttribute('data-filter');
        renderDailyLogTable();
      });
    });

    // Search input in daily table
    document.getElementById('tableSearchInput').addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim();
      renderDailyLogTable();
    });

    // Reset Data buttons (Header and Footer)
    function restoreDefaultData() {
      if (confirm('Are you sure you want to restore the original 109 verified records from Time_In_Out_Tracking.xlsx?')) {
        localStorage.removeItem(STORAGE_KEY_DATA);
        state.records = JSON.parse(JSON.stringify(INITIAL_DATA));
        state.selectedPeriod = 'ALL';
        updateDashboard();
        showToast('Restored all 109 original records');
      }
    }

    document.getElementById('resetDataBtn').addEventListener('click', restoreDefaultData);
    const headerResetBtn = document.getElementById('headerResetBtn');
    if (headerResetBtn) {
      headerResetBtn.addEventListener('click', restoreDefaultData);
    }

    // Export button
    document.getElementById('exportExcelBtn').addEventListener('click', () => {
      exportCurrentDataToExcel();
    });
  }

  function openEditModal(record) {
    const isAdd = !record;
    state.editingRecordDate = isAdd ? null : record.date;

    const titleEl = document.getElementById('editModalTitle');
    const headerEl = document.getElementById('editRowDateHeader');
    const deleteBtn = document.getElementById('deleteRowBtn');
    const saveBtn = document.getElementById('saveEditRowBtn');

    if (isAdd) {
      if (titleEl) titleEl.textContent = 'Add New Record';
      if (headerEl) headerEl.textContent = 'Manually add hours or a leave day';
      deleteBtn.style.display = 'none';
      saveBtn.textContent = 'Add Record';

      // Default to next day after the latest record
      let nextDate = new Date().toISOString().slice(0, 10);
      if (state.records.length > 0) {
        const lastRec = state.records[state.records.length - 1];
        try {
          const [y, m, d] = lastRec.date.split('-').map(Number);
          const dt = new Date(y, m - 1, d + 1);
          nextDate = dt.toISOString().slice(0, 10);
        } catch {}
      }

      document.getElementById('editDate').value = nextDate;
      document.getElementById('editDay').value = getDayName(nextDate);
      document.getElementById('editTimeIn').value = '10:30';
      document.getElementById('editTimeOut').value = '19:00';
      document.getElementById('editWorkingHours').value = '8:30';
      document.getElementById('editStatus').value = '';
      document.getElementById('editMinutesBalance').value = '';
    } else {
      if (titleEl) titleEl.textContent = 'Edit Record';
      if (headerEl) headerEl.textContent = `Record: ${record.date} (${record.day})`;
      deleteBtn.style.display = 'inline-block';
      saveBtn.textContent = 'Save Changes';

      document.getElementById('editDate').value = record.date;
      document.getElementById('editDay').value = record.day;
      document.getElementById('editTimeIn').value = record.timeIn !== '-' ? record.timeIn : '';
      document.getElementById('editTimeOut').value = record.timeOut !== '-' ? record.timeOut : '';

      const whMin = record.workingHoursMin;
      document.getElementById('editWorkingHours').value = whMin !== null ? (whMin / 60).toFixed(2) : '';
      document.getElementById('editStatus').value = record.status || '';
      document.getElementById('editMinutesBalance').value = record.minutesBalance !== null ? record.minutesBalance : '';
    }

    updateEditModalPreview();
    document.getElementById('editRowModal').classList.add('open');
  }

  function updateEditModalPreview() {
    const previewEl = document.getElementById('editRowPreview');
    if (!previewEl) return;

    const whStr = document.getElementById('editWorkingHours').value.trim();
    const stStr = document.getElementById('editStatus').value.trim();
    const manBalStr = document.getElementById('editMinutesBalance').value.trim();

    const whMin = parseDurationString(whStr);
    const targetMin = state.settings.targetMinutes;

    if (manBalStr !== '') {
      const b = parseFloat(manBalStr);
      const sign = b > 0 ? '+' : '';
      previewEl.innerHTML = `<strong>Manual Balance Override:</strong> ${sign}${b} min (${sign}${(b/60).toFixed(1)}h)`;
      previewEl.style.color = b >= 0 ? '#34d399' : '#fb7185';
      return;
    }

    if (stStr.toLowerCase().includes('weekend')) {
      previewEl.innerHTML = `<strong>Status:</strong> Weekend (Non-working day, 0m balance)`;
      previewEl.style.color = 'var(--text-muted)';
      return;
    }

    if (whMin !== null) {
      const bal = whMin - targetMin;
      const sign = bal > 0 ? '+' : '';
      const balClass = bal >= 0 ? '#34d399' : '#fb7185';
      previewEl.innerHTML = `<strong>Net Working Hours:</strong> ${(whMin/60).toFixed(2)}h (${minutesToHourMinStr(whMin)}) · <strong style="color:${balClass};">Balance: ${sign}${bal.toFixed(0)}m (${sign}${(bal/60).toFixed(1)}h)</strong>`;
      previewEl.style.color = 'var(--text-main)';
    } else {
      previewEl.innerHTML = `<strong>Non-logged day / Holiday:</strong> 0 working minutes`;
      previewEl.style.color = 'var(--text-subtle)';
    }
  }

  function handleSaveEditedRow() {
    const originalDate = state.editingRecordDate;
    const newDate = document.getElementById('editDate').value.trim();
    const day = document.getElementById('editDay').value.trim() || getDayName(newDate);

    if (!newDate) {
      alert('Please enter a valid date.');
      return;
    }

    const timeIn = document.getElementById('editTimeIn').value.trim() || '-';
    const timeOut = document.getElementById('editTimeOut').value.trim() || '-';
    const status = document.getElementById('editStatus').value.trim();

    const whInput = document.getElementById('editWorkingHours').value.trim();
    const workingHoursMin = parseDurationString(whInput);

    const balInput = document.getElementById('editMinutesBalance').value.trim();
    const minutesBalance = balInput !== '' ? parseFloat(balInput) : null;

    const newRecord = {
      date: newDate,
      day: day,
      timeIn: timeIn,
      timeOut: timeOut,
      workingHoursMin: workingHoursMin,
      totalTimeMin: workingHoursMin,
      status: status,
      minutesBalance: minutesBalance
    };

    // If editing existing record and date didn't change:
    if (originalDate && originalDate === newDate) {
      const idx = state.records.findIndex(r => r.date === originalDate);
      if (idx !== -1) state.records[idx] = newRecord;
    } else {
      // If date changed or adding new, remove old if existed
      if (originalDate) {
        state.records = state.records.filter(r => r.date !== originalDate);
      }
      // Replace existing with newDate or append
      const existingIdx = state.records.findIndex(r => r.date === newDate);
      if (existingIdx !== -1) {
        state.records[existingIdx] = newRecord;
      } else {
        state.records.push(newRecord);
      }
    }

    state.records.sort((a, b) => a.date.localeCompare(b.date));

    // Switch period to view month
    const mKey = getMonthKey(newDate);
    if (mKey) state.selectedPeriod = mKey;

    document.getElementById('editRowModal').classList.remove('open');
    showToast(`Saved record for ${newDate}`);
    updateDashboard();
  }

  function handleDeleteRow() {
    const date = state.editingRecordDate;
    if (!date) return;
    if (confirm(`Are you sure you want to delete the record for ${date}?`)) {
      state.records = state.records.filter(r => r.date !== date);
      document.getElementById('editRowModal').classList.remove('open');
      showToast(`Deleted record for ${date}`);
      updateDashboard();
    }
  }

  // --- Real-time Pasted Rows Parser ---

  let parsedPastedRows = [];

  function parseDateStringFlexible(str) {
    if (!str) return null;
    str = String(str).replace(/,/g, '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

    // Excel serial number (e.g. 46204)
    if (/^\d{5}$/.test(str)) {
      const num = parseInt(str, 10);
      const date = new Date((num - 25569) * 86400 * 1000);
      return date.toISOString().slice(0, 10);
    }

    // DD-MMM-YYYY or DD-MMM-YY e.g. 30-Oct-2026, 01-Nov-26
    const m1 = str.match(/^(\d{1,2})[-/\s]([A-Za-z]{3,9})[-/\s](\d{2,4})$/);
    if (m1) {
      const d = parseInt(m1[1], 10);
      const mStr = m1[2].toLowerCase().substring(0, 3);
      let y = parseInt(m1[3], 10);
      if (y < 100) y += 2000;
      const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
      const m = months.indexOf(mStr) + 1;
      if (m >= 1 && d >= 1 && d <= 31) {
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }

    // MMM-DD-YYYY or MMM DD YYYY e.g. Oct 30, 2026
    const m2 = str.match(/^([A-Za-z]{3,9})[-/\s]+(\d{1,2})[-/\s]+(\d{2,4})$/);
    if (m2) {
      const mStr = m2[1].toLowerCase().substring(0, 3);
      const d = parseInt(m2[2], 10);
      let y = parseInt(m2[3], 10);
      if (y < 100) y += 2000;
      const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
      const m = months.indexOf(mStr) + 1;
      if (m >= 1 && d >= 1 && d <= 31) {
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }

    // DD/MM/YYYY or MM/DD/YYYY
    const m3 = str.match(/^(\d{1,2})[-/\.](\d{1,2})[-/\.](\d{2,4})$/);
    if (m3) {
      const n1 = parseInt(m3[1], 10);
      const n2 = parseInt(m3[2], 10);
      let y = parseInt(m3[3], 10);
      if (y < 100) y += 2000;
      let d = n1, m = n2;
      if (n1 > 12 && n2 <= 12) { d = n1; m = n2; }
      else if (n2 > 12 && n1 <= 12) { d = n2; m = n1; }
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    return null;
  }

  function parseDurationString(v) {
    if (!v || v === '-' || v === 'None') return null;
    v = String(v).trim();
    if (v.includes(':')) {
      const p = v.split(':');
      return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
    }
    // Handles formats like 8.30 (8h 30m) or 8.5
    if (v.includes('.')) {
      const p = v.split('.');
      const h = parseInt(p[0], 10) || 0;
      let minPart = p[1];
      if (minPart.length === 1) minPart += '0';
      const m = parseInt(minPart.substring(0, 2), 10) || 0;
      // If minutes portion <= 59, it's HH.MM format (e.g. 8.30 -> 8h 30m)
      if (m <= 59) return h * 60 + m;
      return parseFloat(v) * 60;
    }
    const num = parseFloat(v);
    if (!isNaN(num)) return num * 60;
    return null;
  }

  function parseSingleLine(line) {
    line = line.trim();
    if (!line) return null;

    let tokens = [];
    if (line.includes('\t')) {
      tokens = line.split('\t').map(t => t.trim());
    } else if (line.includes(',') && !line.match(/\d+,\s*\d{4}/)) {
      tokens = line.split(',').map(t => t.trim());
    } else {
      tokens = line.split(/\s+/).map(t => t.trim());
    }

    if (tokens.length === 0) return null;

    // Search for date token across the line
    let dateStr = null;
    let dateIdx = -1;
    for (let i = 0; i < tokens.length; i++) {
      const d = parseDateStringFlexible(tokens[i]);
      if (d) {
        dateStr = d;
        dateIdx = i;
        break;
      }
    }

    if (!dateStr) return null; // No date found in line

    // Derive day of week
    const dt = new Date(dateStr + 'T12:00:00');
    const dayName = dt.toLocaleDateString('en-US', { weekday: 'long' });

    // Look at tokens after the date
    const afterDate = tokens.slice(dateIdx + 1);
    const dayNames = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    if (afterDate.length > 0 && dayNames.includes(afterDate[0].toLowerCase())) {
      afterDate.shift();
    }

    let timeIn = '-';
    let timeOut = '-';
    let workingHoursMin = null;
    let totalTimeMin = null;
    let statusParts = [];

    // If structured line (tabular format with dashes)
    if (line.includes('\t') || (afterDate.length >= 4 && afterDate.includes('-'))) {
      timeIn = afterDate[0] || '-';
      timeOut = afterDate[1] || '-';
      workingHoursMin = parseDurationString(afterDate[2]);
      totalTimeMin = parseDurationString(afterDate[3]);
      statusParts = afterDate.slice(4).filter(s => s && s !== '-' && s !== 'Break Hours');
    } else {
      // Space separated row e.g.: 30-Oct-2026 10:30 19:00 8.30 8.30
      afterDate.forEach(tok => {
        if (!tok || tok === '-') return;
        if (/^\d{1,2}:\d{2}/.test(tok)) {
          if (timeIn === '-') timeIn = tok.substring(0, 5);
          else if (timeOut === '-') timeOut = tok.substring(0, 5);
          else if (workingHoursMin === null) workingHoursMin = parseDurationString(tok);
          else if (totalTimeMin === null) totalTimeMin = parseDurationString(tok);
        } else if (/^\d{1,2}\.\d{1,2}$/.test(tok)) {
          if (workingHoursMin === null) workingHoursMin = parseDurationString(tok);
          else if (totalTimeMin === null) totalTimeMin = parseDurationString(tok);
        } else {
          statusParts.push(tok);
        }
      });
    }

    // Auto calculate working hours if timeIn and timeOut exist but workingHours wasn't explicit
    if (workingHoursMin === null && timeIn !== '-' && timeOut !== '-') {
      const [h1, m1] = timeIn.split(':').map(Number);
      const [h2, m2] = timeOut.split(':').map(Number);
      const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (diff > 0) workingHoursMin = diff;
    }

    const status = statusParts.join(' ').trim();

    return {
      date: dateStr,
      day: dayName,
      timeIn: timeIn !== '-' ? timeIn : '-',
      timeOut: timeOut !== '-' ? timeOut : '-',
      workingHoursMin: workingHoursMin,
      totalTimeMin: totalTimeMin || workingHoursMin,
      status: status,
      minutesBalance: null
    };
  }

  function initManualColumnDate() {
    let nextDate = new Date().toISOString().slice(0, 10);
    if (state.records.length > 0) {
      const lastRec = state.records[state.records.length - 1];
      try {
        const [y, m, d] = lastRec.date.split('-').map(Number);
        const dt = new Date(y, m - 1, d + 1);
        nextDate = dt.toISOString().slice(0, 10);
      } catch {}
    }

    const colDate = document.getElementById('colDate');
    const colDay = document.getElementById('colDay');
    if (colDate) colDate.value = nextDate;
    if (colDay) colDay.value = getDayName(nextDate);
    const colTimeIn = document.getElementById('colTimeIn');
    if (colTimeIn) colTimeIn.value = '10:30';
    const colTimeOut = document.getElementById('colTimeOut');
    if (colTimeOut) colTimeOut.value = '19:00';
    const colWorkingHours = document.getElementById('colWorkingHours');
    if (colWorkingHours) colWorkingHours.value = '8:30';
    const colStatus = document.getElementById('colStatus');
    if (colStatus) colStatus.value = '';
    const colBalanceOverride = document.getElementById('colBalanceOverride');
    if (colBalanceOverride) colBalanceOverride.value = '';

    updateColLivePreview();
  }

  function updateColLivePreview() {
    const previewEl = document.getElementById('colLivePreview');
    if (!previewEl) return;

    const whStr = (document.getElementById('colWorkingHours') ? document.getElementById('colWorkingHours').value : '').trim();
    const timeInStr = (document.getElementById('colTimeIn') ? document.getElementById('colTimeIn').value : '').trim();
    const timeOutStr = (document.getElementById('colTimeOut') ? document.getElementById('colTimeOut').value : '').trim();
    const statusStr = (document.getElementById('colStatus') ? document.getElementById('colStatus').value : '').trim();
    const balOverStr = (document.getElementById('colBalanceOverride') ? document.getElementById('colBalanceOverride').value : '').trim();

    let whMin = parseDurationString(whStr);

    // If working hours empty, auto derive from in/out
    if (whMin === null && timeInStr && timeOutStr && timeInStr !== '-' && timeOutStr !== '-') {
      const tin = parseTimeToMinutesFromMidnight(timeInStr);
      const tout = parseTimeToMinutesFromMidnight(timeOutStr);
      if (tin !== null && tout !== null && tout > tin) {
        whMin = tout - tin;
      }
    }

    if (balOverStr !== '') {
      const b = parseFloat(balOverStr);
      const sign = b > 0 ? '+' : '';
      previewEl.innerHTML = `<strong>Manual Balance Override:</strong> ${sign}${b}m (${sign}${(b/60).toFixed(1)}h)`;
      previewEl.style.color = b >= 0 ? '#34d399' : '#fb7185';
      return;
    }

    if (statusStr.toLowerCase().includes('weekend')) {
      previewEl.innerHTML = `<strong>Status: Weekend</strong> (0m balance, non-working day)`;
      previewEl.style.color = 'var(--text-muted)';
      return;
    }

    if (whMin !== null) {
      const balMin = whMin - state.settings.targetMinutes;
      const sign = balMin > 0 ? '+' : '';
      const balClass = balMin >= 0 ? '#34d399' : '#fb7185';
      previewEl.innerHTML = `<strong>Net Working Hours:</strong> ${(whMin/60).toFixed(2)}h (${minutesToHourMinStr(whMin)}) · <strong style="color:${balClass};">Balance: ${sign}${balMin.toFixed(0)}m (${sign}${(balMin/60).toFixed(1)}h)</strong>`;
      previewEl.style.color = 'var(--text-main)';
    } else {
      previewEl.innerHTML = `Enter working hours (e.g. 8:30 or 8.5) or in/out times to preview`;
      previewEl.style.color = 'var(--text-muted)';
    }
  }

  function handleAddManualColumnRow() {
    const colDate = document.getElementById('colDate').value.trim();
    if (!colDate) {
      alert('Please select or enter a date');
      return;
    }

    const colDay = document.getElementById('colDay').value.trim() || getDayName(colDate);
    const colTimeIn = document.getElementById('colTimeIn').value.trim() || '-';
    const colTimeOut = document.getElementById('colTimeOut').value.trim() || '-';
    const colStatus = document.getElementById('colStatus').value.trim();

    let whMin = parseDurationString(document.getElementById('colWorkingHours').value.trim());
    if (whMin === null && colTimeIn !== '-' && colTimeOut !== '-') {
      const tin = parseTimeToMinutesFromMidnight(colTimeIn);
      const tout = parseTimeToMinutesFromMidnight(colTimeOut);
      if (tin !== null && tout !== null && tout > tin) whMin = tout - tin;
    }

    const balOver = document.getElementById('colBalanceOverride').value.trim();
    const minutesBalance = balOver !== '' ? parseFloat(balOver) : null;

    const newRec = {
      date: colDate,
      day: colDay,
      timeIn: colTimeIn,
      timeOut: colTimeOut,
      workingHoursMin: whMin,
      totalTimeMin: whMin,
      status: colStatus,
      minutesBalance: minutesBalance
    };

    // Remove existing from parsedPastedRows if date matches, then add
    parsedPastedRows = parsedPastedRows.filter(r => r.date !== colDate);
    parsedPastedRows.push(newRec);
    parsedPastedRows.sort((a, b) => a.date.localeCompare(b.date));

    renderQueuedPreviewTable();

    // Advance date to next calendar day automatically
    try {
      const [y, m, d] = colDate.split('-').map(Number);
      const nextDt = new Date(y, m - 1, d + 1);
      const nextDateStr = nextDt.toISOString().slice(0, 10);
      document.getElementById('colDate').value = nextDateStr;
      document.getElementById('colDay').value = getDayName(nextDateStr);
      updateColLivePreview();
    } catch {}

    showToast(`Added ${colDate} to list (${parsedPastedRows.length} rows queued)`);
  }

  function renderQueuedPreviewTable() {
    const previewArea = document.getElementById('pastePreviewArea');
    const commitBtn = document.getElementById('commitPasteBtn');
    const previewTbody = document.querySelector('#pastePreviewTable tbody');
    const countEl = document.getElementById('parsedRowCount');

    if (parsedPastedRows.length === 0) {
      if (previewArea) previewArea.style.display = 'none';
      if (commitBtn) commitBtn.textContent = 'Append to Dashboard';
      return;
    }

    if (countEl) countEl.textContent = parsedPastedRows.length;
    if (commitBtn) commitBtn.textContent = `Append ${parsedPastedRows.length} Row${parsedPastedRows.length > 1 ? 's' : ''} to Dashboard`;

    if (previewTbody) {
      previewTbody.innerHTML = '';
      parsedPastedRows.forEach((r, idx) => {
        const tr = document.createElement('tr');
        const whH = r.workingHoursMin ? (r.workingHoursMin / 60).toFixed(2) + 'h' : '-';
        const balMin = r.workingHoursMin ? (r.workingHoursMin - state.settings.targetMinutes) : 0;
        const balSign = balMin > 0 ? '+' : '';
        const balClass = balMin >= 0 ? 'text-surplus' : 'text-deficit';

        tr.innerHTML = `
          <td class="cell-mono"><strong>${r.date}</strong></td>
          <td>${r.day}</td>
          <td class="cell-mono">${r.timeIn}</td>
          <td class="cell-mono">${r.timeOut}</td>
          <td class="cell-mono">${whH}</td>
          <td class="cell-mono ${balClass}">${r.workingHoursMin ? `${balSign}${balMin.toFixed(0)}m` : '-'}</td>
          <td><span class="badge-status ${r.status ? 'leave' : 'regular'}">${r.status || 'Normal Day'}</span></td>
          <td>
            <button type="button" class="btn-text-danger btn-remove-preview" data-idx="${idx}" title="Remove this row" style="font-weight:bold; padding:0 0.35rem;">&times;</button>
          </td>
        `;

        tr.querySelector('.btn-remove-preview').addEventListener('click', (e) => {
          const remIdx = parseInt(e.target.getAttribute('data-idx'), 10);
          parsedPastedRows.splice(remIdx, 1);
          renderQueuedPreviewTable();
        });

        previewTbody.appendChild(tr);
      });
    }

    if (previewArea) previewArea.style.display = 'block';
  }

  function liveParsePastedInput() {
    const raw = document.getElementById('pasteInput').value.trim();
    const statusMsg = document.getElementById('pasteStatusMsg');

    if (!raw) {
      parsedPastedRows = [];
      renderQueuedPreviewTable();
      if (statusMsg) statusMsg.style.display = 'none';
      return;
    }

    const lines = raw.split(/\r?\n/).filter(line => line.trim().length > 0);
    parsedPastedRows = [];

    lines.forEach(line => {
      const rec = parseSingleLine(line);
      if (rec) parsedPastedRows.push(rec);
    });

    if (parsedPastedRows.length === 0) {
      renderQueuedPreviewTable();
      if (statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.style.color = '#fb7185';
        statusMsg.textContent = '⚠ No valid dates detected. Format example: 30-Oct-2026 10:30 19:00 8.30 8.30';
      }
      return;
    }

    // Success
    if (statusMsg) {
      statusMsg.style.display = 'block';
      statusMsg.style.color = '#34d399';
      statusMsg.textContent = `✔ Successfully detected ${parsedPastedRows.length} valid row${parsedPastedRows.length > 1 ? 's' : ''}`;
    }

    renderQueuedPreviewTable();
  }

  function handleCommitPastedRows() {
    const manualTabActive = document.getElementById('tabContentManualColumns') && 
                            document.getElementById('tabContentManualColumns').style.display !== 'none';

    // If currently on manual tab and the date input is filled but user didn't click "Add to Batch"
    if (manualTabActive && parsedPastedRows.length === 0) {
      const colDate = document.getElementById('colDate').value.trim();
      if (colDate) {
        handleAddManualColumnRow();
      }
    }

    // If on clipboard tab and not parsed yet, parse now
    if (!manualTabActive && parsedPastedRows.length === 0) {
      liveParsePastedInput();
    }

    if (parsedPastedRows.length === 0) {
      alert('Please enter or paste at least one record with a valid date');
      return;
    }

    const replaceExisting = document.getElementById('replaceExistingCheck').checked;
    const existingDateMap = new Map(state.records.map((r, idx) => [r.date, idx]));

    let addedCount = 0;
    let updatedCount = 0;
    let targetMonth = null;

    parsedPastedRows.forEach(newR => {
      targetMonth = getMonthKey(newR.date);
      if (existingDateMap.has(newR.date)) {
        if (replaceExisting) {
          state.records[existingDateMap.get(newR.date)] = newR;
          updatedCount++;
        }
      } else {
        state.records.push(newR);
        addedCount++;
      }
    });

    // Re-sort chronologically
    state.records.sort((a, b) => a.date.localeCompare(b.date));

    // If a month was added, switch period to that month so the user sees it immediately
    if (targetMonth) {
      state.selectedPeriod = targetMonth;
    }

    document.getElementById('pasteModal').classList.remove('open');
    showToast(`Successfully saved: ${addedCount} added, ${updatedCount} updated!`);
    updateDashboard();
  }

  // --- Excel File Drag & Drop / Upload Handler ---

  function setupExcelUpload() {
    const fileInput = document.getElementById('excelFileInput');
    const dropOverlay = document.getElementById('dropOverlay');

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        processExcelFile(e.target.files[0]);
        fileInput.value = '';
      }
    });

    // Drag and Drop
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropOverlay.classList.add('active');
    });

    dropOverlay.addEventListener('dragleave', (e) => {
      if (e.relatedTarget === null) {
        dropOverlay.classList.remove('active');
      }
    });

    dropOverlay.addEventListener('drop', (e) => {
      e.preventDefault();
      dropOverlay.classList.remove('active');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processExcelFile(e.dataTransfer.files[0]);
      }
    });
  }

  function processExcelFile(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        // Prefer 'Total FY', else 'Calc', else first sheet
        let sheetName = workbook.SheetNames.includes('Total FY') ? 'Total FY' :
                        (workbook.SheetNames.includes('Calc') ? 'Calc' : workbook.SheetNames[0]);

        const sheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });

        if (rawJson.length < 2) {
          alert('Excel file has no data rows.');
          return;
        }

        // Find header row indices
        let headerRowIdx = -1;
        let colMap = {};

        for (let r = 0; r < Math.min(10, rawJson.length); r++) {
          const row = rawJson[r].map(c => String(c || '').toLowerCase().trim());
          if (row.includes('date') || row.includes('working hours') || row.includes('status')) {
            headerRowIdx = r;
            row.forEach((h, idx) => {
              if (h.includes('date')) colMap.date = idx;
              else if (h.includes('day') && !colMap.day) colMap.day = idx;
              else if (h.includes('time in') || h === 'in') colMap.timeIn = idx;
              else if (h.includes('time out') || h === 'out') colMap.timeOut = idx;
              else if (h.includes('working hours') || h === 'wh') colMap.workingHours = idx;
              else if (h.includes('totaltime') || h.includes('total time')) colMap.totalTime = idx;
              else if (h.includes('status')) colMap.status = idx;
              else if (h.includes('minutes balance') || h.includes('balance')) colMap.balance = idx;
            });
            break;
          }
        }

        // Fallback for standard layout (Total FY sheet structure)
        if (headerRowIdx === -1 || colMap.date === undefined) {
          headerRowIdx = 0;
          colMap = {
            date: 5,
            day: 6,
            timeIn: 7,
            timeOut: 8,
            workingHours: 9,
            totalTime: 10,
            status: 11,
            balance: 13
          };
        }

        const newRecords = [];
        for (let r = headerRowIdx + 1; r < rawJson.length; r++) {
          const row = rawJson[r];
          if (!row || row.length === 0) continue;

          const rawDate = row[colMap.date];
          const dateStr = parseDateString(String(rawDate || ''));
          if (!dateStr || dateStr === 'None') continue;

          const dayStr = String(row[colMap.day] || getDayName(dateStr));
          const timeInStr = String(row[colMap.timeIn] || '-').trim();
          const timeOutStr = String(row[colMap.timeOut] || '-').trim();
          const rawWh = row[colMap.workingHours];
          const rawTt = row[colMap.totalTime];
          const status = String(row[colMap.status] || '').trim();
          const rawBal = row[colMap.balance];

          newRecords.push({
            date: dateStr,
            day: dayStr,
            timeIn: timeInStr,
            timeOut: timeOutStr,
            workingHoursMin: parseMinutes(rawWh),
            totalTimeMin: parseMinutes(rawTt),
            status: status === '-' ? '' : status,
            minutesBalance: parseMinutes(rawBal)
          });
        }

        if (newRecords.length === 0) {
          alert('Could not parse valid records from Excel sheet.');
          return;
        }

        state.records = newRecords;
        showToast(`Loaded ${newRecords.length} records from ${file.name}`);
        updateDashboard();

      } catch (err) {
        console.error('Excel parse error:', err);
        alert('Error parsing Excel file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // --- Export Data as Excel / CSV ---

  function formatExportRow(r) {
    const bal = getRecordBalance(r);
    const wh = r.workingHoursMin !== null ? parseFloat((r.workingHoursMin / 60).toFixed(2)) : '-';
    const tt = r.totalTimeMin !== null ? parseFloat((r.totalTimeMin / 60).toFixed(2)) : wh;
    return {
      'Date': r.date,
      'Day': r.day,
      'Time In': r.timeIn || '-',
      'Time Out': r.timeOut || '-',
      'Working Hours': wh,
      'Total Time': tt,
      'Status': r.status || '',
      'Minutes Balance': isWorkingDay(r) ? bal : 0,
      'Balance (Hours)': isWorkingDay(r) ? parseFloat((bal / 60).toFixed(2)) : 0,
      'Compliance': isWorkingDay(r) ? (bal >= 0 ? 'MET' : 'DEFICIT') : 'NON-WORKING'
    };
  }

  function exportCurrentDataToExcel() {
    try {
      if (typeof XLSX !== 'undefined') {
        const wb = XLSX.utils.book_new();

        // 1. "Total FY" Sheet containing all records
        const allRows = state.records.map(formatExportRow);
        const wsAll = XLSX.utils.json_to_sheet(allRows);
        XLSX.utils.book_append_sheet(wb, wsAll, 'Total FY');

        // 2. Individual Monthly Sheets (July, August, September, October, November...)
        const monthsMap = new Map();
        state.records.forEach(r => {
          const mKey = getMonthKey(r.date);
          if (!mKey) return;
          if (!monthsMap.has(mKey)) monthsMap.set(mKey, []);
          monthsMap.get(mKey).push(r);
        });

        const sortedMonths = Array.from(monthsMap.keys()).sort();
        sortedMonths.forEach(mKey => {
          const mRecs = monthsMap.get(mKey);
          const mLabel = getMonthLabel(mKey).replace(/\s+\d{4}/, '');
          const mRows = mRecs.map(formatExportRow);
          const wsMonth = XLSX.utils.json_to_sheet(mRows);
          const sheetTitle = (mLabel || mKey).substring(0, 31);
          XLSX.utils.book_append_sheet(wb, wsMonth, sheetTitle);
        });

        // Trigger direct Blob download for maximum browser reliability
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date().toISOString().slice(0, 10);
        a.download = `Time_In_Out_Tracking_FY2026_27_${dateStr}.xlsx`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 300);

        showToast('Exported multi-sheet Excel file (Total FY + Months)');
      } else {
        exportCurrentDataToCsv();
      }
    } catch (err) {
      console.error('Excel export error, falling back to CSV:', err);
      exportCurrentDataToCsv();
    }
  }

  function exportCurrentDataToCsv() {
    try {
      const headers = ['Date', 'Day', 'Time In', 'Time Out', 'Working Hours', 'Total Time', 'Status', 'Minutes Balance', 'Compliance'];
      const rows = state.records.map(r => {
        const bal = getRecordBalance(r);
        const wh = r.workingHoursMin !== null ? (r.workingHoursMin / 60).toFixed(2) : '-';
        const tt = r.totalTimeMin !== null ? (r.totalTimeMin / 60).toFixed(2) : wh;
        return [
          `"${r.date}"`,
          `"${r.day}"`,
          `"${r.timeIn || '-'}"`,
          `"${r.timeOut || '-'}"`,
          `"${wh}"`,
          `"${tt}"`,
          `"${r.status || ''}"`,
          `"${isWorkingDay(r) ? bal : 0}"`,
          `"${isWorkingDay(r) ? (bal >= 0 ? 'MET' : 'DEFICIT') : 'NON-WORKING'}"`
        ].join(',');
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Time_In_Out_Tracking_FY2026_27_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 300);
      showToast('Exported dataset to CSV file');
    } catch (e) {
      alert('Could not export file: ' + e.message);
    }
  }

  window.exportCurrentDataToExcel = exportCurrentDataToExcel;

  // --- Persistence & Storage ---

  function saveToLocalStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(state.records));
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(state.settings));
      const statusText = document.getElementById('dataStatusText');
      if (statusText) statusText.textContent = `${state.records.length} Records Saved`;
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  function loadFromLocalStorage() {
    try {
      const storedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (storedSettings) {
        state.settings = { ...defaultSettings, ...JSON.parse(storedSettings) };
      }

      const storedData = localStorage.getItem(STORAGE_KEY_DATA);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          state.records = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('LocalStorage load error:', e);
    }

    // Default fallback to pre-loaded dataset
    if (typeof INITIAL_DATA !== 'undefined' && Array.isArray(INITIAL_DATA)) {
      state.records = JSON.parse(JSON.stringify(INITIAL_DATA));
    }
  }

  // --- Toast Notification ---

  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // --- Natural Language Quick-Add Engine (Zero-Cost Local Client-Side NLP) ---

  function parseTimeNatural(str) {
    if (!str) return null;
    str = str.toLowerCase().trim();
    const m = str.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
    if (!m) return null;
    let h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    const ampm = m[3];
    if (ampm === 'pm' && h < 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  function parseNaturalLanguageInput(raw) {
    if (!raw || !raw.trim()) return null;
    const text = raw.trim();
    const lower = text.toLowerCase();

    // 1. Action check: Delete / Remove
    const isDelete = /^(?:delete|remove|clear|drop)\s+/i.test(text);

    // 2. Date extraction
    let dateStr = null;

    const today = new Date();
    let defaultYear = 2026;
    if (state.records.length > 0) {
      try {
        defaultYear = parseInt(state.records[state.records.length - 1].date.split('-')[0], 10) || 2026;
      } catch {}
    }

    if (/\btoday\b/i.test(lower)) {
      dateStr = today.toISOString().slice(0, 10);
    } else if (/\byesterday\b/i.test(lower)) {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      dateStr = d.toISOString().slice(0, 10);
    } else if (/\btomorrow\b/i.test(lower)) {
      const d = new Date(today);
      d.setDate(d.getDate() + 1);
      dateStr = d.toISOString().slice(0, 10);
    }

    // Check for explicit YYYY-MM-DD
    if (!dateStr) {
      const mIso = lower.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
      if (mIso) {
        dateStr = `${mIso[1]}-${mIso[2]}-${mIso[3]}`;
      }
    }

    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

    if (!dateStr) {
      // Pattern A: "30th Oct 2026" or "30 Oct" or "30-Oct-2026"
      const mA = lower.match(/\b(\d{1,2})(?:st|nd|rd|th)?[-/\s]+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:[-/\s]+(\d{2,4}))?\b/i);
      if (mA) {
        const d = parseInt(mA[1], 10);
        const mIdx = monthNames.findIndex(mn => mA[2].startsWith(mn)) + 1;
        let y = mA[3] ? parseInt(mA[3], 10) : defaultYear;
        if (y < 100) y += 2000;
        if (!mA[3] && mIdx >= 1 && mIdx <= 6) y = 2027; // FY 2026-27 forward rollover
        dateStr = `${y}-${String(mIdx).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }

    if (!dateStr) {
      // Pattern B: "Oct 30th 2026" or "November 3"
      const mB = lower.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-/\s]+(\d{1,2})(?:st|nd|rd|th)?(?:[-/\s]+(\d{2,4}))?\b/i);
      if (mB) {
        const mIdx = monthNames.findIndex(mn => mB[1].startsWith(mn)) + 1;
        const d = parseInt(mB[2], 10);
        let y = mB[3] ? parseInt(mB[3], 10) : defaultYear;
        if (y < 100) y += 2000;
        if (!mB[3] && mIdx >= 1 && mIdx <= 6) y = 2027;
        dateStr = `${y}-${String(mIdx).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }

    if (!dateStr) {
      // Pattern C: "DD/MM/YYYY" or "DD-MM-YYYY"
      const mC = lower.match(/\b(\d{1,2})[-/](\d{1,2})(?:[-/](\d{2,4}))?\b/);
      if (mC) {
        const d = parseInt(mC[1], 10);
        const m = parseInt(mC[2], 10);
        let y = mC[3] ? parseInt(mC[3], 10) : defaultYear;
        if (y < 100) y += 2000;
        if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
          dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
      }
    }

    if (!dateStr) return null; // Date is required

    const dayName = getDayName(dateStr);

    if (isDelete) {
      return {
        action: 'delete',
        date: dateStr,
        day: dayName
      };
    }

    // 3. Time In extraction
    let timeIn = '-';
    const mIn = lower.match(/(?:came\s+at|in\s+at|arrived\s+at|reached\s+at|from|started\s+at|came|in)\s*[:=]?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    if (mIn) {
      const parsedIn = parseTimeNatural(mIn[1]);
      if (parsedIn) timeIn = parsedIn;
    }

    // 4. Time Out extraction
    let timeOut = '-';
    const mOut = lower.match(/(?:left\s+at|out\s+at|departed\s+at|till|until|to|left|out)\s*[:=]?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    if (mOut) {
      const parsedOut = parseTimeNatural(mOut[1]);
      if (parsedOut) timeOut = parsedOut;
    }

    // Fallback: If timeIn or timeOut was not matched via keywords, scan standalone time tokens
    if (timeIn === '-' || timeOut === '-') {
      const timeMatches = [...lower.matchAll(/\b(\d{1,2}:\d{2}(?:\s*(?:am|pm))?|\d{1,2}\s*(?:am|pm))\b/gi)];
      if (timeMatches.length >= 1 && timeIn === '-') {
        timeIn = parseTimeNatural(timeMatches[0][1]) || '-';
      }
      if (timeMatches.length >= 2 && timeOut === '-') {
        timeOut = parseTimeNatural(timeMatches[1][1]) || '-';
      }
    }

    // 5. Working Hours extraction
    let workingHoursMin = null;
    const mWh = lower.match(/(?:worked|duration|wh|hours?|with)\s*[:=]?\s*(\d{1,2}(?:\.\d{1,2}|:\d{2})?)\s*(?:hours?|hrs?|h)?/i);
    if (mWh) {
      workingHoursMin = parseDurationString(mWh[1]);
    }

    // Fallback for duration: scan for standalone decimal duration (e.g. 8.30 or 8.5)
    if (workingHoursMin === null) {
      const durMatches = [...lower.matchAll(/\b(\d{1,2}\.\d{1,2})\b/g)];
      if (durMatches.length > 0) {
        workingHoursMin = parseDurationString(durMatches[0][1]);
      }
    }

    // Auto-calculate working hours from In & Out if not explicit
    if (workingHoursMin === null && timeIn !== '-' && timeOut !== '-') {
      const tin = parseTimeToMinutesFromMidnight(timeIn);
      const tout = parseTimeToMinutesFromMidnight(timeOut);
      if (tin !== null && tout !== null && tout > tin) {
        workingHoursMin = tout - tin;
      }
    }

    // 6. Status / Leave detection
    let status = '';
    if (/sick\s*leave/i.test(lower)) status = 'Sick Leave';
    else if (/casual\s*leave/i.test(lower)) status = 'Casual Leave';
    else if (/official\s*short\s*day|short\s*day/i.test(lower)) status = 'Official Short Day';
    else if (/weekend/i.test(lower)) status = 'Weekend';
    else if (/annual\s*leave/i.test(lower)) status = 'Annual Leave';
    else if (/unpaid\s*leave/i.test(lower)) status = 'Unpaid Leave';
    else if (/holiday|public\s*holiday/i.test(lower)) status = 'Public Holiday';
    else if (/karachi/i.test(lower)) status = 'Karachi Office';
    else if (/half\s*day/i.test(lower)) status = 'Half Day';
    else if (/wfh|work\s*from\s*home|remote/i.test(lower)) status = 'WFH';

    return {
      action: 'upsert',
      date: dateStr,
      day: dayName,
      timeIn: timeIn,
      timeOut: timeOut,
      workingHoursMin: workingHoursMin,
      totalTimeMin: workingHoursMin,
      status: status,
      minutesBalance: null
    };
  }

  function setupNlpQuickAdd() {
    const input = document.getElementById('nlpInput');
    const submitBtn = document.getElementById('nlpSubmitBtn');
    const previewRow = document.getElementById('nlpPreviewRow');
    const previewContent = document.getElementById('nlpPreviewContent');
    const feedbackMsg = document.getElementById('nlpFeedbackMsg');
    if (!input || !submitBtn || !previewRow || !previewContent) return;

    function setFeedback(msg, type = 'info') {
      if (!feedbackMsg) return;
      feedbackMsg.className = `nlp-feedback-msg ${type}`;
      feedbackMsg.innerHTML = msg;
      feedbackMsg.style.display = 'block';
    }

    function clearFeedback() {
      if (feedbackMsg) feedbackMsg.style.display = 'none';
    }

    function renderNlpLivePreview() {
      clearFeedback();
      const val = input.value.trim();
      if (!val) {
        previewRow.style.display = 'none';
        previewContent.innerHTML = '';
        return;
      }

      const res = parseNaturalLanguageInput(val);
      if (!res) {
        previewRow.style.display = 'flex';
        previewContent.innerHTML = `<span style="color:#94a3b8; font-size:0.8rem;">Type date & hours (e.g. <em>"30th Oct came 10:30 left 19:00 worked 8.5h"</em> or <em>"Nov 3 sick leave"</em>)</span>`;
        return;
      }

      previewRow.style.display = 'flex';
      if (res.action === 'delete') {
        previewContent.innerHTML = `
          <span class="badge-status leave" style="background:rgba(244,63,94,0.15); border:1px solid #f43f5e; color:#fb7185;">Action: Delete</span>
          <span style="font-family:monospace; color:#f8fafc; font-weight:600;">${res.date} (${res.day})</span>
        `;
        return;
      }

      // Upsert badges
      const targetMin = state.settings.targetMinutes || 480;
      let balStr = '';
      let balStyle = '';
      if (res.workingHoursMin !== null) {
        const bal = res.workingHoursMin - targetMin;
        const sign = bal >= 0 ? '+' : '';
        balStyle = bal >= 0 ? 'background:rgba(16,185,129,0.15); border:1px solid #10b981; color:#34d399;' : 'background:rgba(244,63,94,0.15); border:1px solid #f43f5e; color:#fb7185;';
        balStr = `<span class="badge-status" style="${balStyle}">Balance: ${sign}${bal.toFixed(0)}m (${sign}${(bal/60).toFixed(1)}h)</span>`;
      }

      const whStr = res.workingHoursMin !== null ? `<span class="badge-status" style="background:rgba(99,102,241,0.15); border:1px solid #6366f1; color:#a5b4fc;">Worked: ${(res.workingHoursMin / 60).toFixed(2)}h (${minutesToHourMinStr(res.workingHoursMin)})</span>` : '';
      const inOutStr = (res.timeIn !== '-' || res.timeOut !== '-') ? `<span class="badge-status" style="background:rgba(255,255,255,0.05); color:#94a3b8;">${res.timeIn} ➔ ${res.timeOut}</span>` : '';
      const statusBadge = res.status ? `<span class="badge-status leave" style="background:rgba(245,158,11,0.15); border:1px solid #f59e0b; color:#fbbf24;">${res.status}</span>` : '';

      previewContent.innerHTML = `
        <span style="font-family:monospace; color:#f8fafc; font-weight:700;">${res.date} (${res.day})</span>
        ${inOutStr}
        ${whStr}
        ${balStr}
        ${statusBadge}
      `;
    }

    input.addEventListener('input', renderNlpLivePreview);

    function applyNlpEntry() {
      const val = input.value.trim();
      if (!val) {
        setFeedback('⚠ Please write your attendance details first or click one of the examples below.', 'error');
        showToast('Please type attendance details or click an example');
        input.focus();
        input.classList.add('input-attention');
        setTimeout(() => input.classList.remove('input-attention'), 600);
        return;
      }

      const res = parseNaturalLanguageInput(val);
      if (!res) {
        setFeedback('⚠ Could not understand date or times. Format example: <em>"30th Oct came at 10:30 left at 19:00 worked 8.5 hours"</em>', 'error');
        showToast('Could not detect date. Check format.');
        input.focus();
        input.classList.add('input-attention');
        setTimeout(() => input.classList.remove('input-attention'), 600);
        return;
      }

      let summaryMsg = '';
      if (res.action === 'delete') {
        const prevCount = state.records.length;
        state.records = state.records.filter(r => r.date !== res.date);
        summaryMsg = state.records.length < prevCount ? `Deleted record for ${res.date}` : `No record existed for ${res.date}`;
        setFeedback(`✔ ${summaryMsg}`, 'success');
        showToast(summaryMsg);
      } else {
        const existingIdx = state.records.findIndex(r => r.date === res.date);
        const actionWord = existingIdx !== -1 ? 'Updated' : 'Added';
        const hoursWord = res.workingHoursMin ? (res.workingHoursMin / 60).toFixed(2) + 'h' : (res.status || 'saved');
        summaryMsg = `${actionWord} ${res.date} (${res.day}): ${hoursWord}`;

        if (existingIdx !== -1) {
          state.records[existingIdx] = res;
        } else {
          state.records.push(res);
        }

        // Auto select month so user sees it right away
        const mKey = getMonthKey(res.date);
        if (mKey) state.selectedPeriod = mKey;

        setFeedback(`✔ ${summaryMsg}! Dashboard and records table updated below.`, 'success');
        showToast(summaryMsg);
      }

      // Visual feedback on the button itself
      const origBtnHtml = submitBtn.innerHTML;
      submitBtn.innerHTML = `<span>✔ Saved!</span>`;
      submitBtn.style.background = '#10b981';
      submitBtn.style.borderColor = '#34d399';
      submitBtn.style.boxShadow = '0 0 14px rgba(16, 185, 129, 0.4)';
      setTimeout(() => {
        submitBtn.innerHTML = origBtnHtml;
        submitBtn.style.background = '';
        submitBtn.style.borderColor = '';
        submitBtn.style.boxShadow = '';
      }, 2200);

      state.records.sort((a, b) => a.date.localeCompare(b.date));
      input.value = '';
      previewRow.style.display = 'none';
      previewContent.innerHTML = '';
      updateDashboard();

      // Highlight the updated row in the table
      setTimeout(() => {
        const row = document.querySelector(`tr[data-date="${res.date}"]`);
        if (row) {
          row.classList.add('row-just-updated');
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => row.classList.remove('row-just-updated'), 3000);
        }
      }, 150);
    }

    // Expose globally so inline onclick always reaches it
    window.handleNlpSubmit = applyNlpEntry;

    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      applyNlpEntry();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyNlpEntry();
      }
    });

    // Chip suggestions
    document.querySelectorAll('.nlp-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        const text = chip.getAttribute('data-text');
        input.value = text;
        renderNlpLivePreview();
        setFeedback(`Loaded sample: "<em>${text}</em>". Click <strong>Update Dashboard</strong> or press <strong>Enter</strong> to apply.`, 'info');
        input.focus();
      });
    });
  }

  // --- Initialization ---

  function init() {
    loadFromLocalStorage();
    setupModals();
    setupExcelUpload();
    setupNlpQuickAdd();
    updateDashboard();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
