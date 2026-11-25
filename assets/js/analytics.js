/**
 * PT. MAYSURA BERKAH SEJAHTERA - ANALYTICS & PREDICTIVE ENGINE
 * assets/js/analytics.js
 * 
 * Berisi:
 * 1. Kalkulasi Metrik Harian (FCR, DIFF FCR, Deplesi %, Kumulatif Pakan, Stok)
 * 2. Deteksi Hari Siklus Aktif Dinamis (H-1 s/d H-42)
 * 3. Algoritma Prediksi Panen (Hybrid Growth Projection & Machine Learning Curve)
 * 4. Analisis Multi-Periode & Indeks Performa (IP)
 */

(function (window) {
  'use strict';

  /**
   * Hitung seluruh metrik harian 42 hari untuk satu periode
   */
  function calculateDailyMetrics(days, settings) {
    const popAwal = (settings && settings.populasiAwal) ? settings.populasiAwal : 2500;
    const kgPerSak = (settings && settings.kgPerSak) ? settings.kgPerSak : 50;
    const fcrMethod = (settings && settings.fcrMethod) ? settings.fcrMethod : 'before';

    let cumMati = 0;
    let cumCl = 0;
    let cumActSak = 0;
    let prevSisa = 0;
    let lastKnownLive = popAwal;

    const metrics = [];

    for (let i = 0; i < 42; i++) {
      const d = (days && days[i]) ? days[i] : {};
      const dayNum = i + 1;
      const stdSak = window.MBS_DATA.STD_PAKAN_SAK[i];
      const stdBw = window.MBS_DATA.STD_BW_G[i];
      const stdFcr = window.MBS_DATA.STD_FCR[i];

      const isRecorded = (d.act !== null && d.act !== undefined && d.act !== '') ||
                         (d.mati !== null && d.mati !== undefined && d.mati !== '') ||
                         (d.bw !== null && d.bw !== undefined && d.bw !== '');

      const matiVal = (d.mati !== null && d.mati !== undefined && d.mati !== '') ? Number(d.mati) : (isRecorded ? 0 : null);
      const clVal = (d.cl !== null && d.cl !== undefined && d.cl !== '') ? Number(d.cl) : (isRecorded ? 0 : null);

      if (matiVal !== null) cumMati += matiVal;
      if (clVal !== null) cumCl += clVal;

      const liveBirds = popAwal - cumMati - cumCl;
      if (isRecorded) lastKnownLive = liveBirds;

      const deplesiPct = ((cumMati + cumCl) / popAwal) * 100;

      const trmVal = (d.trm !== null && d.trm !== undefined && d.trm !== '') ? Number(d.trm) : 0;
      const rtVal = (d.rt !== null && d.rt !== undefined && d.rt !== '') ? Number(d.rt) : 0;
      const actVal = (d.act !== null && d.act !== undefined && d.act !== '') ? Number(d.act) : null;

      if (actVal !== null) cumActSak += actVal;

      let sisaCalc = prevSisa + trmVal - (actVal || 0) - rtVal;
      let sisaFinal = (d.sisaOverride !== null && d.sisaOverride !== undefined && d.sisaOverride !== '')
        ? Number(d.sisaOverride)
        : (isRecorded ? sisaCalc : null);

      if (sisaFinal !== null) prevSisa = sisaFinal;

      const cumFeedKg = cumActSak * kgPerSak;
      const bwAct = (d.bw !== null && d.bw !== undefined && d.bw !== '') ? Number(d.bw) : null;

      let fcrCalc = null;
      let diffFcr = null;

      if (bwAct && liveBirds > 0) {
        const biomassKg = liveBirds * (bwAct / 1000.0);
        const feedForFcrKg = (fcrMethod === 'before')
          ? ((cumActSak - (actVal || 0)) * kgPerSak)
          : cumFeedKg;
        fcrCalc = biomassKg > 0 ? (feedForFcrKg / biomassKg) : 0;
        diffFcr = fcrCalc - stdFcr;
      }

      const consPerBirdG = (actVal !== null && actVal > 0 && liveBirds > 0)
        ? (actVal * kgPerSak * 1000 / liveBirds)
        : null;

      metrics.push({
        day: dayNum,
        isRecorded: isRecorded,
        mati: matiVal,
        cl: clVal,
        cumMati: cumMati,
        cumCl: cumCl,
        liveBirds: liveBirds,
        deplesiPct: deplesiPct,
        trm: trmVal > 0 ? trmVal : null,
        rt: rtVal > 0 ? rtVal : null,
        act: actVal,
        cumActSak: cumActSak,
        cumFeedKg: cumFeedKg,
        sisa: sisaFinal,
        bwAct: bwAct,
        stdSak: stdSak,
        stdBw: stdBw,
        stdFcr: stdFcr,
        fcrCalc: fcrCalc,
        diffFcr: diffFcr,
        consPerBirdG: consPerBirdG,
        ovk: d.ovk || '-',
        notes: d.notes || '',
        suhu_c: (d.suhu_c !== null && d.suhu_c !== undefined) ? Number(d.suhu_c) : 28.5,
        kelembapan: (d.kelembapan !== null && d.kelembapan !== undefined) ? Number(d.kelembapan) : 75
      });
    }

    return metrics;
  }

  /**
   * Menemukan hari terakhir yang tercatat pada siklus
   */
  function getActiveDayIndex(metrics) {
    const recordedDays = metrics.filter(m => m.isRecorded);
    if (recordedDays.length === 0) return 0;
    return recordedDays[recordedDays.length - 1].day - 1;
  }

  /**
   * Hitung Ringkasan Performa & Proyeksi Panen (Hari 1 s/d 42)
   */
  function calculateSummary(metrics, settings, periodId, allPeriods) {
    const activeIdx = getActiveDayIndex(metrics);
    const activeM = metrics[activeIdx] || metrics[0];
    const isCompleted = (activeIdx >= 41);

    // Ambil titik sampling timbang bobot terakhir
    const sampled = metrics.filter(m => m.bwAct !== null);
    const latestSample = sampled.length > 0 ? sampled[sampled.length - 1] : null;
    const prevSample = sampled.length > 1 ? sampled[sampled.length - 2] : null;

    // Rasio pertumbuhan terhadap standar (K-factor)
    let k = 1.0;
    if (latestSample && prevSample) {
      k = ((latestSample.bwAct / latestSample.stdBw) + (prevSample.bwAct / prevSample.stdBw)) / 2;
    } else if (latestSample) {
      k = latestSample.bwAct / latestSample.stdBw;
    }

    const lastDiffFcr = latestSample ? (latestSample.diffFcr || 0) : 0;

    // Rata-rata kematian 3 hari terakhir yang terisi
    const recordedWithMati = metrics.filter(m => m.mati !== null);
    const last3Mati = recordedWithMati.slice(-3);
    const avgDailyDeaths = last3Mati.length > 0
      ? (last3Mati.reduce((a, m) => a + m.mati, 0) / last3Mati.length)
      : 1.0;

    // Rata-rata pakan 3 hari terakhir yang terisi
    const recordedWithAct = metrics.filter(m => m.act !== null);
    const last3Act = recordedWithAct.slice(-3);
    const avgAct3d = last3Act.length > 0
      ? (last3Act.reduce((a, m) => a + m.act, 0) / last3Act.length)
      : (activeM.stdSak || 5.0);

    const remainingStockDays = (activeM.sisa !== null && avgAct3d > 0)
      ? (activeM.sisa / avgAct3d)
      : 0;

    // Rata-rata cuaca
    let sumT = 0, sumRh = 0, countW = 0;
    const daysUpToActive = metrics.slice(0, activeIdx + 1);
    daysUpToActive.forEach(m => {
      sumT += m.suhu_c;
      sumRh += m.kelembapan;
      countW++;
    });
    const avgSuhu = countW > 0 ? (sumT / countW) : 28.5;
    const avgRh = countW > 0 ? (sumRh / countW) : 75;
    const thi = (0.8 * avgSuhu) + ((avgRh / 100) * (avgSuhu - 14.4)) + 46.4;

    // -------------------------------------------------------------
    // ENGINE PREDIKSI PANEN (HARI KE-42 ATAU TARGET USIA PANEN)
    // -------------------------------------------------------------
    const targetAge = (settings && settings.targetUmurPanen) ? settings.targetUmurPanen : 42;
    const predIdx = Math.min(targetAge - 1, 41);

    let predBw, predFcr, predLive, predDep, predTotalPakanSak;

    if (isCompleted) {
      // Siklus sudah selesai 42 hari (misalnya Periode 1, 2, 3)
      predBw = activeM.bwAct || (window.MBS_DATA.STD_BW_G[predIdx] * k);
      predFcr = activeM.fcrCalc || (window.MBS_DATA.STD_FCR[predIdx] + lastDiffFcr);
      predLive = activeM.liveBirds;
      predDep = activeM.deplesiPct;
      predTotalPakanSak = activeM.cumActSak;
    } else {
      // Siklus berjalan harian (Periode 4, misalnya masih Hari ke-8)
      // Gunakan kombinasi bobot terkini + ADG proyeksi s/d Hari ke-42
      predBw = Math.round(window.MBS_DATA.STD_BW_G[predIdx] * k);

      const daysRemaining = Math.max(0, targetAge - (activeIdx + 1));
      const projectedAdditionalDeaths = Math.round(daysRemaining * Math.max(avgDailyDeaths, 0.8));
      predLive = Math.max(0, activeM.liveBirds - projectedAdditionalDeaths);
      predDep = ((settings.populasiAwal - predLive) / settings.populasiAwal) * 100;

      // Estimasi penambahan konsumsi pakan sisa hari
      let futureSak = 0;
      for (let j = activeIdx + 1; j < targetAge; j++) {
        futureSak += window.MBS_DATA.STD_PAKAN_SAK[j];
      }
      predTotalPakanSak = activeM.cumActSak + futureSak;

      // Estimasi FCR akhir
      const projectedBiomass = predLive * (predBw / 1000.0);
      predFcr = projectedBiomass > 0
        ? ((predTotalPakanSak * settings.kgPerSak) / projectedBiomass)
        : window.MBS_DATA.STD_FCR[predIdx];
    }

    const predBiomass = predLive * (predBw / 1000.0);
    const predIp = (predFcr > 0 && targetAge > 0)
      ? (((100 - predDep) * (predBw / 1000.0)) / (predFcr * targetAge) * 100)
      : 0;

    const predFeedCost = predTotalPakanSak * settings.hargaPakanPerSak;
    const predRevenue = predBiomass * settings.hargaJualPerKg;
    const predMargin = predRevenue - predFeedCost;

    return {
      activeDay: activeIdx + 1,
      isCompleted: isCompleted,
      activeMetric: activeM,
      latestSample: latestSample,
      k: k,
      lastDiffFcr: lastDiffFcr,
      avgDailyDeaths: avgDailyDeaths,
      avgAct3d: avgAct3d,
      remainingStockDays: remainingStockDays,
      avgSuhu: avgSuhu,
      avgRh: avgRh,
      thi: thi,
      pred: {
        targetAge: targetAge,
        predBw: Math.round(predBw),
        predFcr: Number(predFcr.toFixed(2)),
        predLive: Math.round(predLive),
        predDep: Number(predDep.toFixed(2)),
        predTotalPakanSak: Number(predTotalPakanSak.toFixed(1)),
        predFeedCost: predFeedCost,
        predBiomass: Number(predBiomass.toFixed(1)),
        predIp: Number(predIp.toFixed(1)),
        predRevenue: predRevenue,
        predMargin: predMargin
      }
    };
  }

  /**
   * Rekap Komparasi Antar Periode untuk Grafik #24 (FCR) dan #25 (IP)
   */
  function getMultiPeriodStats(allPeriods, settings) {
    const keys = ['p1', 'p2', 'p3', 'p4'];
    const results = {};

    keys.forEach(k => {
      const p = allPeriods[k];
      if (!p) return;
      const metrics = calculateDailyMetrics(p.days, settings);
      const summ = calculateSummary(metrics, settings, k, allPeriods);

      results[k] = {
        id: k,
        name: p.name,
        subtitle: p.subtitle,
        activeDay: summ.activeDay,
        isCompleted: summ.isCompleted,
        mati: summ.activeMetric.cumMati,
        live: summ.activeMetric.liveBirds,
        depPct: summ.activeMetric.deplesiPct,
        totalSak: summ.activeMetric.cumActSak,
        bw: summ.isCompleted ? (summ.activeMetric.bwAct || 2600) : summ.pred.predBw,
        fcr: summ.isCompleted ? (summ.latestSample ? summ.latestSample.fcrCalc : 1.75) : summ.pred.predFcr,
        ip: summ.isCompleted ? summ.pred.predIp : summ.pred.predIp,
        avgSuhu: summ.avgSuhu,
        avgRh: summ.avgRh,
        thi: summ.thi
      };
    });

    return results;
  }

  function formatNumber(num, decimals = 0) {
    if (num === null || num === undefined || isNaN(num)) return '-';
    const parts = Number(num).toFixed(decimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return parts.join(',');
  }

  function formatRupiah(num) {
    if (num === null || num === undefined || isNaN(num)) return 'Rp 0';
    return 'Rp ' + formatNumber(Math.round(num), 0);
  }

  // Ekspor ke window global
  window.MBS_ANALYTICS = {
    calculateDailyMetrics,
    getActiveDayIndex,
    calculateSummary,
    getMultiPeriodStats,
    formatNumber,
    formatRupiah
  };

})(window);
