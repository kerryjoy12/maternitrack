import { useEffect, useRef, useState } from 'react';

export interface PartographDataPoint {
  hours_in_labour: number;
  cervical_dilation_cm: number | null;
  fetal_heart_rate: number | null;
  contractions_per_10min: number | null;
  descent_station: number | null;
}

interface PartographChartProps {
  entries: PartographDataPoint[];
}

const CHART_COLORS = {
  cervix:        '#2DD4BF',
  alert:         '#FBBF24',
  action:        '#F87171',
  fhr:           '#A78BFA',
  contractions:  '#34D399',
  descent:       '#60A5FA',
  grid:          'rgba(255,255,255,0.06)',
  axis:          'rgba(255,255,255,0.2)',
  label:         '#5E8AA8',
  bg:            '#0C1A2E',
  zoneGreen:     'rgba(34,197,94,0.07)',
  zoneAmber:     'rgba(251,191,36,0.08)',
  zoneRed:       'rgba(248,113,113,0.10)',
};

/**
 * PartographChart
 * ───────────────
 * WHO-standard partograph rendered with native Canvas API.
 * Features:
 *   - Green / Amber / Red labour zones between alert & action lines
 *   - Cervical dilation curve (teal) + Alert line (amber) + Action line (red)
 *   - Fetal Heart Rate subplot (purple) with normal range shading (110–160 bpm)
 *   - Contractions per 10 min bar (green)
 *   - Descent of presenting part (blue)
 *   - Hover tooltips on data points
 *   - Extended 24h X-axis for complete labour monitoring
 */
