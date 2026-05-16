import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { PARTICLE_COLORS, PARTICLE_TYPES, RISK_STYLE } from './particleConstants';
import './index.css';

const riskOrder = { High: 3, Moderate: 2, Low: 1 };

const normalizeParticle = (p) => ({
  ...p,
  particleType: p.particleType || p.crystalType || p.name || 'Unknown',
  count: Number(p.count || 0),
  risk: p.risk || 'Low',
});

const getRiskScore = (risk) => riskOrder[risk] || 0;

const getParticleGroup = (type) => {
  const ptype = PARTICLE_TYPES.find(pt => pt.label === type);
  return ptype?.group || 'Other';
};

const getDetectionType = (det) => {
  return String(
    det?.crystalType ||
    det?.particleType ||
    det?.className ||
    det?.label ||
    det?.name ||
    'Unknown'
  ).trim();
};

const getParticleColor = (particleOrType) => {
  const rawType =
    typeof particleOrType === 'string'
      ? particleOrType
      : particleOrType?.particleType ||
        particleOrType?.crystalType ||
        particleOrType?.name ||
        particleOrType?.className ||
        particleOrType?.label ||
        '';

  const type = String(rawType || '').trim();

  if (PARTICLE_COLORS[type]) return PARTICLE_COLORS[type];

  const matchedKey = Object.keys(PARTICLE_COLORS).find(
    key => key.toLowerCase().trim() === type.toLowerCase()
  );

  return matchedKey ? PARTICLE_COLORS[matchedKey] : '#888';
};

const getHighestRiskParticle = (particles) => {
  if (!particles.length) return null;

  return [...particles].sort((a, b) => {
    const riskDiff = getRiskScore(b.risk) - getRiskScore(a.risk);
    if (riskDiff !== 0) return riskDiff;
    return Number(b.count || 0) - Number(a.count || 0);
  })[0];
};

const getDominantParticle = (particles) => {
  if (!particles.length) return null;
  return [...particles].sort((a, b) => Number(b.count || 0) - Number(a.count || 0))[0];
};

const escapeHtml = (value) => {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
};

const getTypeInterpretation = (type) => {
  const t = String(type || '').toLowerCase();

  if (t.includes('red blood') || t === 'rbc' || t.includes('rbc')) {
    return 'Red blood cells may indicate urinary tract irritation, inflammation, trauma, stones, or other causes of hematuria. The finding should be reviewed together with symptoms and other laboratory results.';
  }

  if (t.includes('white blood') || t === 'wbc' || t.includes('wbc')) {
    return 'White blood cells may suggest inflammation or possible urinary tract infection, especially when seen together with bacteria or other inflammatory findings.';
  }

  if (t.includes('epithelial')) {
    return 'Epithelial cells may be associated with normal shedding from the urinary tract, but higher amounts may also suggest contamination or irritation depending on the sample quality.';
  }

  if (t.includes('cast')) {
    return 'Casts may reflect conditions occurring within the kidney tubules. Their clinical relevance depends strongly on the cast type and should be reviewed by a qualified medical professional.';
  }

  if (t.includes('microorganism') || t.includes('bacteria') || t.includes('yeast')) {
    return 'Microorganisms may suggest possible infection or contamination. Correlation with urine culture, symptoms, and clinical assessment is recommended.';
  }

  if (t.includes('calcium oxalate')) {
    return 'Calcium oxalate crystals may be seen in urine and can be associated with dietary factors, concentration of urine, or stone-forming tendency in some cases.';
  }

  if (t.includes('uric')) {
    return 'Uric acid crystals may be associated with acidic urine and can be seen in conditions related to uric acid concentration or stone formation risk.';
  }

  if (t.includes('triple phosphate') || t.includes('struvite')) {
    return 'Triple phosphate crystals may be associated with alkaline urine and can be seen in some infection-related stone-forming conditions.';
  }

  if (t.includes('ammonium biurate')) {
    return 'Ammonium biurate crystals may be associated with urine chemistry changes and should be interpreted together with pH, concentration, and clinical context.';
  }

  if (t.includes('crystal')) {
    return 'Crystals may reflect urine chemistry, hydration status, pH, diet, or possible stone-forming tendency. Interpretation depends on crystal type and clinical context.';
  }

  return 'The detected particle type may provide supportive information about urine sediment characteristics. Review by a medical professional is recommended for clinical interpretation.';
};

