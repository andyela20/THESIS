import React, { useMemo } from 'react';
import './index.css';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { PARTICLE_COLORS, PARTICLE_TYPES, RISK_STYLE } from './particleConstants';

const RISK_ORDER = {
  High: 3,
  Moderate: 2,
  Low: 1,
};

const RISK_COLOR = {
  High: '#A32D2D',
  Moderate: '#C07320',
  Low: '#1F5330',
};

function normalizeParticle(particle) {
  return {
    ...particle,
    particleType:
      particle.particleType ||
      particle.crystalType ||
      particle.name ||
      particle.label ||
      'Unknown Particle',
    count: Number(particle.count || 0),
    risk: particle.risk || 'Low',
  };
}

function getParticleGroup(type) {
  const match = PARTICLE_TYPES.find(item => item.label === type);
  return match?.group || 'Other';
}

function getRiskScore(risk) {
  return RISK_ORDER[risk] || 0;
}

function getHighestRiskParticle(particles) {
  if (!particles.length) return null;

  return [...particles].sort((a, b) => {
    const riskDifference = getRiskScore(b.risk) - getRiskScore(a.risk);
    if (riskDifference !== 0) return riskDifference;

    return Number(b.count || 0) - Number(a.count || 0);
  })[0];
}

function getDominantParticle(particles) {
  if (!particles.length) return null;

  return [...particles].sort((a, b) => {
    return Number(b.count || 0) - Number(a.count || 0);
  })[0];
}

function getOverallRisk(particles) {
  const highestRisk = getHighestRiskParticle(particles);
  return highestRisk?.risk || 'Low';
}

function getClinicalText(type) {
  const lowerType = String(type || '').toLowerCase();

  if (lowerType.includes('uric')) {
    return 'Uric acid crystals may indicate acidic urine and may be associated with increased uric acid concentration or possible stone-forming tendency. This finding should be reviewed together with urine pH, symptoms, and other laboratory results.';
  }

  if (lowerType.includes('calcium oxalate') || lowerType.includes('caox')) {
    return 'Calcium oxalate crystals may be seen in urine and can be associated with urine concentration, dietary factors, hydration status, or stone-forming tendency in some cases.';
  }

  if (lowerType.includes('ammonium biurate')) {
    return 'Ammonium biurate crystals may suggest changes in urine chemistry and should be interpreted with urine pH, concentration, and clinical context.';
  }

  if (lowerType.includes('triple phosphate') || lowerType.includes('struvite')) {
    return 'Triple phosphate crystals may be associated with alkaline urine and may appear in some infection-related stone-forming conditions.';
  }

  if (lowerType.includes('cast')) {
    return 'Casts may reflect processes occurring in the kidney tubules. Their significance depends on the cast type and should be reviewed by a medical professional.';
  }

  if (lowerType.includes('red blood') || lowerType.includes('rbc')) {
    return 'Red blood cells may indicate urinary tract irritation, inflammation, trauma, stones, or other causes of hematuria. Clinical review is recommended.';
  }

  if (lowerType.includes('white blood') || lowerType.includes('wbc')) {
    return 'White blood cells may suggest inflammation or possible urinary tract infection, especially when supported by symptoms or other findings.';
  }

  if (lowerType.includes('epithelial')) {
    return 'Epithelial cells may be related to normal shedding, contamination, or urinary tract irritation depending on quantity and sample quality.';
  }

  if (lowerType.includes('microorganism') || lowerType.includes('bacteria') || lowerType.includes('yeast')) {
    return 'Microorganisms may suggest possible infection or contamination. Correlation with urine culture and clinical assessment is recommended.';
  }

  return 'The detected particles may provide supportive information about urine sediment characteristics. These results should be interpreted by a medical professional together with clinical findings.';
}

