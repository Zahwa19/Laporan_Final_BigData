/**
 * PT. MAYSURA BERKAH SEJAHTERA - MAIN APPLICATION CONTROLLER
 * assets/js/app.js
 * 
 * Sistem Manajemen Analisis Broiler:
 * 1. Manajemen State Aplikasi & Autentikasi Portal Peternak
 * 2. Navigasi Sidebar 2 Menu Utama: Dashboard Utama & Catat Data 42 Hari
 * 3. Navigasi Tab Horizontal Grafik di Dashboard Utama (Bobot, Pakan, Mortalitas, Stok, Panen, Siklus)
 * 4. Filter Siklus/Periode Tunggal di Header
 * 5. Logbook Pencatatan 42 Hari dengan Auto-Save LocalStorage
 * 6. Pembaruan Dinamis 5 Kartu KPI Utama & Seluruh 25 Grafik Analisis
 */

(function (window) {
  'use strict';

  // State Utama Aplikasi
  const appState = {
    isLoggedIn: false,
    userRole: "Peternak Mitra (Armi A.)",
    activePeriodId: "p4", // Default: Periode 4 (Aktif Berjalan Harian)
    periods: (window.MBS_DATA && typeof window.MBS_DATA.loadPeriodsData === 'function') ? window.MBS_DATA.loadPeriodsData() : null,
    settings: (window.MBS_DATA && typeof window.MBS_DATA.loadSettings === 'function') ? window.MBS_DATA.loadSettings() : null,
    activeView: 'dashboard', // 'dashboard' atau 'input'
    activeChartTab: 'bobot', // 'bobot', 'pakan', 'kesehatan', 'stok', 'panen', 'siklus'
    darkMode: false
  };

  /**
   * =========================================================================
   * 1. AUTENTIKASI PORTAL LOGIN
   * =========================================================================
   */
  function handleLogin(e) {
    if (e) e.preventDefault();
    const roleName = "Peternak Mitra (Armi A.)";
    appState.isLoggedIn = true;
    appState.userRole = roleName;
    sessionStorage.setItem('broiler_logged_in', 'true');
    sessionStorage.setItem('broiler_user_role', roleName);
    showMainApp();
  }

  function bypassLogin() {
    appState.isLoggedIn = true;
    appState.userRole = "Peternak Mitra (Armi A.)";
    sessionStorage.setItem('broiler_logged_in', 'true');
    sessionStorage.setItem('broiler_user_role', "Peternak Mitra (Armi A.)");
    showMainApp();
  }

  function handleLogout() {
    sessionStorage.removeItem('broiler_logged_in');
    sessionStorage.removeItem('broiler_user_role');
    appState.isLoggedIn = false;
    const portal = document.getElementById('portalLoginView');
    const main = document.getElementById('mainAppLayout');
    if (portal) {
      portal.classList.remove('hidden');
      if (portal.style) portal.style.display = 'flex';
    }
    if (main) {
      main.classList.add('hidden');
      if (main.style) main.style.display = 'none';
    }
  }

  function showMainApp() {
    const portal = document.getElementById('portalLoginView');
    const main = document.getElementById('mainAppLayout');
    if (portal) {
      portal.classList.add('hidden');
      if (portal.style) portal.style.display = 'none';
    }
    if (main) {
      main.classList.remove('hidden');
      if (main.style) main.style.display = 'flex';
    }

    const nameEl = document.getElementById('sidebarUserName');
    if (nameEl) nameEl.textContent = appState.userRole.split('(')[0].trim();

    refreshAll();
    const initAction = () => {
      const multiStats = window.MBS_ANALYTICS.getMultiPeriodStats(appState.periods, appState.settings);
      window.MBS_CHARTS.initAllCharts(appState.darkMode, multiStats);
      refreshAll();
      if (typeof window.switchChartTab === 'function') {
        setTimeout(() => {
          window.switchChartTab(appState.activeChartTab);
        }, 60);
      }
    };
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(initAction);
    } else {
      setTimeout(initAction, 50);
    }
  }

  /**
   * =========================================================================
   * 2. INISIALISASI & PERSISTENSI DATA
   * =========================================================================
   */
  function initApp() {
    appState.periods = window.MBS_DATA.loadPeriodsData();
    appState.settings = window.MBS_DATA.loadSettings();

    // Setup Event Listeners
    setupEventListeners();

    // Check Login State
    if (sessionStorage.getItem('broiler_logged_in') === 'true') {
      appState.isLoggedIn = true;
      appState.userRole = sessionStorage.getItem('broiler_user_role') || "Peternak Mitra (Armi A.)";
      showMainApp();
    } else {
      const portal = document.getElementById('portalLoginView');
      const main = document.getElementById('mainAppLayout');
      if (portal) {
        portal.classList.remove('hidden');
        if (portal.style) portal.style.display = 'flex';
      }
      if (main) {
        main.classList.add('hidden');
        if (main.style) main.style.display = 'none';
      }
    }
  }

  function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }
  }

  /**
   * =========================================================================
   * 3. SINKRONISASI REFRESH ALL (DATA -> ANALYTICS -> UI & CHARTS)
   * =========================================================================
   */
  function refreshAll() {
    const activeP = appState.periods[appState.activePeriodId] || appState.periods.p4;
    const metrics = window.MBS_ANALYTICS.calculateDailyMetrics(activeP.days, appState.settings);
    const summary = window.MBS_ANALYTICS.calculateSummary(metrics, appState.settings, appState.activePeriodId, appState.periods);
    const multiStats = window.MBS_ANALYTICS.getMultiPeriodStats(appState.periods, appState.settings);

    updateHeaderAndTopBar(activeP, summary);
    updateKpiCards(summary);
    renderRecordingSheet(metrics);
    window.MBS_CHARTS.updateAllChartsData(metrics, summary, multiStats, appState.activePeriodId, appState.periods);
    window.MBS_CHARTS.updateInsights(metrics, summary, activeP, appState.periods);
  }

  /**
   * Perbarui Header Status secara dinamis (H-8, H-9, H-42)
   */
  function updateHeaderAndTopBar(activeP, summary) {
    const topName = document.getElementById('topbarPeriodName');
    const topDay = document.getElementById('topbarDayText');
    const topLive = document.getElementById('topbarLiveText');
    const topBadge = document.getElementById('topbarStatusBadge');
    const statusSentence = document.getElementById('bigStatusSentence');

    const dayText = 'Hari ke-' + summary.activeDay;
    const liveText = window.MBS_ANALYTICS.formatNumber(summary.activeMetric.liveBirds) + ' ekor';

    if (topName) topName.textContent = activeP.name.split('(')[0].trim();
    if (topDay) topDay.textContent = dayText;
    if (topLive) topLive.textContent = liveText;

    if (topBadge) {
      if (appState.activePeriodId === 'p4') {
        topBadge.textContent = 'SIKLUS AKTIF';
        topBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200';
      } else if (appState.activePeriodId === 'p1') {
        topBadge.textContent = 'SELESAI · PERFORMA SANGAT BAIK';
        topBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200';
      } else if (appState.activePeriodId === 'p2') {
        topBadge.textContent = 'SELESAI · PERFORMA STANDAR';
        topBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200';
      } else if (appState.activePeriodId === 'p3') {
        topBadge.textContent = 'SELESAI · TERDAMPAK CUACA PANAS';
        topBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200';
      } else {
        topBadge.textContent = 'KOMPARASI SEMUA SIKLUS';
        topBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300';
      }
    }

    if (statusSentence) {
      if (appState.activePeriodId === 'p4') {
        statusSentence.textContent = 'Kondisi kandang saat ini terpantau stabil pada Hari ke-8. Pakan aktual lebih hemat dari standar dan laju mortalitas sangat rendah.';
      } else if (appState.activePeriodId === 'p1') {
        statusSentence.textContent = 'Siklus Periode 1 telah selesai penuh 42 hari dengan hasil sangat memuaskan (Bobot 2.680g, FCR 1,68, Deplesi 2,5%).';
      } else if (appState.activePeriodId === 'p2') {
        statusSentence.textContent = 'Siklus Periode 2 selesai 42 hari dengan performa normal memenuhi standar kemitraan PT. MBS (Bobot 2.610g, FCR 1,78).';
      } else if (appState.activePeriodId === 'p3') {
        statusSentence.textContent = 'Siklus Periode 3 terdampak gelombang panas ekstrem di minggu ke-4 dan ke-5 (Suhu kandang 33-34°C, FCR membengkak 1,86).';
      } else {
        statusSentence.textContent = 'Menampilkan komparasi performa multi-siklus untuk mengevaluasi konsistensi hasil pemeliharaan broiler mitra.';
      }
    }
  }

  /**
   * Perbarui 5 Kartu KPI Utama
   */
  function updateKpiCards(summary) {
    const fn = window.MBS_ANALYTICS.formatNumber;

    // 1. Populasi Hidup
    const valAyam = document.getElementById('cardVal-ayam');
    const subAyam = document.getElementById('cardSub-ayam');
    if (valAyam) valAyam.innerHTML = fn(summary.activeMetric.liveBirds) + ' <span class="text-xs font-normal text-slate-500">ekor</span>';
    if (subAyam) subAyam.textContent = summary.activeMetric.cumMati + ' mati · ' + (100 - summary.activeMetric.deplesiPct).toFixed(1) + '% Livability';

    // 2. Bobot Sampling
    const valBerat = document.getElementById('cardVal-berat');
    const subBerat = document.getElementById('cardSub-berat');
    if (summary.latestSample && valBerat && subBerat) {
      valBerat.innerHTML = fn(summary.latestSample.bwAct) + ' <span class="text-xs font-normal text-slate-500">gram</span>';
      const diffG = summary.latestSample.bwAct - summary.latestSample.stdBw;
      const pct = ((summary.latestSample.bwAct / summary.latestSample.stdBw) * 100).toFixed(1);
      subBerat.textContent = 'Standar: ' + summary.latestSample.stdBw + ' g (' + (diffG >= 0 ? '+' : '') + diffG + ' g · ' + pct + '%)';
    }

    // 3. Efisiensi Pakan (FCR)
    const valFcr = document.getElementById('cardVal-fcr');
    const subFcr = document.getElementById('cardSub-fcr');
    if (summary.latestSample && summary.latestSample.fcrCalc !== null && valFcr && subFcr) {
      valFcr.innerHTML = fn(summary.latestSample.fcrCalc, 2) + '* <span class="text-xs font-normal text-slate-500">FCR</span>';
      const diff = summary.latestSample.diffFcr;
      subFcr.textContent = diff <= 0
        ? 'Standar: ' + summary.latestSample.stdFcr + ' (Hemat ' + Math.abs(diff).toFixed(2) + ' poin)'
        : 'Standar: ' + summary.latestSample.stdFcr + ' (Lebih ' + diff.toFixed(2) + ' poin)';
    }

    // 4. Stok Pakan Sisa
    const valStok = document.getElementById('cardVal-stok');
    const subStok = document.getElementById('cardSub-stok');
    if (valStok && subStok) {
      valStok.innerHTML = fn(summary.activeMetric.sisa, 1) + ' <span class="text-xs font-normal text-slate-500">sak</span>';
      const sisaKg = Math.round((summary.activeMetric.sisa || 0) * 50);
      subStok.textContent = sisaKg + ' kg · Cukup ~' + fn(summary.remainingStockDays, 1) + ' hari';
    }

    // 5. Cuaca & Heat Stress
    const valCuaca = document.getElementById('cardVal-cuaca');
    const subCuaca = document.getElementById('cardSub-cuaca');
    if (valCuaca && subCuaca) {
      valCuaca.innerHTML = summary.avgSuhu.toFixed(1) + '°C <span class="text-xs font-normal text-slate-500">/ ' + Math.round(summary.avgRh) + '% RH</span>';
      const thi = summary.thi;
      const statusText = thi < 80 ? 'Kondisi Normal' : (thi < 84 ? 'Waspada' : 'Siaga Heat Stress');
      subCuaca.textContent = `Marawola, Sigi · THI ${thi.toFixed(1)} (${statusText})`;
    }
  }

  /**
   * =========================================================================
   * 4. RENDER FORM "LOGBOOK 42 HARI" & AUTO-SAVE LOCALSTORAGE
   * =========================================================================
   */
  function renderRecordingSheet(metrics) {
    const container = document.getElementById('recordingSheetContainer');
    if (!container) return;

    let html = '';
    for (let block = 0; block < 6; block++) {
      const startIdx = block * 7;
      const endIdx = startIdx + 7;
      const blockDays = metrics.slice(startIdx, endIdx);
      const weekNum = block + 1;

      const blockTotalAct = blockDays.reduce((a, m) => a + (m.act || 0), 0);
      const blockTotalMati = blockDays.reduce((a, m) => a + (m.mati || 0), 0);

      html += '<div class="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden mb-5">';
      html += '<div class="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center text-xs">';
      html += '<span class="font-bold text-slate-800 uppercase tracking-wide">Minggu ke-' + weekNum + ' (Hari ' + (startIdx + 1) + ' – ' + endIdx + ')</span>';
      html += '<span class="text-slate-500 font-medium">Akumulasi Pakan: ' + blockTotalAct.toFixed(1) + ' sak · Total Kematian: ' + blockTotalMati + ' ekor</span>';
      html += '</div>';
      html += '<div class="overflow-x-auto">';
      html += '<table class="w-full text-xs text-left border-collapse">';
      html += '<thead><tr class="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">';
      html += '<th class="p-2.5 text-center w-12">Hari</th>';
      html += '<th class="p-2.5">TRM (Sak)</th>';
      html += '<th class="p-2.5">ACT (Sak)</th>';
      html += '<th class="p-2.5">SISA Stok</th>';
      html += '<th class="p-2.5">Mati (Ekor)</th>';
      html += '<th class="p-2.5">Ayam Hidup</th>';
      html += '<th class="p-2.5">BW (g)</th>';
      html += '<th class="p-2.5 text-center">Suhu (°C)</th>';
      html += '<th class="p-2.5 text-center">RH (%)</th>';
      html += '<th class="p-2.5">Program OVK</th>';
      html += '<th class="p-2.5">Catatan PPL</th>';
      html += '</tr></thead>';
      html += '<tbody class="divide-y divide-slate-100 font-mono text-[11px]">';

      blockDays.forEach((m, idx) => {
        const globalDayIdx = startIdx + idx;
        const isFilled = m.isRecorded;
        const rowClass = isFilled ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/30 text-slate-400';

        html += '<tr class="' + rowClass + '">';
        html += '<td class="p-2 font-bold text-center text-slate-700">' + m.day + '</td>';
        html += '<td class="p-1"><input type="number" step="0.5" class="recording-cell-input w-14 px-1.5 py-1 border border-slate-200 rounded bg-white text-slate-800 outline-none" value="' + (m.trm || '') + '" placeholder="-" onchange="handleCellChange(' + globalDayIdx + ', &quot;trm&quot;, this.value)"></td>';
        html += '<td class="p-1"><input type="number" step="0.5" class="recording-cell-input w-14 px-1.5 py-1 border border-slate-200 rounded bg-white font-bold text-slate-800 outline-none" value="' + (m.act !== null ? m.act : '') + '" placeholder="-" onchange="handleCellChange(' + globalDayIdx + ', &quot;act&quot;, this.value)"></td>';
        html += '<td class="p-1"><input type="number" step="0.5" class="recording-cell-input w-14 px-1.5 py-1 border border-slate-200 rounded bg-white text-slate-800 outline-none" value="' + (m.sisa !== null ? m.sisa : '') + '" placeholder="-" onchange="handleCellChange(' + globalDayIdx + ', &quot;sisaOverride&quot;, this.value)"></td>';
        html += '<td class="p-1"><input type="number" class="recording-cell-input w-14 px-1.5 py-1 border border-slate-200 rounded bg-white text-rose-600 font-bold outline-none" value="' + (m.mati !== null ? m.mati : '') + '" placeholder="-" onchange="handleCellChange(' + globalDayIdx + ', &quot;mati&quot;, this.value)"></td>';
        html += '<td class="p-2 font-semibold text-slate-700">' + (m.isRecorded ? m.liveBirds : '-') + '</td>';
        html += '<td class="p-1"><input type="number" class="recording-cell-input w-16 px-1.5 py-1 border border-slate-200 rounded bg-emerald-50/60 text-emerald-800 font-bold outline-none" value="' + (m.bwAct || '') + '" placeholder="-" onchange="handleCellChange(' + globalDayIdx + ', &quot;bw&quot;, this.value)"></td>';
        html += '<td class="p-1 text-center"><input type="number" step="0.1" class="recording-cell-input w-14 px-1 py-1 border border-slate-200 rounded bg-slate-50 text-slate-800 font-medium outline-none text-center" value="' + (m.suhu_c || '') + '" onchange="handleCellChange(' + globalDayIdx + ', &quot;suhu_c&quot;, this.value)"></td>';
        html += '<td class="p-1 text-center"><input type="number" step="1" class="recording-cell-input w-12 px-1 py-1 border border-slate-200 rounded bg-slate-50 text-slate-800 outline-none text-center" value="' + (m.kelembapan || '') + '" onchange="handleCellChange(' + globalDayIdx + ', &quot;kelembapan&quot;, this.value)"></td>';
        html += '<td class="p-1"><input type="text" class="recording-cell-input w-28 px-1.5 py-1 border border-slate-200 rounded bg-white font-sans text-[10px] outline-none" value="' + (m.ovk || '') + '" placeholder="-" onchange="handleCellChange(' + globalDayIdx + ', &quot;ovk&quot;, this.value)"></td>';
        html += '<td class="p-1"><input type="text" class="recording-cell-input w-28 px-1.5 py-1 border border-slate-200 rounded bg-white font-sans text-[10px] outline-none" value="' + (m.notes || '') + '" placeholder="-" onchange="handleCellChange(' + globalDayIdx + ', &quot;notes&quot;, this.value)"></td>';
        html += '</tr>';
      });

      html += '</tbody></table></div></div>';
    }

    container.innerHTML = html;
  }

  /**
   * Tangani Perubahan Sel Catatan Harian -> Auto-Save LocalStorage & Auto-Update
   */
  window.handleCellChange = function (dayIdx, field, val) {
    if (!appState.periods) appState.periods = window.MBS_DATA.loadPeriodsData();
    if (!appState.settings) appState.settings = window.MBS_DATA.loadSettings();
    const activeP = appState.periods[appState.activePeriodId] || appState.periods.p4;
    if (!activeP.days || !activeP.days[dayIdx]) return;

    const cleanVal = (typeof val === 'string') ? val.trim() : val;
    if (cleanVal === '' || cleanVal === null || cleanVal === undefined) {
      activeP.days[dayIdx][field] = null;
    } else if (field === 'ovk' || field === 'notes') {
      activeP.days[dayIdx][field] = cleanVal;
    } else {
      activeP.days[dayIdx][field] = Number(cleanVal);
    }

    // Auto-Save ke LocalStorage
    window.MBS_DATA.savePeriodsData(appState.periods);

    // Refresh seluruh UI, status, grafik, dan prediksi panen
    refreshAll();
  };

  /**
   * =========================================================================
   * 5. NAVIGASI 2 MENU SIDEBAR (Dashboard Utama & Catat Data 42 Hari)
   * =========================================================================
   */
  window.switchView = function (viewName) {
    // Jika parameter yang dikirim adalah kategori tab, alihkan ke dashboard lalu aktifkan tab tersebut
    const categoryTabs = ['bobot', 'pakan', 'kesehatan', 'stok', 'panen', 'siklus'];
    if (categoryTabs.includes(viewName)) {
      appState.activeView = 'dashboard';
      toggleMainViews('dashboard');
      window.switchChartTab(viewName);
      return;
    }

    appState.activeView = viewName;
    toggleMainViews(viewName);

    // Update active highlight pada 2 tombol sidebar
    const btnDash = document.getElementById('nav-btn-dashboard');
    const btnInput = document.getElementById('nav-btn-input');

    if (viewName === 'dashboard') {
      if (btnDash) {
        btnDash.className = 'sidebar-nav-btn sidebar-item-active w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition text-xs font-bold';
      }
      if (btnInput) {
        btnInput.className = 'sidebar-nav-btn w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition text-xs font-semibold';
      }
    } else {
      if (btnDash) {
        btnDash.className = 'sidebar-nav-btn w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition text-xs font-semibold';
      }
      if (btnInput) {
        btnInput.className = 'sidebar-nav-btn sidebar-item-active w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition text-xs font-bold';
      }
    }

    window.scrollTo({ top: 0, behavior: 'instant' });

    if (viewName === 'dashboard' && window.MBS_CHARTS && typeof window.MBS_CHARTS.resizeAllCharts === 'function') {
      window.MBS_CHARTS.resizeAllCharts();
    }
  };

  function toggleMainViews(targetView) {
    const elDash = document.getElementById('view-dashboard');
    const elInput = document.getElementById('view-input');

    if (targetView === 'dashboard') {
      if (elDash) elDash.classList.remove('hidden');
      if (elInput) elInput.classList.add('hidden');
    } else {
      if (elDash) elDash.classList.add('hidden');
      if (elInput) elInput.classList.remove('hidden');
    }
  }

  /**
   * =========================================================================
   * 6. NAVIGASI TAB HORIZONTAL GRAFIK DI DALAM DASHBOARD UTAMA
   * =========================================================================
   * Ketika tab diklik, tombol berubah warna menjadi aktif (cokelat hangat #78350F)
   * dan konten langsung berganti menampilkan hanya grafik kategori tersebut (2 Kolom).
   */
  window.switchChartTab = function (tabKey) {
    appState.activeChartTab = tabKey;
    const tabs = ['bobot', 'pakan', 'kesehatan', 'stok', 'panen', 'siklus'];

    tabs.forEach(t => {
      const btn = document.getElementById('tab-btn-' + t);
      const panel = document.getElementById('tab-panel-' + t);

      if (btn) {
        if (t === tabKey) {
          btn.classList.add('active-tab');
        } else {
          btn.classList.remove('active-tab');
        }
      }

      if (panel) {
        if (t === tabKey) {
          panel.classList.remove('hidden');
          if (panel.style) panel.style.display = 'block';
        } else {
          panel.classList.add('hidden');
          if (panel.style) panel.style.display = 'none';
        }
      }
    });

    // Panggil resize pada Chart.js agar kanvas di tab yang baru aktif langsung menyesuaikan ukuran kontainer penuh
    if (window.MBS_CHARTS && typeof window.MBS_CHARTS.resizeAllCharts === 'function') {
      window.MBS_CHARTS.resizeAllCharts();
    }
  };

  /**
   * Kompatibilitas pintasan tombol
   */
  window.scrollToSection = function (secId) {
    const map = {
      'sec-bobot': 'bobot',
      'sec-pakan': 'pakan',
      'sec-kesehatan': 'kesehatan',
      'sec-stok': 'stok',
      'sec-panen': 'panen',
      'sec-siklus': 'siklus'
    };
    const target = map[secId] || 'bobot';
    window.switchView('dashboard');
    window.switchChartTab(target);
    const navBar = document.getElementById('chartCategoryTabsBar');
    if (navBar && typeof navBar.scrollIntoView === 'function') {
      navBar.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  /**
   * Pengubah Dropdown Siklus/Periode Tunggal di Header
   */
  window.handleGlobalFilterChange = function () {
    const sel = document.getElementById('globalFilterPeriode');
    if (!sel) return;
    appState.activePeriodId = sel.value;
    refreshAll();
  };

  window.onHarvestAgeSliderChange = function (val) {
    appState.settings.targetUmurPanen = Number(val);
    const txt = document.getElementById('sliderAgeText');
    if (txt) txt.textContent = val;
    refreshAll();
  };

  window.exportToCSV = function () {
    const activeP = appState.periods[appState.activePeriodId] || appState.periods.p4;
    const metrics = window.MBS_ANALYTICS.calculateDailyMetrics(activeP.days, appState.settings);
    let csv = "Hari,TRM_Sak,ACT_Sak,SISA_Sak,Mati_Ekor,Live_Ekor,Deplesi_Pct,BW_Act_Gram,Suhu_C,Kelembapan_RH,FCR_Calc,Diff_FCR,OVK,Catatan\n";
    metrics.forEach(m => {
      csv += m.day + ',' + (m.trm || '') + ',' + (m.act !== null ? m.act : '') + ',' + (m.sisa !== null ? m.sisa : '') + ',' + (m.mati !== null ? m.mati : '') + ',' + (m.isRecorded ? m.liveBirds : '') + ',' + m.deplesiPct.toFixed(2) + ',' + (m.bwAct || '') + ',' + m.suhu_c + ',' + m.kelembapan + ',' + (m.fcrCalc ? m.fcrCalc.toFixed(2) : '') + ',' + (m.diffFcr ? m.diffFcr.toFixed(2) : '') + ',"' + (m.ovk || '') + '","' + (m.notes || '') + '"\n';
    });
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `data_recording_mbs_${appState.activePeriodId}.csv`);
    dlAnchor.click();
  };

  window.handleLogin = handleLogin;
  window.bypassLogin = bypassLogin;
  window.handleLogout = handleLogout;

  // Jalankan inisialisasi saat DOM siap
  window.addEventListener('DOMContentLoaded', initApp);

})(window);