const buildClinicalInterpretation = (particles, totalCount) => {
  if (!particles.length) {
    return {
      title: 'No particles detected',
      text: 'No urinary particles were detected in the current analysis. This result should still be interpreted together with the image quality, clinical context, and laboratory workflow.',
      bullets: [],
    };
  }

  const dominant = getDominantParticle(particles);
  const highestRisk = getHighestRiskParticle(particles);
  const dominantPct = totalCount > 0 ? Math.round((dominant.count / totalCount) * 100) : 0;

  return {
    title: `${dominant.particleType} is the dominant detected finding`,
    text: getTypeInterpretation(dominant.particleType),
    bullets: [
      `${dominant.particleType} represents approximately ${dominantPct}% of the detected particles.`,
      `${highestRisk.particleType} is the highest-risk highlighted finding and is recommended for review.`,
      'This report is a computer-assisted summary and should not be treated as a final medical diagnosis.',
    ],
  };
};

const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

const drawDetectionsOnCanvas = (canvas, img, detections = []) => {
  const ctx = canvas.getContext('2d');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  detections.forEach(det => {
    if (!Array.isArray(det.bbox) || det.bbox.length < 4) return;

    const [x1, y1, x2, y2] = det.bbox.map(Number);
    const detType = getDetectionType(det);
    const color = getParticleColor(detType);
    const w = x2 - x1;
    const h = y2 - y1;

    if (!Number.isFinite(x1) || !Number.isFinite(y1) || !Number.isFinite(w) || !Number.isFinite(h)) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, canvas.width / 300);
    ctx.strokeRect(x1, y1, w, h);

    const fontSize = Math.max(10, canvas.width / 60);
    ctx.font = `bold ${fontSize}px Poppins, Arial, sans-serif`;

    const confidence = Number(det.confidence || 0);
    const label = `${detType} ${Math.round(confidence)}%`;
    const tw = ctx.measureText(label).width;
    const th = fontSize + 6;

    ctx.fillStyle = color;
    ctx.fillRect(x1, Math.max(0, y1 - th), tw + 8, th);

    ctx.fillStyle = '#fff';
    ctx.fillText(label, x1 + 4, Math.max(fontSize, y1 - 4));
  });
};

const createAnnotatedImageDataUrl = async (imageSrc, detections = []) => {
  if (!imageSrc) return '';

  try {
    const img = await loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    drawDetectionsOnCanvas(canvas, img, detections);
    return canvas.toDataURL('image/jpeg', 0.92);
  } catch (error) {
    console.error('Could not create annotated report image:', error);
    return imageSrc;
  }
};

function ReportAnnotatedCanvas({ imageSrc, detections = [] }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;
    drawDetectionsOnCanvas(canvas, img, detections);
  }, [detections, imgLoaded]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div style={styles.annotatedImageCanvasWrap}>
      <img
        ref={imgRef}
        src={imageSrc}
        alt=""
        style={{ display: 'none' }}
        onLoad={() => setImgLoaded(true)}
        crossOrigin="anonymous"
      />

      <canvas
        ref={canvasRef}
        style={styles.reportCanvas}
      />
    </div>
  );
}