function buildClinicalInterpretation(particles, totalCount) {
  if (!particles.length) {
    return {
      title: 'No detected particles available for interpretation',
      text: 'No urinary particles were detected in this analysis. Image quality, sample preparation, and clinical context should still be considered.',
      notes: [],
    };
  }

  const dominant = getDominantParticle(particles);
  const highestRisk = getHighestRiskParticle(particles);
  const dominantPercentage = totalCount > 0
    ? Math.round((dominant.count / totalCount) * 100)
    : 0;

  return {
    title: `${dominant.particleType} is the dominant detected particle type`,
    text: getClinicalText(dominant.particleType),
    notes: [
      `${dominant.particleType} accounts for approximately ${dominantPercentage}% of detected particles.`,
      `${highestRisk.particleType} is highlighted as the highest-risk finding for clinical review.`,
      'This system is intended as a computer-assisted diagnostic aid and does not provide a final medical diagnosis.',
    ],
  };
}

function DonutChart({ particles, totalCount }) {
  const size = 210;
  const strokeWidth = 28;
  const radius = 76;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  if (!particles.length || totalCount <= 0) {
    return (
      <div style={styles.donutEmpty}>
        <div style={styles.donutEmptyText}>No chart data</div>
      </div>
    );
  }

  return (
    <div style={styles.donutBox}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E9EBE2"
          strokeWidth={strokeWidth}
        />

        {particles.map((particle, index) => {
          const value = totalCount > 0
            ? (particle.count / totalCount) * circumference
            : 0;

          const color = PARTICLE_COLORS[particle.particleType] || '#8A8A8A';
          const dashOffset = -offset;
          offset += value;

          return (
            <circle
              key={`${particle.particleType}-${index}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${value} ${circumference - value}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}

        <text
          x="50%"
          y="46%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: '31px',
            fontWeight: 800,
            fill: '#1F5330',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {totalCount}
        </text>

        <text
          x="50%"
          y="60%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: '11px',
            fontWeight: 600,
            fill: '#A4AAA4',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          particles
        </text>
      </svg>
    </div>
  );
}

export default function Analysis({
  goToUpload,
  goToResults,
  goToExport,
  goToPatients,
  goToLibrary,
  goToLogin,
  badges = {},
  analysisData,
  clearAnalysisData,
}) {
  const particles = useMemo(() => {
    return (analysisData?.results || []).map(normalizeParticle);
  }, [analysisData]);

  const totalCount = particles.reduce((sum, particle) => sum + particle.count, 0);
  const particleTypesCount = particles.length;
  const categoryCount = new Set(particles.map(p => getParticleGroup(p.particleType))).size;

  const overallRisk = getOverallRisk(particles);
  const highestRiskParticle = getHighestRiskParticle(particles);
  const dominantParticle = getDominantParticle(particles);
  const interpretation = buildClinicalInterpretation(particles, totalCount);

  const sortedParticles = useMemo(() => {
    return [...particles].sort((a, b) => b.count - a.count);
  }, [particles]);

  const groupedByCategory = useMemo(() => {
    return particles.reduce((groups, particle) => {
      const group = getParticleGroup(particle.particleType);
      if (!groups[group]) groups[group] = [];
      groups[group].push(particle);
      return groups;
    }, {});
  }, [particles]);

  return (
    <div style={styles.app}>
      <Topbar goToLogin={goToLogin} />

      <div style={styles.body}>
        <Sidebar
          currentPage="analysis"
          goToUpload={goToUpload}
          goToResults={() => goToResults()}
          goToAnalysis={() => {}}
          goToExport={goToExport}
          goToPatients={goToPatients}
          goToLibrary={goToLibrary}
          badges={badges}
        />

        <div style={styles.main}>
          <div style={styles.pane}>
            {particles.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>Analysis</div>
                <div style={styles.emptyTitle}>No analysis yet</div>
                <div style={styles.emptySub}>Analyze an image first from New Analysis.</div>
              </div>
            ) : (
              <div style={styles.content}>
                <div style={styles.headerCard}>
                  <div>
                    <div style={styles.pageTitle}>Analysis Overview</div>
                    <div style={styles.pageSub}>
                      {analysisData?.patientName || 'Unnamed Patient'} - {analysisData?.sampleId || 'No Sample ID'}
                    </div>
                  </div>

                  <div style={{
                    ...styles.overallRiskBadge,
                    color: RISK_COLOR[overallRisk],
                    background: overallRisk === 'High' ? '#FDECEC' : overallRisk === 'Moderate' ? '#FFF3E2' : '#E8F5E8',
                  }}>
                    Overall Risk: {overallRisk}
                  </div>
                </div>

                <div style={styles.statsGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Total Particles</div>
                    <div style={styles.statValue}>{totalCount}</div>
                  </div>

                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Particle Types</div>
                    <div style={styles.statValue}>{particleTypesCount}</div>
                  </div>

                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Categories</div>
                    <div style={styles.statValue}>{categoryCount}</div>
                  </div>

                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Dominant Finding</div>
                    <div style={styles.statDominant}>{dominantParticle?.particleType || '-'}</div>
                  </div>
                </div>

                <div style={styles.mainGrid}>
                  <div style={styles.card}>
                    <div style={styles.cardTitle}>
                      Particle Type Distribution
                      <span style={styles.cardSub}>Detected count share</span>
                    </div>

                    <div style={styles.chartArea}>
                      <DonutChart particles={sortedParticles} totalCount={totalCount} />

                      <div style={styles.legendList}>
                        {sortedParticles.map((particle, index) => {
                          const pct = totalCount > 0
                            ? Math.round((particle.count / totalCount) * 100)
                            : 0;

                          const color = PARTICLE_COLORS[particle.particleType] || '#8A8A8A';

                          return (
                            <div key={`${particle.particleType}-${index}`} style={styles.legendItem}>
                              <div style={{ ...styles.legendDot, background: color }} />
                              <div style={styles.legendText}>
                                <div style={styles.legendName}>{particle.particleType}</div>
                                <div style={styles.legendMeta}>
                                  {particle.count} detected - {pct}%
                                </div>
                              </div>
                              <span style={{
                                ...styles.smallRiskBadge,
                                ...(RISK_STYLE[particle.risk] || RISK_STYLE.Low),
                              }}>
                                {particle.risk}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div style={styles.card}>
                    <div style={styles.cardTitle}>
                      Highest-Risk Highlight
                      <span style={styles.cardSub}>For review</span>
                    </div>

                    {highestRiskParticle && (
                      <div style={styles.highlightBox}>
                        <div style={styles.highlightTop}>
                          <div>
                            <div style={styles.highlightLabel}>Highest-risk particle</div>
                            <div style={styles.highlightName}>{highestRiskParticle.particleType}</div>
                            <div style={styles.highlightMeta}>
                              {highestRiskParticle.count} detected - {getParticleGroup(highestRiskParticle.particleType)}
                            </div>
                          </div>

                          <span style={{
                            ...styles.largeRiskBadge,
                            ...(RISK_STYLE[highestRiskParticle.risk] || RISK_STYLE.Low),
                          }}>
                            {highestRiskParticle.risk}
                          </span>
                        </div>

                        <div style={styles.highlightNote}>
                          This finding is emphasized because it has the highest assigned risk level in the detected results.
                          It may require closer review by a qualified medical professional.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={styles.card}>
                  <div style={styles.cardTitle}>
                    Clinical Interpretation Aid
                    <span style={styles.cardSub}>Supportive summary only</span>
                  </div>

                  <div style={styles.interpretationBox}>
                    <div style={styles.interpretationTitle}>{interpretation.title}</div>
                    <div style={styles.interpretationText}>{interpretation.text}</div>

                    <div style={styles.noteList}>
                      {interpretation.notes.map((note, index) => (
                        <div key={index} style={styles.noteItem}>
                          <span style={styles.noteDot} />
                          <span>{note}</span>
                        </div>
                      ))}
                    </div>

                    <div style={styles.disclaimer}>
                      This analysis is a computer-assisted diagnostic aid. It may indicate or suggest possible findings,
                      but it does not replace clinical judgment or confirm a final medical diagnosis.
                    </div>
                  </div>
                </div>

                <div style={styles.card}>
                  <div style={styles.cardTitle}>
                    Detailed Particle Breakdown
                    <span style={styles.cardSub}>Grouped by category</span>
                  </div>

                  <div style={styles.breakdownList}>
                    {Object.entries(groupedByCategory).map(([groupName, groupParticles]) => (
                      <div key={groupName} style={styles.groupBlock}>
                        <div style={styles.groupLabel}>{groupName}</div>

                        {groupParticles.map((particle, index) => {
                          const pct = totalCount > 0
                            ? Math.round((particle.count / totalCount) * 100)
                            : 0;

                          const color = PARTICLE_COLORS[particle.particleType] || '#8A8A8A';

                          return (
                            <div key={`${particle.particleType}-${index}`} style={styles.row}>
                              <div style={{ ...styles.rowDot, background: color }} />
                              <div style={styles.rowName}>{particle.particleType}</div>
                              <div style={styles.rowCount}>{particle.count} ({pct}%)</div>
                              <div style={styles.rowBar}>
                                <div style={{ ...styles.rowFill, width: `${pct}%`, background: color }} />
                              </div>
                              <span style={{
                                ...styles.smallRiskBadge,
                                ...(RISK_STYLE[particle.risk] || RISK_STYLE.Low),
                              }}>
                                {particle.risk}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div style={styles.bbar}>
              <button onClick={() => goToResults()} className="btn-ghost">Back</button>
              <button onClick={goToExport} className="btn-solid">Next</button>
            </div>
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

  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    flexShrink: 0,
  },

  headerCard: {
    background: '#fff',
    border: '1px solid #D8DAD0',
    borderRadius: '14px',
    padding: '16px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  pageTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#141514',
    fontFamily: "'Poppins', sans-serif",
  },

  pageSub: {
    fontSize: '11px',
    color: '#A4AAA4',
    marginTop: '3px',
    fontFamily: "'Poppins', sans-serif",
  },

  overallRiskBadge: {
    fontSize: '12px',
    fontWeight: 800,
    padding: '8px 14px',
    borderRadius: '999px',
    fontFamily: "'Poppins', sans-serif",
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '14px',
  },

  statCard: {
    background: '#fff',
    border: '1px solid #D8DAD0',
    borderRadius: '14px',
    padding: '14px 16px',
  },

  statLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#A4AAA4',
    textTransform: 'uppercase',
    marginBottom: '6px',
    fontFamily: "'Poppins', sans-serif",
  },

  statValue: {
    fontSize: '30px',
    fontWeight: 800,
    color: '#1F5330',
    fontFamily: "'Poppins', sans-serif",
  },

  statDominant: {
    fontSize: '15px',
    fontWeight: 800,
    color: '#1F5330',
    lineHeight: 1.25,
    fontFamily: "'Poppins', sans-serif",
  },

  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.3fr) minmax(340px, 1fr)',
    gap: '14px',
    alignItems: 'start',
  },

  card: {
    background: '#fff',
    border: '1px solid #D8DAD0',
    borderRadius: '14px',
    padding: '16px 18px',
    minWidth: 0,
    overflow: 'hidden',
  },

  cardTitle: {
    fontSize: '13px',
    fontWeight: 800,
    color: '#141514',
    marginBottom: '12px',
    fontFamily: "'Poppins', sans-serif",
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },

  cardSub: {
    fontSize: '11px',
    color: '#A4AAA4',
    fontWeight: 500,
  },

  chartArea: {
    display: 'grid',
    gridTemplateColumns: '230px 1fr',
    gap: '18px',
    alignItems: 'center',
    minHeight: '230px',
  },

  donutBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  donutEmpty: {
    height: '210px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#A4AAA4',
    fontFamily: "'Poppins', sans-serif",
  },

  donutEmptyText: {
    fontSize: '12px',
  },

  legendList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  legendItem: {
    display: 'grid',
    gridTemplateColumns: '10px 1fr auto',
    gap: '10px',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #EEEFE8',
  },

  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },

  legendText: {
    minWidth: 0,
  },

  legendName: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#141514',
    fontFamily: "'Poppins', sans-serif",
  },

  legendMeta: {
    fontSize: '10px',
    color: '#A4AAA4',
    marginTop: '2px',
    fontFamily: "'Poppins', sans-serif",
  },

  highlightBox: {
    background: '#FFF8EC',
    border: '1px solid #F2D6A6',
    borderRadius: '14px',
    padding: '15px',
    height: 'auto',
    minHeight: '180px',
  },

  highlightTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'flex-start',
  },

  highlightLabel: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#A67A2D',
    textTransform: 'uppercase',
    marginBottom: '5px',
    fontFamily: "'Poppins', sans-serif",
  },

  highlightName: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#141514',
    lineHeight: 1.2,
    fontFamily: "'Poppins', sans-serif",
  },

  highlightMeta: {
    fontSize: '11px',
    color: '#6B7168',
    marginTop: '5px',
    fontFamily: "'Poppins', sans-serif",
  },

  highlightNote: {
    marginTop: '16px',
    fontSize: '12px',
    lineHeight: 1.6,
    color: '#5E5546',
    fontFamily: "'Poppins', sans-serif",
  },

  largeRiskBadge: {
    fontSize: '11px',
    fontWeight: 800,
    padding: '5px 10px',
    borderRadius: '999px',
    whiteSpace: 'nowrap',
    fontFamily: "'Poppins', sans-serif",
  },

  smallRiskBadge: {
    fontSize: '9px',
    fontWeight: 700,
    padding: '3px 8px',
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
    marginBottom: '7px',
    fontFamily: "'Poppins', sans-serif",
  },

  interpretationText: {
    fontSize: '12px',
    lineHeight: 1.65,
    color: '#3F453D',
    fontFamily: "'Poppins', sans-serif",
  },

  noteList: {
    marginTop: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },

  noteItem: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
    fontSize: '12px',
    lineHeight: 1.5,
    color: '#3F453D',
    fontFamily: "'Poppins', sans-serif",
  },

  noteDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#1F5330',
    marginTop: '6px',
    flexShrink: 0,
  },

  disclaimer: {
    marginTop: '12px',
    padding: '10px 12px',
    background: '#fff',
    border: '1px solid #D8DAD0',
    borderRadius: '10px',
    fontSize: '11px',
    lineHeight: 1.45,
    color: '#6B7168',
    fontFamily: "'Poppins', sans-serif",
  },

  breakdownList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  groupBlock: {
    marginBottom: '4px',
  },

  groupLabel: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#A4AAA4',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    padding: '4px 0 6px',
    fontFamily: "'Poppins', sans-serif",
  },

  row: {
    display: 'grid',
    gridTemplateColumns: '12px 190px 90px 1fr auto',
    gap: '10px',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #EEEFE8',
  },

  rowDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },

  rowName: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#141514',
    fontFamily: "'Poppins', sans-serif",
  },

  rowCount: {
    fontSize: '11px',
    color: '#A4AAA4',
    fontFamily: "'Poppins', sans-serif",
  },

  rowBar: {
    height: '7px',
    background: '#EEEFE8',
    borderRadius: '4px',
    overflow: 'hidden',
  },

  rowFill: {
    height: '100%',
    borderRadius: '4px',
  },

  bbar: {
    flexShrink: 0,
    padding: '12px 28px',
    background: '#fff',
    borderTop: '1px solid #D8DAD0',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  },

  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: '8px',
  },

  emptyIcon: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#1F5330',
    fontFamily: "'Poppins', sans-serif",
  },

  emptyTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#A4AAA4',
    fontFamily: "'Poppins', sans-serif",
  },

  emptySub: {
    fontSize: '12px',
    color: '#C9CAC0',
    fontFamily: "'Poppins', sans-serif",
  },
};