export default function PartographChart({ entries }: PartographChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; lines: string[];
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── Dimensions ────────────────────────────────────────────────────────
    const dpr = window.devicePixelRatio || 1;
    const W   = canvas.offsetWidth;
    const H   = canvas.offsetHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    // Layout: 4 rows
    const PAD_L = 56, PAD_R = 20, PAD_TOP = 24, PAD_BTM = 28;
    const chartW = W - PAD_L - PAD_R;
    const rows = [
      { label: 'Cervical Dilation (cm)', h: 0.45 },
      { label: 'FHR (bpm)',              h: 0.25 },
      { label: 'Contractions / 10 min', h: 0.16 },
      { label: 'Descent (station)',      h: 0.14 },
    ];
    const totalH = H - PAD_TOP - PAD_BTM;
    let curY = PAD_TOP;
    const rowRects = rows.map(r => {
      const h = totalH * r.h;
      const rect = { x: PAD_L, y: curY, w: chartW, h };
      curY += h;
      return { ...r, ...rect };
    });

    // ── Helpers ───────────────────────────────────────────────────────────
    const maxHours = 24; // Extended to full 24h WHO standard

    const xScale = (h: number) => PAD_L + (h / maxHours) * chartW;

    const yScale = (val: number, min: number, max: number, rect: typeof rowRects[0]) =>
      rect.y + rect.h - ((val - min) / (max - min)) * rect.h;

    const drawLine = (pts: [number, number][], color: string, width = 2, dash: number[] = []) => {
      if (pts.length < 1) return;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      pts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
      ctx.stroke();
      ctx.restore();
    };

    const drawDot = (x: number, y: number, color: string, r = 4) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = CHART_COLORS.bg;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    };

    // ── Background ────────────────────────────────────────────────────────
    ctx.fillStyle = CHART_COLORS.bg;
    ctx.fillRect(0, 0, W, H);

    // ── Draw each row ─────────────────────────────────────────────────────
    rowRects.forEach((row, ri) => {
      // Row background
      ctx.fillStyle = ri % 2 === 0 ? 'rgba(30,111,165,0.04)' : 'rgba(255,255,255,0.015)';
      ctx.fillRect(row.x, row.y, row.w, row.h);

      // Row border
      ctx.strokeStyle = CHART_COLORS.axis;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(row.x, row.y, row.w, row.h);

      // Row label
      ctx.save();
      ctx.fillStyle = CHART_COLORS.label;
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(row.label, PAD_L - 4, row.y + 12);
      ctx.restore();

      // Vertical grid lines (every 2 hours for 24h)
      for (let h = 0; h <= maxHours; h++) {
        const gx = xScale(h);
        const isMajor = h % 4 === 0;
        ctx.strokeStyle = isMajor ? CHART_COLORS.axis : CHART_COLORS.grid;
        ctx.lineWidth = isMajor ? 1 : 0.5;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(gx, row.y);
        ctx.lineTo(gx, row.y + row.h);
        ctx.stroke();

        // Hour labels (bottom row only, every 2 hours)
        if (ri === rowRects.length - 1 && h % 2 === 0) {
          ctx.fillStyle = CHART_COLORS.label;
          ctx.font = '9px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${h}h`, gx, H - 8);
        }
      }
    });

    // ── Row 0: Cervical Dilation ───────────────────────────────────────────
    const cervRow = rowRects[0];
    const CERV_MIN = 0, CERV_MAX = 10;

    // ── WHO Colour Zones ──────────────────────────────────────────────────
    // Alert line: starts at (4h, 4cm) slope 1cm/hr
    // Action line: 4 hours to the right of alert
    // Green zone: left of alert line
    // Amber zone: between alert and action lines
    // Red zone: right of action line
    ctx.save();
    ctx.beginPath();
    ctx.rect(cervRow.x, cervRow.y, cervRow.w, cervRow.h);
    ctx.clip();

    // Green zone (left of alert line)
    ctx.fillStyle = CHART_COLORS.zoneGreen;
    ctx.beginPath();
    ctx.moveTo(xScale(0), yScale(0, CERV_MIN, CERV_MAX, cervRow));
    ctx.lineTo(xScale(4), yScale(4, CERV_MIN, CERV_MAX, cervRow));
    ctx.lineTo(xScale(10), yScale(10, CERV_MIN, CERV_MAX, cervRow));
    ctx.lineTo(xScale(0), yScale(10, CERV_MIN, CERV_MAX, cervRow));
    ctx.closePath();
    ctx.fill();

    // Amber zone (between alert and action lines)
    ctx.fillStyle = CHART_COLORS.zoneAmber;
    ctx.beginPath();
    ctx.moveTo(xScale(4), yScale(4, CERV_MIN, CERV_MAX, cervRow));
    ctx.lineTo(xScale(10), yScale(10, CERV_MIN, CERV_MAX, cervRow));
    ctx.lineTo(xScale(14), yScale(10, CERV_MIN, CERV_MAX, cervRow));
    ctx.lineTo(xScale(8), yScale(4, CERV_MIN, CERV_MAX, cervRow));
    ctx.closePath();
    ctx.fill();

    // Red zone (right of action line)
    ctx.fillStyle = CHART_COLORS.zoneRed;
    ctx.beginPath();
    ctx.moveTo(xScale(8), yScale(4, CERV_MIN, CERV_MAX, cervRow));
    ctx.lineTo(xScale(14), yScale(10, CERV_MIN, CERV_MAX, cervRow));
    ctx.lineTo(xScale(maxHours), yScale(10, CERV_MIN, CERV_MAX, cervRow));
    ctx.lineTo(xScale(maxHours), yScale(4, CERV_MIN, CERV_MAX, cervRow));
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Horizontal grid lines at 1 cm intervals
    for (let c = 0; c <= 10; c++) {
      const gy = yScale(c, CERV_MIN, CERV_MAX, cervRow);
      ctx.strokeStyle = c % 2 === 0 ? CHART_COLORS.axis : CHART_COLORS.grid;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(PAD_L, gy);
      ctx.lineTo(PAD_L + chartW, gy);
      ctx.stroke();
      if (c % 2 === 0) {
        ctx.fillStyle = CHART_COLORS.label;
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${c}`, PAD_L - 4, gy + 3);
      }
    }

    // Alert line: starts at (4h, 4cm) slope 1cm/hr → (10h, 10cm)
    const alertPts: [number, number][] = [
      [xScale(4), yScale(4, CERV_MIN, CERV_MAX, cervRow)],
      [xScale(10), yScale(10, CERV_MIN, CERV_MAX, cervRow)],
    ];
    drawLine(alertPts, CHART_COLORS.alert, 2, [6, 4]);
    ctx.fillStyle = CHART_COLORS.alert;
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Alert', xScale(10) + 4, yScale(9.5, CERV_MIN, CERV_MAX, cervRow));

    // Action line: 4 hours to the right of alert line
    const actionPts: [number, number][] = [
      [xScale(8), yScale(4, CERV_MIN, CERV_MAX, cervRow)],
      [xScale(14), yScale(10, CERV_MIN, CERV_MAX, cervRow)],
    ];
    const clippedAction = actionPts.filter(([x]) => x <= PAD_L + chartW);
    if (clippedAction.length >= 2) {
      drawLine(clippedAction, CHART_COLORS.action, 2, [4, 4]);
    } else if (clippedAction.length === 1) {
      // Interpolate the second point to the chart edge
      const endX = PAD_L + chartW;
      const endHour = (endX - PAD_L) / chartW * maxHours;
      const endDil = 4 + (endHour - 8);
      drawLine([
        clippedAction[0],
        [endX, yScale(Math.min(endDil, 10), CERV_MIN, CERV_MAX, cervRow)],
      ], CHART_COLORS.action, 2, [4, 4]);
    }
    ctx.fillStyle = CHART_COLORS.action;
    ctx.font = 'bold 9px Inter, sans-serif';
    const actionLabelX = Math.min(xScale(14) + 4, PAD_L + chartW - 30);
    ctx.fillText('Action', actionLabelX, yScale(9.5, CERV_MIN, CERV_MAX, cervRow));

    // Zone labels
    ctx.font = '8px Inter, sans-serif';
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#22c55e';
    ctx.textAlign = 'center';
    ctx.fillText('NORMAL', xScale(2), yScale(8, CERV_MIN, CERV_MAX, cervRow));
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('CAUTION', xScale(9), yScale(8, CERV_MIN, CERV_MAX, cervRow));
    ctx.fillStyle = '#ef4444';
    ctx.fillText('EMERGENCY', xScale(16), yScale(6, CERV_MIN, CERV_MAX, cervRow));
    ctx.globalAlpha = 1;

    // Actual cervical dilation curve
    const cervPts = entries
      .filter(e => e.cervical_dilation_cm !== null)
      .map(e => [xScale(e.hours_in_labour), yScale(e.cervical_dilation_cm!, CERV_MIN, CERV_MAX, cervRow)] as [number, number]);
    drawLine(cervPts, CHART_COLORS.cervix, 2.5);

    // Color data points red if they fall right of action line
    entries
      .filter(e => e.cervical_dilation_cm !== null)
      .forEach(e => {
        const px = xScale(e.hours_in_labour);
        const py = yScale(e.cervical_dilation_cm!, CERV_MIN, CERV_MAX, cervRow);
        const h = e.hours_in_labour;
        const d = e.cervical_dilation_cm!;

        // Determine zone: action line expected dilation = h - 4 (for h >= 8)
        let dotColor = CHART_COLORS.cervix;
        if (h >= 8 && d < (h - 4)) {
          dotColor = CHART_COLORS.action; // Emergency — right of action line
        } else if (h >= 4 && d < h) {
          dotColor = CHART_COLORS.alert;  // Caution — behind alert line
        }
        drawDot(px, py, dotColor, 5);
      });

    // ── Row 1: Fetal Heart Rate ────────────────────────────────────────────
    const fhrRow = rowRects[1];
    const FHR_MIN = 100, FHR_MAX = 180;

    // Normal FHR range shading (110–160)
    const normTop = yScale(160, FHR_MIN, FHR_MAX, fhrRow);
    const normBot = yScale(110, FHR_MIN, FHR_MAX, fhrRow);
    ctx.fillStyle = 'rgba(167,139,250,0.06)';
    ctx.fillRect(PAD_L, normTop, chartW, normBot - normTop);

    // Y labels
    [110, 120, 130, 140, 150, 160].forEach(v => {
      const gy = yScale(v, FHR_MIN, FHR_MAX, fhrRow);
      ctx.strokeStyle = CHART_COLORS.grid;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(PAD_L, gy); ctx.lineTo(PAD_L + chartW, gy); ctx.stroke();
      ctx.fillStyle = CHART_COLORS.label;
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${v}`, PAD_L - 4, gy + 3);
    });

    // Normal range boundary lines (dashed)
    [110, 160].forEach(v => {
      const gy = yScale(v, FHR_MIN, FHR_MAX, fhrRow);
      ctx.strokeStyle = v === 110 ? CHART_COLORS.action : CHART_COLORS.action;
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(PAD_L, gy); ctx.lineTo(PAD_L + chartW, gy); ctx.stroke();
      ctx.setLineDash([]);
    });

    const fhrPts = entries
      .filter(e => e.fetal_heart_rate !== null)
      .map(e => [xScale(e.hours_in_labour), yScale(e.fetal_heart_rate!, FHR_MIN, FHR_MAX, fhrRow)] as [number, number]);
    drawLine(fhrPts, CHART_COLORS.fhr, 2);

    // Color abnormal FHR dots red
    entries
      .filter(e => e.fetal_heart_rate !== null)
      .forEach(e => {
        const px = xScale(e.hours_in_labour);
        const py = yScale(e.fetal_heart_rate!, FHR_MIN, FHR_MAX, fhrRow);
        const abnormal = e.fetal_heart_rate! < 110 || e.fetal_heart_rate! > 160;
        drawDot(px, py, abnormal ? CHART_COLORS.action : CHART_COLORS.fhr, abnormal ? 6 : 4);
      });

    // ── Row 2: Contractions ────────────────────────────────────────────────
    const conRow = rowRects[2];
    const CON_MAX = 5;
    const barW = Math.max(8, chartW / (maxHours * 4));

    entries.filter(e => e.contractions_per_10min !== null).forEach(e => {
      const bx = xScale(e.hours_in_labour) - barW / 2;
      const bh = (e.contractions_per_10min! / CON_MAX) * conRow.h;
      const by = conRow.y + conRow.h - bh;
      ctx.fillStyle = 'rgba(52,211,153,0.3)';
      ctx.fillRect(bx, by, barW, bh);
      ctx.strokeStyle = CHART_COLORS.contractions;
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.strokeRect(bx, by, barW, bh);
      ctx.fillStyle = CHART_COLORS.contractions;
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${e.contractions_per_10min}`, bx + barW / 2, by - 2);
    });

    for (let c = 0; c <= CON_MAX; c++) {
      const gy = conRow.y + conRow.h - (c / CON_MAX) * conRow.h;
      ctx.fillStyle = CHART_COLORS.label;
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${c}`, PAD_L - 4, gy + 3);
    }

    // ── Row 3: Descent ─────────────────────────────────────────────────────
    const desRow = rowRects[3];
    const DES_MIN = -5, DES_MAX = 5;

    const zeroY = yScale(0, DES_MIN, DES_MAX, desRow);
    ctx.strokeStyle = CHART_COLORS.axis;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(PAD_L, zeroY); ctx.lineTo(PAD_L + chartW, zeroY); ctx.stroke();
    ctx.setLineDash([]);

    const desPts = entries
      .filter(e => e.descent_station !== null)
      .map(e => [xScale(e.hours_in_labour), yScale(e.descent_station!, DES_MIN, DES_MAX, desRow)] as [number, number]);
    drawLine(desPts, CHART_COLORS.descent, 2);
    desPts.forEach(([x, y]) => drawDot(x, y, CHART_COLORS.descent, 4));

    [DES_MIN, 0, DES_MAX].forEach(v => {
      ctx.fillStyle = CHART_COLORS.label;
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${v > 0 ? '+' : ''}${v}`, PAD_L - 4, yScale(v, DES_MIN, DES_MAX, desRow) + 3);
    });

    // ── Legend ─────────────────────────────────────────────────────────────
    const legends = [
      { label: 'Dilation', color: CHART_COLORS.cervix },
      { label: 'Alert Line', color: CHART_COLORS.alert },
      { label: 'Action Line', color: CHART_COLORS.action },
      { label: 'FHR', color: CHART_COLORS.fhr },
      { label: 'Contractions', color: CHART_COLORS.contractions },
      { label: 'Descent', color: CHART_COLORS.descent },
    ];
    let lx = PAD_L;
    legends.forEach(l => {
      ctx.fillStyle = l.color;
      ctx.fillRect(lx, 6, 16, 5);
      ctx.fillStyle = CHART_COLORS.label;
      ctx.font = '8px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(l.label, lx + 20, 12);
      lx += ctx.measureText(l.label).width + 34;
    });

    // ── Store hit targets for tooltip ─────────────────────────────────────
    const hitTargets: { x: number; y: number; r: number; lines: string[] }[] = [];
    entries.forEach(e => {
      if (e.cervical_dilation_cm !== null) {
        hitTargets.push({
          x: xScale(e.hours_in_labour),
          y: yScale(e.cervical_dilation_cm, CERV_MIN, CERV_MAX, cervRow),
          r: 8,
          lines: [
            `⏱ ${e.hours_in_labour}h`,
            `Dilation: ${e.cervical_dilation_cm} cm`,
            e.fetal_heart_rate != null ? `FHR: ${e.fetal_heart_rate} bpm` : '',
            e.contractions_per_10min != null ? `Contrax: ${e.contractions_per_10min}/10m` : '',
            e.descent_station != null ? `Station: ${e.descent_station > 0 ? '+' : ''}${e.descent_station}` : '',
          ].filter(Boolean),
        });
      }
    });

    // Attach hit targets to canvas for mouse handler
    (canvas as any).__hitTargets = hitTargets;
  }, [entries]);

  // ── Mouse tooltip handler ───────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMove = (ev: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = ev.clientX - rect.left;
      const my = ev.clientY - rect.top;
      const targets = (canvas as any).__hitTargets as { x: number; y: number; r: number; lines: string[] }[] | undefined;
      if (!targets) return;

      for (const t of targets) {
        const dx = mx - t.x;
        const dy = my - t.y;
        if (dx * dx + dy * dy <= t.r * t.r * 4) {
          setTooltip({ x: t.x, y: t.y, lines: t.lines });
          return;
        }
      }
      setTooltip(null);
    };

    const handleLeave = () => setTooltip(null);

    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseleave', handleLeave);
    return () => {
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseleave', handleLeave);
    };
  }, [entries]);

  return (
    <div className="partograph-canvas-wrap" style={{ position: 'relative' }}>
      <canvas ref={canvasRef} className="partograph-canvas" />
      {tooltip && (
        <div
          className="partograph-tooltip"
          style={{
            position: 'absolute',
            left: tooltip.x + 12,
            top: tooltip.y - 10,
            background: 'rgba(12,26,46,0.95)',
            border: '1px solid rgba(45,212,191,0.3)',
            borderRadius: 6,
            padding: '8px 12px',
            fontSize: '0.78rem',
            color: '#e2e8f0',
            pointerEvents: 'none',
            zIndex: 10,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          {tooltip.lines.map((line, i) => (
            <div key={i} style={{ lineHeight: 1.5 }}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}