function buildReportHtml({
  analysisData,
  particles,
  totalCount,
  highestRiskParticle,
  interpretation,
  reportImage,
}) {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const rows = particles.map(p => {
    const pct = totalCount > 0 ? Math.round((p.count / totalCount) * 100) : 0;
    const color = getParticleColor(p);
    const rs = RISK_STYLE[p.risk] || RISK_STYLE.Low;

    return `
      <tr>
        <td>
          <span class="dot" style="background:${color};"></span>
          ${escapeHtml(p.particleType)}
        </td>
        <td>${p.count}</td>
        <td>
          <div class="bar"><div class="fill" style="width:${pct}%;background:${color};"></div></div>
          <span class="pct">${pct}%</span>
        </td>
        <td>
          <span class="risk" style="background:${rs.background};color:${rs.color};">${escapeHtml(p.risk)}</span>
        </td>
      </tr>
    `;
  }).join('');

  const interpretationBullets = interpretation.bullets.map(item => `
    <li>${escapeHtml(item)}</li>
  `).join('');

  const highestRiskHtml = highestRiskParticle ? `
    <div class="highlight">
      <div>
        <div class="highlight-label">Highest-risk highlighted particle</div>
        <div class="highlight-title">${escapeHtml(highestRiskParticle.particleType)}</div>
        <div class="highlight-sub">${highestRiskParticle.count} detected - ${escapeHtml(getParticleGroup(highestRiskParticle.particleType))}</div>
      </div>
      <span class="risk big" style="background:${(RISK_STYLE[highestRiskParticle.risk] || RISK_STYLE.Low).background};color:${(RISK_STYLE[highestRiskParticle.risk] || RISK_STYLE.Low).color};">
        ${escapeHtml(highestRiskParticle.risk)} Risk
      </span>
    </div>
  ` : '';

  const imageHtml = reportImage ? `
    <div class="image-box">
      <img src="${reportImage}" alt="Analyzed sample image" />
    </div>
  ` : `
    <div class="image-placeholder">No analyzed image available</div>
  `;

  return `
    <html>
    <head>
      <title>MagniTect Urinalysis Report</title>
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 28px;
          background: #EEF0E8;
          color: #141514;
        }
        .sheet {
          max-width: 920px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid #D8DAD0;
          border-radius: 18px;
          padding: 28px;
        }
        .top {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          border-bottom: 2px solid #1F5330;
          padding-bottom: 16px;
          margin-bottom: 20px;
        }
        h1 {
          font-size: 24px;
          font-weight: 800;
          color: #1F5330;
          margin: 0 0 4px;
        }
        .sub {
          font-size: 12px;
          color: #6B7168;
        }
        .tag {
          align-self: flex-start;
          font-size: 10px;
          font-weight: 700;
          padding: 6px 10px;
          border-radius: 999px;
          background: #E8F5E8;
          color: #1F5330;
          text-transform: uppercase;
        }
        .info-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 18px;
        }
        .info-box {
          background: #F5F6F0;
          border: 1px solid #EEEFE8;
          border-radius: 12px;
          padding: 10px 12px;
        }
        .info-lbl {
          font-size: 9px;
          font-weight: 700;
          color: #A4AAA4;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .info-val {
          font-size: 13px;
          font-weight: 800;
          color: #141514;
        }
        .section {
          margin-top: 18px;
        }
        .section-title {
          font-size: 13px;
          font-weight: 800;
          color: #141514;
          margin-bottom: 10px;
        }
        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .image-box {
          background: #1C1E1C;
          border-radius: 14px;
          overflow: hidden;
          height: 280px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .image-box img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          display: block;
        }
        .image-placeholder {
          height: 280px;
          border-radius: 14px;
          background: #F5F6F0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #A4AAA4;
          font-size: 12px;
        }
        .highlight {
          border: 1px solid #F2D6A6;
          background: #FFF8EC;
          border-radius: 14px;
          padding: 14px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          min-height: 120px;
        }
        .highlight-label {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          color: #A67A2D;
          margin-bottom: 5px;
        }
        .highlight-title {
          font-size: 18px;
          font-weight: 800;
          color: #141514;
        }
        .highlight-sub {
          font-size: 11px;
          color: #6B7168;
          margin-top: 4px;
        }
        .risk {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 999px;
          white-space: nowrap;
        }
        .risk.big {
          padding: 5px 10px;
        }
        .interpretation {
          background: #F8FAF4;
          border: 1px solid #E2E6D8;
          border-radius: 14px;
          padding: 14px;
          font-size: 12px;
          line-height: 1.65;
          color: #3F453D;
        }
        .interpretation-title {
          font-size: 14px;
          font-weight: 800;
          color: #1F5330;
          margin-bottom: 6px;
        }
        ul {
          margin: 10px 0 0 18px;
          padding: 0;
        }
        li {
          margin-bottom: 4px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #D8DAD0;
          border-radius: 12px;
          overflow: hidden;
        }
        thead {
          background: #1F5330;
        }
        th {
          padding: 10px 14px;
          font-size: 10px;
          font-weight: 700;
          color: #9FC8A8;
          text-align: left;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        td {
          padding: 10px 14px;
          border-bottom: 1px solid #EEEFE8;
          font-size: 12px;
          color: #141514;
          vertical-align: middle;
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
          margin-right: 8px;
          vertical-align: middle;
        }
        .bar {
          width: 120px;
          height: 6px;
          background: #D8DAD0;
          border-radius: 3px;
          display: inline-block;
          vertical-align: middle;
          margin-right: 8px;
        }
        .fill {
          height: 100%;
          border-radius: 3px;
        }
        .pct {
          font-size: 11px;
          color: #6B7168;
        }
        .disclaimer {
          margin-top: 18px;
          padding: 10px 12px;
          border: 1px solid #D8DAD0;
          background: #F5F6F0;
          border-radius: 12px;
          font-size: 11px;
          line-height: 1.5;
          color: #5E655C;
        }
        @media print {
          body {
            background: #fff;
            padding: 0;
          }
          .sheet {
            border: none;
            border-radius: 0;
            max-width: none;
          }
          .image-box, .image-placeholder {
            height: 230px;
          }
        }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="top">
          <div>
            <h1>MagniTect Urinalysis Report</h1>
            <div class="sub">Generated on ${date}</div>
          </div>
          <div class="tag">Computer-assisted report</div>
        </div>

        <div class="info-row">
          <div class="info-box"><div class="info-lbl">Patient</div><div class="info-val">${escapeHtml(analysisData?.patientName || '-')}</div></div>
          <div class="info-box"><div class="info-lbl">Patient ID</div><div class="info-val">${escapeHtml(analysisData?.patientId || '-')}</div></div>
          <div class="info-box"><div class="info-lbl">Sample ID</div><div class="info-val">${escapeHtml(analysisData?.sampleId || '-')}</div></div>
          <div class="info-box"><div class="info-lbl">Total Particles</div><div class="info-val">${totalCount}</div></div>
        </div>

        <div class="section two-col">
          <div>
            <div class="section-title">Analyzed Sample Image</div>
            ${imageHtml}
          </div>
          <div>
            <div class="section-title">Clinical Review Highlight</div>
            ${highestRiskHtml}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Clinical Interpretation Aid</div>
          <div class="interpretation">
            <div class="interpretation-title">${escapeHtml(interpretation.title)}</div>
            <div>${escapeHtml(interpretation.text)}</div>
            <ul>${interpretationBullets}</ul>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Detected Particle Summary and Distribution</div>
          <table>
            <thead>
              <tr>
                <th>Particle Type</th>
                <th>Count</th>
                <th>Distribution</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>

        <div class="disclaimer">
          This report is intended as a computer-assisted diagnostic aid only. Findings may indicate or suggest possible urine sediment patterns, but final interpretation should be performed by a qualified medical professional.
        </div>
      </div>
    </body>
    </html>
  `;
}

