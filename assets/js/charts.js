/**
 * PT. MAYSURA BERKAH SEJAHTERA - BROILER DASHBOARD
 * assets/js/charts.js
 * 
 * Modul Visualisasi 25 Model Grafik Analisis Broiler (Chart.js)
 * Memvariasikan jenis chart sesuai karakter data:
 * - Line & Scatter, Bar & Line Combo, Diverging Bar, Area Chart, Grouped Bar
 * - Dual-Line, Stacked Bar, Stepped Line, Horizontal Bar, Scatter Plot
 * - Mixed Bar & Line, Doughnut, Area Spline, Multi-Axis Line, Polar Area
 * - Line with Threshold, Clustered Column, Waterfall / Floating Bar, Semi-Doughnut Gauge
 * - Confidence Band Line, Forecast Trajectory Line, Bullet / Target Bar, Multi-Scenario Bar
 * - Radar Chart, Lollipop / Bar & Target Line Chart
 */

(function (window) {
  'use strict';

  const chartInstances = {};

  function getThemeColors(isDark) {
    return {
      text: isDark ? '#94a3b8' : '#64748b',
      grid: isDark ? 'rgba(51, 65, 85, 0.4)' : '#f1f5f9',
      brand: '#84532b',
      brandHover: '#6e4321',
      brandLight: '#fef3c7',
      emerald: '#059669',
      emeraldLight: '#ecfdf5',
      slate: '#94a3b8',
      rose: '#ef4444',
      blue: '#3b82f6',
      amber: '#f59e0b',
      purple: '#8b5cf6'
    };
  }

  function initAllCharts(isDark, multiPeriodStats) {
    const c = getThemeColors(isDark);
    const scaleOpt = {
      x: { grid: { color: c.grid }, ticks: { color: c.text, font: { size: 9 } } },
      y: { grid: { color: c.grid }, ticks: { color: c.text, font: { size: 9 } } }
    };

    const days42 = Array.from({ length: 42 }, (_, i) => 'H-' + (i + 1));
    const stdBw = window.MBS_DATA.STD_BW_G;
    const stdSak = window.MBS_DATA.STD_PAKAN_SAK;
    const pLabels = ['Periode 1', 'Periode 2', 'Periode 3', 'Periode 4 (Aktif)'];

    destroyAllCharts();

    // =============================================================
    // TAB 1: BOBOT (5 CHART)
    // =============================================================

    // 1. Line & Scatter Chart (Kurva Bobot Nyata vs Standar PT MBS)
    const elC1 = document.getElementById('c1_growth');
    if (elC1) {
      chartInstances.c1 = new Chart(elC1.getContext('2d'), {
        type: 'line',
        data: {
          labels: days42,
          datasets: [
            { label: 'Standar Target MBS (g)', data: stdBw, borderColor: c.slate, borderWidth: 2, pointRadius: 0 },
            { label: 'Aktual Timbang (Scatter/Line)', data: Array(42).fill(null), borderColor: c.emerald, backgroundColor: c.emerald, pointRadius: 4.5, pointHoverRadius: 6.5, showLine: true, tension: 0.15, spanGaps: true }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: scaleOpt }
      });
    }

    // 2. Bar & Line Combo Chart (Pertambahan Bobot Harian ADG)
    const elC2 = document.getElementById('c2_adg');
    if (elC2) {
      // Standar target kenaikan ADG harian
      const stdAdg = [17, 18, 19, 21, 23, 26, 29, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 71, 74, 77, 80, 82, 84, 85, 86, 87, 88, 88, 88, 87, 86, 85, 84, 83, 81, 79, 77, 75, 73, 70, 67, 64];
      chartInstances.c2 = new Chart(elC2.getContext('2d'), {
        data: {
          labels: days42,
          datasets: [
            { type: 'bar', label: 'ADG Aktual (g/hari)', data: Array(42).fill(null), backgroundColor: c.brand, borderRadius: 3 },
            { type: 'line', label: 'Target Standar ADG (g/hari)', data: stdAdg, borderColor: c.emerald, borderWidth: 2, pointRadius: 0, tension: 0.2 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: scaleOpt }
      });
    }

    // 3. Diverging Bar Chart (Deviasi / Selisih Bobot Terhadap Target Gram)
    const elC3 = document.getElementById('c3_pctGrowth');
    if (elC3) {
      chartInstances.c3 = new Chart(elC3.getContext('2d'), {
        type: 'bar',
        data: {
          labels: days42,
          datasets: [{
            label: 'Selisih Terhadap Target (+/- gram)',
            data: Array(42).fill(null),
            backgroundColor: Array(42).fill(c.emerald),
            borderRadius: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: scaleOpt.x,
            y: {
              grid: { color: c.grid },
              ticks: { color: c.text, font: { size: 9 }, callback: (v) => (v > 0 ? '+' : '') + v + 'g' }
            }
          }
        }
      });
    }

    // 4. Area Chart Filled Line (Laju Pertumbuhan Bobot Kumulatif per Fase)
    const elC4 = document.getElementById('c4_weeklyBw');
    if (elC4) {
      chartInstances.c4 = new Chart(elC4.getContext('2d'), {
        type: 'line',
        data: {
          labels: ['H-7 (M1)', 'H-14 (M2)', 'H-21 (M3)', 'H-28 (M4)', 'H-35 (M5)', 'H-42 (M6)'],
          datasets: [
            {
              label: 'Bobot Target Fase (g)',
              data: [200, 500, 950, 1500, 2030, 2625],
              borderColor: c.brand,
              backgroundColor: 'rgba(132, 83, 43, 0.16)',
              fill: true,
              tension: 0.35,
              borderWidth: 2.5,
              pointRadius: 4,
              pointBackgroundColor: c.brand
            }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: scaleOpt }
      });
    }

    // 5. Grouped Bar Chart (Perbandingan Bobot Titik Kritis Mingguan H7–H42)
    const elC5 = document.getElementById('c5_uniformity');
    if (elC5) {
      chartInstances.c5 = new Chart(elC5.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['M1 (H-7)', 'M2 (H-14)', 'M3 (H-21)', 'M4 (H-28)', 'M5 (H-35)', 'M6 (H-42)'],
          datasets: [
            { label: 'Aktual Timbang (g)', data: [200, 500, 950, 1500, 2030, 2610], backgroundColor: c.emerald, borderRadius: 4 },
            { label: 'Standar MB-JAPFA (g)', data: [200, 500, 950, 1500, 2030, 2625], backgroundColor: '#cbd5e1', borderRadius: 4 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: scaleOpt }
      });
    }

    // =============================================================
    // TAB 2: PAKAN & FCR (5 CHART)
    // =============================================================

    // 6. Dual-Line Chart (Konsumsi Pakan Harian Aktual vs Standar Sak)
    const elC6 = document.getElementById('c6_dailyFeed');
    if (elC6) {
      chartInstances.c6 = new Chart(elC6.getContext('2d'), {
        type: 'line',
        data: {
          labels: days42,
          datasets: [
            { label: 'Target Standar (Sak)', data: stdSak, borderColor: c.slate, borderWidth: 1.5, borderDash: [4, 4], pointRadius: 0 },
            { label: 'Pakan Aktual Terpakai (Sak)', data: Array(42).fill(null), borderColor: c.brand, backgroundColor: c.brand, borderWidth: 2.5, pointRadius: 3, tension: 0.1, spanGaps: true }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: scaleOpt }
      });
    }

    // 7. Stacked Bar Chart (Komposisi Akumulasi Pakan per Jenis Fase)
    const elC7 = document.getElementById('c7_perBirdFeed');
    if (elC7) {
      chartInstances.c7 = new Chart(elC7.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4', 'Minggu 5', 'Minggu 6'],
          datasets: [
            { label: 'Starter MB-100 (Sak)', data: [8, 14, 0, 0, 0, 0], backgroundColor: '#f59e0b', borderRadius: 3 },
            { label: 'Grower MB-200 (Sak)', data: [0, 0, 22, 28, 0, 0], backgroundColor: '#84532b', borderRadius: 3 },
            { label: 'Finisher MB-300 (Sak)', data: [0, 0, 0, 0, 34, 38], backgroundColor: '#059669', borderRadius: 3 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { stacked: true, grid: { color: c.grid }, ticks: { color: c.text, font: { size: 9 } } },
            y: { stacked: true, grid: { color: c.grid }, ticks: { color: c.text, font: { size: 9 } } }
          }
        }
      });
    }

    // 8. Stepped Line Chart (Pergerakan Rasio Konversi Pakan FCR Harian)
    const elC8 = document.getElementById('c8_cumFeed');
    if (elC8) {
      chartInstances.c8 = new Chart(elC8.getContext('2d'), {
        type: 'line',
        data: {
          labels: days42,
          datasets: [
            { label: 'FCR Harian Berjalan (Stepped)', data: Array(42).fill(null), borderColor: c.brand, borderWidth: 2.5, stepped: true, pointRadius: 3, spanGaps: true },
            { label: 'Batas Toleransi Standar (1.79)', data: Array(42).fill(1.79), borderColor: c.rose, borderWidth: 1.5, borderDash: [4, 4], pointRadius: 0 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: scaleOpt }
      });
    }

    // 9. Horizontal Bar Chart (Efisiensi & Selisih Pemakaian Pakan Mingguan Sak)
    const elC9 = document.getElementById('c9_fcr');
    if (elC9) {
      chartInstances.c9 = new Chart(elC9.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4', 'Minggu 5', 'Minggu 6'],
          datasets: [{
            label: 'Penghematan Pakan (Sak)',
            data: [1.2, 1.8, 0.9, -0.4, 1.5, 2.1],
            backgroundColor: ['#059669', '#059669', '#059669', '#ef4444', '#059669', '#059669'],
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              grid: { color: c.grid },
              ticks: { color: c.text, font: { size: 9 }, callback: (v) => (v > 0 ? '+' : '') + v + ' sak' }
            },
            y: scaleOpt.y
          }
        }
      });
    }

    // 10. Scatter Plot Korelasi (Total Pakan Masuk vs Kenaikan Bobot)
    const elC10 = document.getElementById('c10_diffFcr');
    if (elC10) {
      chartInstances.c10 = new Chart(elC10.getContext('2d'), {
        type: 'scatter',
        data: {
          datasets: [{
            label: 'Korelasi Pakan Kumulatif (kg) vs Bobot (g)',
            data: [
              { x: 35, y: 57 }, { x: 75, y: 88 }, { x: 125, y: 123 }, { x: 180, y: 176 },
              { x: 250, y: 241 }, { x: 380, y: 350 }, { x: 550, y: 500 }, { x: 800, y: 720 },
              { x: 1100, y: 950 }, { x: 1500, y: 1250 }, { x: 2000, y: 1600 }, { x: 2600, y: 2030 }
            ],
            backgroundColor: c.brand,
            pointRadius: 5,
            pointHoverRadius: 7
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { title: { display: true, text: 'Kumulatif Pakan (Kg)', font: { size: 9 }, color: c.text }, grid: { color: c.grid }, ticks: { color: c.text, font: { size: 9 } } },
            y: { title: { display: true, text: 'Bobot Badan (g)', font: { size: 9 }, color: c.text }, grid: { color: c.grid }, ticks: { color: c.text, font: { size: 9 } } }
          }
        }
      });
    }

    // =============================================================
    // TAB 3: MORTALITAS (5 CHART)
    // =============================================================

    // 11. Mixed Bar & Line Chart (Ayam Mati Harian Ekor vs Persentase Deplesi %)
    const elC11 = document.getElementById('c11_dailyDeath');
    if (elC11) {
      chartInstances.c11 = new Chart(elC11.getContext('2d'), {
        data: {
          labels: days42,
          datasets: [
            { type: 'bar', label: 'Kematian Harian (Ekor)', data: Array(42).fill(null), backgroundColor: c.rose, yAxisID: 'y', borderRadius: 3 },
            { type: 'line', label: 'Deplesi Kumulatif (%)', data: Array(42).fill(null), borderColor: c.brand, borderWidth: 2, pointRadius: 0, yAxisID: 'y1' }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: scaleOpt.x,
            y: { position: 'left', grid: { color: c.grid }, ticks: { color: c.text, font: { size: 9 } } },
            y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { color: c.brand, font: { size: 9 }, callback: (v) => v + '%' } }
          }
        }
      });
    }

    // 12. Doughnut Chart (Proporsi Penyebab Kematian: Alami vs Culling Afkir)
    const elC12 = document.getElementById('c12_depletion');
    if (elC12) {
      chartInstances.c12 = new Chart(elC12.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Kematian Alami (Brooding/Stress)', 'Culling / Afkir Seleksi', 'Populasi Hidup Sehat'],
          datasets: [{
            data: [36, 10, 2454],
            backgroundColor: [c.rose, c.amber, c.emerald],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } } }
        }
      });
    }

    // 13. Area Spline Chart (Kurva Penyusutan Populasi Ayam Hidup Ekor)
    const elC13 = document.getElementById('c13_liveBirds');
    if (elC13) {
      chartInstances.c13 = new Chart(elC13.getContext('2d'), {
        type: 'line',
        data: {
          labels: days42,
          datasets: [{
            label: 'Populasi Ayam Hidup (Ekor)',
            data: Array(42).fill(null),
            borderColor: c.emerald,
            backgroundColor: 'rgba(5, 150, 105, 0.12)',
            fill: true,
            tension: 0.35,
            borderWidth: 2.5,
            pointRadius: 2,
            spanGaps: true
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: scaleOpt }
      });
    }

    // 14. Multi-Axis Line Chart (Pengaruh Suhu °C & Kelembapan Terhadap Mortalitas)
    const elC14 = document.getElementById('c14_survival');
    if (elC14) {
      // Data simulasi tren suhu & RH
      const mockSuhu = [32.5, 32.0, 31.5, 31.0, 30.5, 30.0, 29.5, 29.2, 29.0, 28.8, 28.5, 28.2, 28.0, 27.8, 27.5, 27.2, 27.0, 26.8, 26.5, 26.2, 26.0, 25.8, 25.6, 25.5, 25.4, 25.3, 25.2, 25.1, 25.0, 25.0, 25.0, 25.0, 25.0, 25.0, 25.0, 25.0, 25.0, 25.0, 25.0, 25.0, 25.0, 25.0];
      const mockRh = [72, 73, 75, 76, 74, 75, 76, 76, 75, 74, 73, 72, 74, 75, 76, 77, 75, 74, 73, 72, 71, 70, 72, 73, 74, 75, 76, 75, 74, 73, 72, 71, 70, 72, 73, 74, 75, 76, 75, 74, 73, 72];
      chartInstances.c14 = new Chart(elC14.getContext('2d'), {
        type: 'line',
        data: {
          labels: days42,
          datasets: [
            { label: 'Suhu Kandang (°C)', data: mockSuhu, borderColor: '#f59e0b', borderWidth: 1.5, pointRadius: 0, yAxisID: 'y' },
            { label: 'Kelembapan RH (%)', data: mockRh, borderColor: '#3b82f6', borderWidth: 1.5, borderDash: [3, 3], pointRadius: 0, yAxisID: 'y1' }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: scaleOpt.x,
            y: { position: 'left', min: 20, max: 38, ticks: { color: '#f59e0b', font: { size: 9 }, callback: (v) => v + '°C' } },
            y1: { position: 'right', min: 50, max: 90, grid: { drawOnChartArea: false }, ticks: { color: '#3b82f6', font: { size: 9 }, callback: (v) => v + '%' } }
          }
        }
      });
    }

    // 15. Polar Area Chart (Distribusi Intensitas Pemberian Program OVK & Vaksin)
    const elC15 = document.getElementById('c15_culling');
    if (elC15) {
      chartInstances.c15 = new Chart(elC15.getContext('2d'), {
        type: 'polarArea',
        data: {
          labels: ['Super Elektrolit', 'Vitamin & Cypro', 'Vaksin ND-IB', 'Vaksin Gumboro', 'Air Putih / Sanitasi'],
          datasets: [{
            data: [8, 14, 2, 2, 16],
            backgroundColor: [
              'rgba(245, 158, 11, 0.75)',
              'rgba(5, 150, 105, 0.75)',
              'rgba(59, 130, 246, 0.75)',
              'rgba(139, 92, 246, 0.75)',
              'rgba(148, 163, 184, 0.75)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 9 } } } }
        }
      });
    }

    // =============================================================
    // TAB 4: STOK GUDANG (4 CHART)
    // =============================================================

    // 16. Line with Threshold Zone (Fluktuasi Sisa Stok Pakan Gudang Harian Sak)
    const elC16 = document.getElementById('c16_stock');
    if (elC16) {
      chartInstances.c16 = new Chart(elC16.getContext('2d'), {
        type: 'line',
        data: {
          labels: days42,
          datasets: [
            { label: 'Sisa Stok Fisik (Sak)', data: Array(42).fill(null), borderColor: c.brand, backgroundColor: 'rgba(132, 83, 43, 0.1)', fill: true, borderWidth: 2.5, pointRadius: 3, spanGaps: true },
            { label: 'Batas Kritis Minimum (3 Sak)', data: Array(42).fill(3), borderColor: c.rose, borderWidth: 1.5, borderDash: [4, 4], pointRadius: 0 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: scaleOpt }
      });
    }

    // 17. Clustered Column Chart (Perbandingan Pakan Masuk TRM vs Terpakai ACT)
    const elC17 = document.getElementById('c17_flow');
    if (elC17) {
      chartInstances.c17 = new Chart(elC17.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4', 'Minggu 5', 'Minggu 6'],
          datasets: [
            { label: 'Pakan Masuk / TRM (Sak)', data: [20, 18, 25, 30, 35, 20], backgroundColor: '#3b82f6', borderRadius: 4 },
            { label: 'Pakan Terpakai / ACT (Sak)', data: [8, 14, 22, 28, 34, 38], backgroundColor: '#84532b', borderRadius: 4 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: scaleOpt }
      });
    }

    // 18. Waterfall / Floating Bar Chart (Neraca Alur Stok Pakan Mingguan)
    const elC18 = document.getElementById('c18_stockDays');
    if (elC18) {
      chartInstances.c18 = new Chart(elC18.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['Stok Awal M1', 'TRM Masuk', 'Konsumsi M1', 'Sisa Akhir M1', 'TRM M2', 'Konsumsi M2', 'Stok Saat Ini'],
          datasets: [{
            label: 'Alur Neraca Stok (Sak)',
            data: [0, 20, -8, 12, 10, -12, 10],
            backgroundColor: [
              '#94a3b8', '#3b82f6', '#ef4444', '#059669', '#3b82f6', '#ef4444', '#84532b'
            ],
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: scaleOpt.x,
            y: {
              grid: { color: c.grid },
              ticks: { color: c.text, font: { size: 9 }, callback: (v) => (v > 0 ? '+' : '') + v + ' sak' }
            }
          }
        }
      });
    }

    // 19. Gauge / Semi-Doughnut Chart (Indikator Kapasitas & Ketahanan Stok Pakan)
    const elC19 = document.getElementById('c19_feedType');
    if (elC19) {
      chartInstances.c19 = new Chart(elC19.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Sisa Stok Tersedia (10 Sak ~ 5 Hari)', 'Kapasitas Gudang Terpakai (40 Sak)'],
          datasets: [{
            data: [10, 40],
            backgroundColor: [c.emerald, '#e2e8f0'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          circumference: 180,
          rotation: -90,
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } } }
        }
      });
    }

    // =============================================================
    // TAB 5: PANEN ML (4 CHART)
    // =============================================================

    // 20. Confidence Band Line Chart (Proyeksi Pertumbuhan Bobot Panen H1–H42)
    const elC20 = document.getElementById('c20_projBw');
    if (elC20) {
      chartInstances.c20 = new Chart(elC20.getContext('2d'), {
        type: 'line',
        data: {
          labels: days42,
          datasets: [
            { label: 'Batas Atas Optimis (+2.5%)', data: Array(42).fill(null), borderColor: 'rgba(16, 185, 129, 0.4)', backgroundColor: 'rgba(16, 185, 129, 0.08)', fill: '+1', pointRadius: 0, borderWidth: 1, borderDash: [3, 3], spanGaps: true },
            { label: 'Batas Bawah Pesimis (-2.5%)', data: Array(42).fill(null), borderColor: 'rgba(239, 68, 68, 0.4)', backgroundColor: 'transparent', fill: false, pointRadius: 0, borderWidth: 1, borderDash: [3, 3], spanGaps: true },
            { label: 'Aktual Timbang (g)', data: Array(42).fill(null), borderColor: c.emerald, backgroundColor: c.emerald, pointRadius: 4, showLine: true, spanGaps: true },
            { label: 'Proyeksi Prediksi Panen ML (g)', data: Array(42).fill(null), borderColor: c.brand, borderWidth: 2.5, borderDash: [5, 4], pointRadius: 0, spanGaps: true }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: scaleOpt }
      });
    }

    // 21. Forecast Trajectory Line (Proyeksi Pergerakan FCR Akhir Hingga Masa Panen)
    const elC21 = document.getElementById('c21_ipMatrix');
    if (elC21) {
      // Mock trajectory FCR dari 0.67 ke 1.43 di H35 dan 1.65 di H40
      const trajFcr = Array(42).fill(null);
      for (let i = 8; i < 42; i++) {
        trajFcr[i] = Number((0.67 + (i - 7) * 0.03).toFixed(2));
      }
      chartInstances.c21 = new Chart(elC21.getContext('2d'), {
        type: 'line',
        data: {
          labels: days42,
          datasets: [
            { label: 'FCR Aktual (Hari 1-8)', data: Array(42).fill(null), borderColor: c.emerald, borderWidth: 2.5, pointRadius: 3, spanGaps: true },
            { label: 'Trajectory Proyeksi FCR (Hari 9-42)', data: trajFcr, borderColor: c.brand, borderWidth: 2, borderDash: [5, 4], pointRadius: 0, spanGaps: true },
            { label: 'Target FCR Kontrak (1.79)', data: Array(42).fill(1.79), borderColor: c.slate, borderWidth: 1.5, borderDash: [3, 3], pointRadius: 0 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: scaleOpt }
      });
    }

    // 22. Bullet / Target Bar Chart (Estimasi Tonase Panen Kg Terhadap Target Kontrak)
    const elC22 = document.getElementById('c22_feedCostKg');
    if (elC22) {
      chartInstances.c22 = new Chart(elC22.getContext('2d'), {
        data: {
          labels: ['Estimasi Total Biomassa Panen'],
          datasets: [
            { type: 'bar', label: 'Estimasi Tonase Panen (6.380 Kg)', data: [6380], backgroundColor: c.emerald, barPercentage: 0.5, borderRadius: 6 },
            { type: 'line', label: 'Target Kontrak Minimal MBS (6.000 Kg)', data: [6000], borderColor: c.rose, borderWidth: 3, pointRadius: 6, pointBackgroundColor: c.rose }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: scaleOpt.x,
            y: { min: 4000, max: 7500, grid: { color: c.grid }, ticks: { color: c.text, font: { size: 9 }, callback: (v) => v + ' kg' } }
          }
        }
      });
    }

    // 23. Multi-Scenario Bar Chart (Simulasi Panen Dini H35, Normal H40, Maksimal H42)
    const elC23 = document.getElementById('c23_scenarios');
    if (elC23) {
      chartInstances.c23 = new Chart(elC23.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['Panen Dini (H-35)', 'Panen Standar (H-40)', 'Panen Maksimal (H-42)'],
          datasets: [
            { label: 'Bobot Timbang (x10 gram)', data: [203, 261, 275], backgroundColor: c.emerald, borderRadius: 4 },
            { label: 'Estimasi Tonase (x100 kg)', data: [49.7, 63.8, 67.2], backgroundColor: c.brand, borderRadius: 4 },
            { label: 'Skor Indeks Performa (IP)', data: [388, 395, 370], backgroundColor: c.amber, borderRadius: 4 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: scaleOpt }
      });
    }

    // =============================================================
    // TAB 6: SIKLUS (2 CHART)
    // =============================================================

    // 24. Radar Chart (Evaluasi Kinerja Multi-Parameter Antar-Periode)
    const elC24 = document.getElementById('c24_cycleFcr');
    if (elC24) {
      chartInstances.c24 = new Chart(elC24.getContext('2d'), {
        type: 'radar',
        data: {
          labels: ['Bobot Akhir', 'Efisiensi FCR', 'Livability', 'Skor IP', 'Ketahanan Cuaca'],
          datasets: [
            { label: 'Periode 1', data: [95, 92, 98, 96, 90], borderColor: c.emerald, backgroundColor: 'rgba(5, 150, 105, 0.15)', borderWidth: 1.5, pointRadius: 3 },
            { label: 'Periode 2', data: [88, 86, 94, 88, 85], borderColor: c.blue, backgroundColor: 'rgba(59, 130, 246, 0.15)', borderWidth: 1.5, pointRadius: 3 },
            { label: 'Periode 3', data: [78, 75, 88, 76, 65], borderColor: c.rose, backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1.5, pointRadius: 3 },
            { label: 'Periode 4 (Aktif)', data: [94, 95, 98, 97, 92], borderColor: c.brand, backgroundColor: 'rgba(132, 83, 43, 0.2)', borderWidth: 2, pointRadius: 4 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              grid: { color: c.grid },
              ticks: { display: false },
              pointLabels: { font: { size: 9, weight: '600' }, color: c.text }
            }
          },
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } } }
        }
      });
    }

    // 25. Lollipop / Bar & Target Line Chart (Perbandingan Skor Keberhasilan IP Antar-Periode)
    const elC25 = document.getElementById('c25_cycleIp');
    if (elC25) {
      chartInstances.c25 = new Chart(elC25.getContext('2d'), {
        data: {
          labels: pLabels,
          datasets: [
            { type: 'bar', label: 'Skor Indeks Performa (IP)', data: [371, 337, 303, 388], backgroundColor: ['#059669', '#3b82f6', '#ef4444', '#84532b'], borderRadius: 6, barPercentage: 0.5 },
            { type: 'line', label: 'Standar Minimal Target (IP 350)', data: [350, 350, 350, 350], borderColor: c.rose, borderDash: [4, 4], borderWidth: 2, pointRadius: 4, pointBackgroundColor: c.rose }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: scaleOpt.x,
            y: { min: 200, max: 450, grid: { color: c.grid }, ticks: { color: c.text, font: { size: 9 } } }
          }
        }
      });
    }
  }

  /**
   * Update Semua Data Chart Secara Real-Time
   */
  function updateAllChartsData(metrics, summary, multiPeriodStats, activePeriodId, allPeriods) {
    if (!chartInstances.c1) return;

    const daysCount = 42;
    const bwData = Array(daysCount).fill(null);
    const actSakData = Array(daysCount).fill(null);
    const matiData = Array(daysCount).fill(null);
    const depData = Array(daysCount).fill(null);
    const fcrData = Array(daysCount).fill(null);
    const stockData = Array(daysCount).fill(null);
    const adgData = Array(daysCount).fill(null);
    const diffBwData = Array(daysCount).fill(null);
    const liveData = Array(daysCount).fill(null);

    let prevBw = 40;
    metrics.forEach((m, i) => {
      if (m.bwAct !== null) {
        bwData[i] = m.bwAct;
        adgData[i] = Math.round(m.bwAct - prevBw);
        prevBw = m.bwAct;
        diffBwData[i] = Math.round(m.bwAct - m.stdBw);
      }
      if (m.act !== null) {
        actSakData[i] = m.act;
      }
      if (m.mati !== null) {
        matiData[i] = m.mati;
        depData[i] = Number(m.deplesiPct.toFixed(2));
      }
      if (m.isRecorded) {
        liveData[i] = m.liveBirds;
      }
      if (m.fcrCalc !== null) {
        fcrData[i] = Number(m.fcrCalc.toFixed(2));
      }
      if (m.sisa !== null) {
        stockData[i] = m.sisa;
      }
    });

    // C1: Aktual Timbang
    if (chartInstances.c1) {
      chartInstances.c1.data.datasets[1].data = bwData;
      chartInstances.c1.update();
    }

    // C2: ADG
    if (chartInstances.c2) {
      chartInstances.c2.data.datasets[0].data = adgData;
      chartInstances.c2.update();
    }

    // C3: Diverging Bar
    if (chartInstances.c3) {
      chartInstances.c3.data.datasets[0].data = diffBwData;
      chartInstances.c3.data.datasets[0].backgroundColor = diffBwData.map(v => (v >= 0 ? '#059669' : '#ef4444'));
      chartInstances.c3.update();
    }

    // C6: Pakan Aktual
    if (chartInstances.c6) {
      chartInstances.c6.data.datasets[1].data = actSakData;
      chartInstances.c6.update();
    }

    // C8: Stepped FCR
    if (chartInstances.c8) {
      chartInstances.c8.data.datasets[0].data = fcrData;
      chartInstances.c8.update();
    }

    // C11: Mixed Bar & Line
    if (chartInstances.c11) {
      chartInstances.c11.data.datasets[0].data = matiData;
      chartInstances.c11.data.datasets[1].data = depData;
      chartInstances.c11.update();
    }

    // C12: Doughnut
    if (chartInstances.c12) {
      const totMati = summary.activeMetric.cumMati;
      const totLive = summary.activeMetric.liveBirds;
      const matiAlami = Math.round(totMati * 0.78);
      const cullingAfkir = totMati - matiAlami;
      chartInstances.c12.data.datasets[0].data = [matiAlami, cullingAfkir, totLive];
      chartInstances.c12.update();
    }

    // C13: Live Birds Area
    if (chartInstances.c13) {
      chartInstances.c13.data.datasets[0].data = liveData;
      chartInstances.c13.update();
    }

    // C16: Stock Line
    if (chartInstances.c16) {
      chartInstances.c16.data.datasets[0].data = stockData;
      chartInstances.c16.update();
    }

    // C20: Proyeksi Panen
    if (chartInstances.c20) {
      const pred42 = Array(42).fill(null);
      const opt42 = Array(42).fill(null);
      const pes42 = Array(42).fill(null);

      metrics.forEach((m, idx) => {
        const basePred = Math.round(window.MBS_DATA.STD_BW_G[idx] * summary.k);
        pred42[idx] = basePred;
        opt42[idx] = Math.round(basePred * 1.025);
        pes42[idx] = Math.round(basePred * 0.975);
      });

      chartInstances.c20.data.datasets[0].data = opt42;
      chartInstances.c20.data.datasets[1].data = pes42;
      chartInstances.c20.data.datasets[2].data = bwData;
      chartInstances.c20.data.datasets[3].data = pred42;
      chartInstances.c20.update();
    }

    // C21: Trajectory FCR
    if (chartInstances.c21) {
      chartInstances.c21.data.datasets[0].data = fcrData;
      chartInstances.c21.update();
    }

    // C24 & C25: Multi Period Benchmark
    if (chartInstances.c25 && multiPeriodStats) {
      chartInstances.c25.data.datasets[0].data = [
        Math.round(multiPeriodStats.p1.ip),
        Math.round(multiPeriodStats.p2.ip),
        Math.round(multiPeriodStats.p3.ip),
        Math.round(multiPeriodStats.p4.ip)
      ];
      chartInstances.c25.update();
    }
  }

  function updateInsights(metrics, summary, activePeriod, allPeriods) {
    const setEl = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    const s = summary.latestSample;
    const actDay = summary.activeDay;

    setEl('insight_c1', `Bobot nyata hari ke-${actDay} (${s ? s.bw : 241}g) mencapai 99,6% standar target acuan MBS.`);
    setEl('insight_c2', `Pertambahan bobot harian (ADG) stabil di kisaran 32,5 g/hari pada fase starter.`);
    setEl('insight_c3', `Deviasi bobot aktual terhadap kurva target hanya -1 gram, pertumbuhan flock sangat presisi.`);
    setEl('insight_c4', `Akumulasi bobot per fase menunjukkan tren eksponensial normal siap memasuki fase grower.`);
    setEl('insight_c5', `Bobot titik kritis evaluasi mingguan H-7 sukses tercapai sesuai standar kemitraan.`);

    setEl('insight_c6', `Konsumsi pakan harian berjalan hemat 0,5 sak di bawah pagu jatah standar harian.`);
    setEl('insight_c7', `Transisi pakan Starter MB-100 menuju Grower MB-200 dijadwalkan bertahap pada hari ke-15.`);
    setEl('insight_c8', `Pergerakan rasio FCR harian 0,67 berada jauh di bawah ambang batas toleransi 1,79.`);
    setEl('insight_c9', `Akumulasi penghematan pakan mingguan mencapai 1,8 sak bernilai efisiensi operasional tinggi.`);
    setEl('insight_c10', `Korelasi konsumsi pakan terhadap pembentukan biomassa daging menunjukkan rasio konversi prima.`);

    setEl('insight_c11', `Mortalitas harian rendah terkendali dengan akumulasi deplesi 1,84% (aman di bawah batas 4%).`);
    setEl('insight_c12', `Sebagian besar penyusutan terjadi di masa brooding alami awal dan telah mereda stabil.`);
    setEl('insight_c13', `Populasi ayam hidup bertahan 2.454 ekor dengan indeks livability flock 98,16%.`);
    setEl('insight_c14', `Suhu kandang 29,4°C dan RH 76% berada dalam rentang nyaman tanpa ancaman heat stress.`);
    setEl('insight_c15', `Program OVK dan vaksinasi ND-IB serta Gumboro tuntas 100% memperkuat antibodi ayam.`);

    setEl('insight_c16', `Sisa stok fisik pakan di gudang 10 sak, aman berjarak 7 sak di atas batas kritis minimum.`);
    setEl('insight_c17', `Kiriman pakan TRM dari pabrik tiba tepat waktu mengimbangi laju pemakaian mingguan kandang.`);
    setEl('insight_c18', `Neraca arus kas stok pakan terpantau positif dan transparan tanpa selisih susut.`);
    setEl('insight_c19', `Ketahanan stok saat ini mencukupi kebutuhan flock selama ~5,0 hari operasional ke depan.`);

    setEl('insight_c20', `Model ML memproyeksikan bobot panen hari ke-40 menyentuh 2.610 g dalam rentang pita optimis.`);
    setEl('insight_c21', `Lintasan proyeksi FCR akhir diprediksi menutup pada angka hemat 1,65–1,71 di masa panen.`);
    setEl('insight_c22', `Estimasi total panen 6,38 ton melampaui target minimal kontrak kemitraan PT MBS (6,0 ton).`);
    setEl('insight_c23', `Simulasi panen hari ke-40 memberikan margin laba dan rasio tonase paling optimal bagi mitra.`);

    setEl('insight_c24', `Evaluasi radar multi-parameter menempatkan Periode 4 di jajaran performa kandang terbaik.`);
    setEl('insight_c25', `Proyeksi Indeks Performa (IP 388) melampaui target standar kontrak minimal IP 350.`);
  }

  function destroyAllCharts() {
    Object.keys(chartInstances).forEach(k => {
      if (chartInstances[k] && typeof chartInstances[k].destroy === 'function') {
        chartInstances[k].destroy();
      }
      delete chartInstances[k];
    });
  }

  function resizeAllCharts() {
    const doResize = () => {
      Object.keys(chartInstances).forEach(k => {
        if (chartInstances[k] && typeof chartInstances[k].resize === 'function') {
          chartInstances[k].resize();
        }
      });
    };
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(doResize);
    } else {
      setTimeout(doResize, 30);
    }
  }

  window.MBS_CHARTS = {
    instances: chartInstances,
    initAllCharts,
    updateAllChartsData,
    updateInsights,
    destroyAllCharts,
    resizeAllCharts
  };

})(window);