export default function Export({
  goToUpload,
  goToResults,
  goToAnalysis,
  goToPatients,
  goToLibrary,
  goToLogin,
  markReportsViewed,
  badges = {},
  analysisData,
  clearAnalysisData,
}) {
  useEffect(() => {
    if (markReportsViewed) markReportsViewed();
  }, [markReportsViewed]);

  const particles = useMemo(() => {
    return (analysisData?.results || []).map(normalizeParticle);
  }, [analysisData]);

  const totalCount = particles.reduce((sum, p) => sum + p.count, 0);
  const highestRiskParticle = getHighestRiskParticle(particles);
  const interpretation = buildClinicalInterpretation(particles, totalCount);
  const detections = analysisData?.detections || [];
  const baseReportImage = analysisData?.rawImage || analysisData?.imageUrl || analysisData?.image || analysisData?.annotatedImage || '';
  const canDrawFrontendAnnotations = Boolean(analysisData?.rawImage && detections.length > 0);

  const handleClear = () => {
    if (window.confirm('Clear this report? This cannot be undone.')) {
      if (clearAnalysisData) clearAnalysisData();
    }
  };

  const handleExportPDF = async () => {
    const reportImage = canDrawFrontendAnnotations
      ? await createAnnotatedImageDataUrl(analysisData.rawImage, detections)
      : baseReportImage;

    const html = buildReportHtml({
      analysisData,
      particles,
      totalCount,
      highestRiskParticle,
      interpretation,
      reportImage,
    });

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();

    setTimeout(() => {
      win.print();
      win.close();
    }, 700);
  };

  return (
    <div style={styles.app}>
      <Topbar goToLogin={goToLogin} />

      <div style={styles.body}>
        <Sidebar
          currentPage="export"
          goToUpload={goToUpload}
          goToResults={() => goToResults()}
          goToAnalysis={goToAnalysis}
          goToExport={() => {}}
          goToPatients={goToPatients}
          goToLibrary={goToLibrary}
          badges={badges}
        />

        <div style={styles.main}>
          <div style={styles.pane}>
            <div style={styles.header}>
              <div>
                {particles.length > 0 ? (
                  <>
                    <div style={styles.expTitle}>Report Preview</div>
                    {analysisData?.patientName && (
                      <div style={styles.expSub}>
                        {analysisData.patientName} - {analysisData.patientId} - {analysisData.sampleId}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={styles.expTitle}>Reports</div>
                )}
              </div>

              <button onClick={goToLibrary} style={styles.libraryLink}>
                View past reports in Library
              </button>
            </div>

            {particles.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '40px' }}>Report</div>
                <div style={styles.emptyTitle}>No report yet</div>
                <div style={styles.emptySub}>Analyze an image first, then come back to export</div>
              </div>
            ) : (
              <>
                <div style={styles.reportSheet}>
                  <div style={styles.reportTop}>
                    <div>
                      <div style={styles.reportTitle}>MagniTect Urinalysis Report</div>
                      <div style={styles.reportSub}>
                        Generated on {new Date().toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </div>

                    <div style={styles.reportTag}>Computer-assisted report</div>
                  </div>

                  <div style={styles.infoRow}>
                    <div style={styles.infoBox}>
                      <div style={styles.infoLbl}>Patient</div>
                      <div style={styles.infoVal}>{analysisData?.patientName || '-'}</div>
                    </div>

                    <div style={styles.infoBox}>
                      <div style={styles.infoLbl}>Patient ID</div>
                      <div style={styles.infoVal}>{analysisData?.patientId || '-'}</div>
                    </div>

                    <div style={styles.infoBox}>
                      <div style={styles.infoLbl}>Sample ID</div>
                      <div style={styles.infoVal}>{analysisData?.sampleId || '-'}</div>
                    </div>

                    <div style={styles.infoBox}>
                      <div style={styles.infoLbl}>Total Particles</div>
                      <div style={styles.infoVal}>{totalCount}</div>
                    </div>
                  </div>

                  <div style={styles.previewGrid}>
                    <div>
                      <div style={styles.sectionTitle}>Analyzed Sample Image</div>
                      {baseReportImage ? (
                        <div style={styles.imageBox}>
                          {canDrawFrontendAnnotations ? (
                            <ReportAnnotatedCanvas
                              imageSrc={analysisData.rawImage}
                              detections={detections}
                            />
                          ) : (
                            <img
                              src={baseReportImage}
                              alt="Analyzed sample"
                              style={styles.reportImage}
                            />
                          )}
                        </div>
                      ) : (
                        <div style={styles.imagePlaceholder}>No analyzed image available</div>
                      )}
                    </div>

                    <div>
                      <div style={styles.sectionTitle}>Clinical Review Highlight</div>

                      {highestRiskParticle && (
                        <div style={styles.highlight}>
                          <div>
                            <div style={styles.highlightLabel}>Highest-risk highlighted particle</div>
                            <div style={styles.highlightTitle}>{highestRiskParticle.particleType}</div>
                            <div style={styles.highlightSub}>
                              {highestRiskParticle.count} detected - {getParticleGroup(highestRiskParticle.particleType)}
                            </div>
                          </div>

                          <span style={{
                            ...styles.riskBadge,
                            ...(RISK_STYLE[highestRiskParticle.risk] || RISK_STYLE.Low),
                          }}>
                            {highestRiskParticle.risk} Risk
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={styles.section}>
                    <div style={styles.sectionTitle}>Clinical Interpretation Aid</div>
                    <div style={styles.interpretationBox}>
                      <div style={styles.interpretationTitle}>{interpretation.title}</div>
                      <div style={styles.interpretationText}>{interpretation.text}</div>

                      <div style={styles.interpretationList}>
                        {interpretation.bullets.map((item, index) => (
                          <div key={index} style={styles.interpretationBullet}>
                            <span style={styles.bulletDot} />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={styles.section}>
                    <div style={styles.sectionTitle}>Detected Particle Summary and Distribution</div>

                    <div style={styles.expTable}>
                      <div style={styles.expThead}>
                        <div style={styles.eth}>Particle Type</div>
                        <div style={styles.eth}>Count</div>
                        <div style={styles.eth}>Distribution</div>
                        <div style={styles.eth}>Risk</div>
                      </div>

                      <div style={styles.expBody}>
                        {particles.map((particle, i) => {
                          const pct = totalCount > 0 ? Math.round((particle.count / totalCount) * 100) : 0;
                          const color = getParticleColor(particle);
                          const rs = RISK_STYLE[particle.risk] || RISK_STYLE.Low;

                          return (
                            <div key={`${particle.particleType}-${i}`} style={styles.erow}>
                              <div style={styles.etd}>
                                <div style={{ ...styles.ddot, background: color }} />
                                {particle.particleType}
                              </div>

                              <div style={styles.etd}>{particle.count}</div>

                              <div style={styles.etd}>
                                <div style={styles.ebar}>
                                  <div style={{ ...styles.efill, width: `${pct}%`, background: color }} />
                                </div>
                                {pct}%
                              </div>

                              <div style={styles.etd}>
                                <span style={{ ...styles.smallRiskBadge, ...rs }}>{particle.risk}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div style={styles.disclaimer}>
                    This report is intended as a computer-assisted diagnostic aid only. Findings may indicate or suggest possible urine sediment patterns, but final interpretation should be performed by a qualified medical professional.
                  </div>
                </div>

                <div style={styles.bbar}>
                  <button onClick={handleClear} style={styles.btnClear}>Clear report</button>
                  <div style={{ flex: 1 }} />

                  <button
                    onClick={handleExportPDF}
                    className="btn-export"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    Export PDF
                  </button>

                  <button onClick={goToUpload} className="btn-solid">Analyze another</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100vh',
    background: '#EEF0E8',
    overflow: 'hidden',
  },

  body: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '210px 1fr',
    minHeight: 0,
    overflow: 'hidden',
  },

  main: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
    background: '#EEF0E8',
  },

  pane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 28px',
    gap: '14px',
    minHeight: 0,
    overflowY: 'auto',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexShrink: 0,
  },

  expTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#141514',
    fontFamily: "'Poppins', sans-serif",
  },

  expSub: {
    fontSize: '11px',
    color: '#A4AAA4',
    marginTop: '2px',
    fontFamily: "'Poppins', sans-serif",
  },

  libraryLink: {
    fontSize: '11px',
    color: '#1F5330',
    fontWeight: 600,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
    textDecoration: 'underline',
    flexShrink: 0,
  },

  reportSheet: {
    maxWidth: '980px',
    margin: '0 auto',
    width: '100%',
    background: '#fff',
    border: '1px solid #D8DAD0',
    borderRadius: '18px',
    padding: '28px',
    boxShadow: '0 10px 28px rgba(20,21,20,0.05)',
  },

  reportTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '24px',
    borderBottom: '2px solid #1F5330',
    paddingBottom: '16px',
    marginBottom: '20px',
  },

  reportTitle: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#1F5330',
    fontFamily: "'Poppins', sans-serif",
  },

  reportSub: {
    fontSize: '12px',
    color: '#6B7168',
    marginTop: '4px',
    fontFamily: "'Poppins', sans-serif",
  },

  reportTag: {
    alignSelf: 'flex-start',
    fontSize: '10px',
    fontWeight: 700,
    padding: '6px 10px',
    borderRadius: '999px',
    background: '#E8F5E8',
    color: '#1F5330',
    textTransform: 'uppercase',
    fontFamily: "'Poppins', sans-serif",
  },

  infoRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
    marginBottom: '18px',
  },

  infoBox: {
    background: '#F5F6F0',
    border: '1px solid #EEEFE8',
    borderRadius: '12px',
    padding: '10px 12px',
  },

  infoLbl: {
    fontSize: '9px',
    fontWeight: 700,
    color: '#A4AAA4',
    textTransform: 'uppercase',
    marginBottom: '4px',
    fontFamily: "'Poppins', sans-serif",
  },

  infoVal: {
    fontSize: '13px',
    fontWeight: 800,
    color: '#141514',
    fontFamily: "'Poppins', sans-serif",
  },

  previewGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginTop: '18px',
  },

  section: {
    marginTop: '18px',
  },

  sectionTitle: {
    fontSize: '13px',
    fontWeight: 800,
    color: '#141514',
    marginBottom: '10px',
    fontFamily: "'Poppins', sans-serif",
  },

  imageBox: {
    background: '#1C1E1C',
    borderRadius: '14px',
    overflow: 'hidden',
    height: '280px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  annotatedImageCanvasWrap: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  reportCanvas: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
  },

  reportImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    display: 'block',
  },

  imagePlaceholder: {
    height: '280px',
    borderRadius: '14px',
    background: '#F5F6F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#A4AAA4',
    fontSize: '12px',
    fontFamily: "'Poppins', sans-serif",
  },

  highlight: {
    border: '1px solid #F2D6A6',
    background: '#FFF8EC',
    borderRadius: '14px',
    padding: '14px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
    minHeight: '120px',
  },

  highlightLabel: {
    fontSize: '9px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#A67A2D',
    marginBottom: '5px',
    fontFamily: "'Poppins', sans-serif",
  },

  highlightTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#141514',
    fontFamily: "'Poppins', sans-serif",
  },

  highlightSub: {
    fontSize: '11px',
    color: '#6B7168',
    marginTop: '4px',
    fontFamily: "'Poppins', sans-serif",
  },

  riskBadge: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: 700,
    padding: '5px 10px',
    borderRadius: '999px',
    whiteSpace: 'nowrap',
    fontFamily: "'Poppins', sans-serif",
  },

  interpretationBox: {
    background: '#F8FAF4',
    border: '1px solid #E2E6D8',
    borderRadius: '14px',
    padding: '14px',
  },

  interpretationTitle: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#1F5330',
    marginBottom: '6px',
    fontFamily: "'Poppins', sans-serif",
  },

  interpretationText: {
    fontSize: '12px',
    lineHeight: 1.65,
    color: '#3F453D',
    fontFamily: "'Poppins', sans-serif",
  },

  interpretationList: {
    marginTop: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },

  interpretationBullet: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
    fontSize: '12px',
    lineHeight: 1.5,
    color: '#3F453D',
    fontFamily: "'Poppins', sans-serif",
  },

  bulletDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#1F5330',
    marginTop: '6px',
    flexShrink: 0,
  },

  expTable: {
    background: '#fff',
    border: '1px solid #D8DAD0',
    borderRadius: '14px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },

  expThead: {
    display: 'grid',
    gridTemplateColumns: '2.2fr 1fr 2.5fr 1fr',
    background: '#1F5330',
    flexShrink: 0,
  },

  eth: {
    padding: '10px 16px',
    fontSize: '10px',
    fontWeight: 700,
    color: '#9FC8A8',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    fontFamily: "'Poppins', sans-serif",
  },

  expBody: {
    overflowY: 'auto',
  },

  erow: {
    display: 'grid',
    gridTemplateColumns: '2.2fr 1fr 2.5fr 1fr',
    borderBottom: '1px solid #EEEFE8',
    alignItems: 'center',
  },

  etd: {
    padding: '10px 16px',
    fontSize: '12px',
    color: '#141514',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: "'Poppins', sans-serif",
  },

  ddot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },

  ebar: {
    flex: 1,
    height: '6px',
    background: '#D8DAD0',
    borderRadius: '3px',
    margin: '0 6px',
  },

  efill: {
    height: '100%',
    borderRadius: '3px',
  },

  smallRiskBadge: {
    fontSize: '10px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '10px',
    fontFamily: "'Poppins', sans-serif",
  },

  disclaimer: {
    marginTop: '18px',
    padding: '10px 12px',
    border: '1px solid #D8DAD0',
    background: '#F5F6F0',
    borderRadius: '12px',
    fontSize: '11px',
    lineHeight: 1.5,
    color: '#5E655C',
    fontFamily: "'Poppins', sans-serif",
  },

  bbar: {
    flexShrink: 0,
    padding: '12px 28px',
    background: '#fff',
    borderTop: '1px solid #D8DAD0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  btnClear: {
    padding: '7px 14px',
    borderRadius: '8px',
    border: '1px solid #F5C9C9',
    background: '#fff',
    fontSize: '11px',
    fontWeight: 600,
    color: '#E24B4A',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
  },

  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: '8px',
  },

  emptyTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#A4AAA4',
    fontFamily: "'Poppins', sans-serif",
  },

  emptySub: {
    fontSize: '12px',
    color: '#C9CAC0',
    fontFamily: "'Poppins', sans-serif",
  },
};
