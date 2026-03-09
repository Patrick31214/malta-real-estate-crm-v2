import React, { useState, useMemo, useCallback } from 'react';

// ── Calculation helpers ─────────────────────────────────────────────────────

function calcMortgage(principal, annualRate, termYears) {
  if (principal <= 0 || annualRate < 0 || termYears <= 0) {
    return { monthly: 0, totalPaid: 0, totalInterest: 0 };
  }
  if (annualRate === 0) {
    const monthly = principal / (termYears * 12);
    return { monthly, totalPaid: principal, totalInterest: 0 };
  }
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  const monthly = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalPaid = monthly * n;
  const totalInterest = totalPaid - principal;
  return { monthly, totalPaid, totalInterest };
}

function buildAmortization(principal, annualRate, termYears) {
  const n = termYears * 12;
  const schedule = [];
  if (annualRate === 0) {
    const monthly = principal / n;
    let balance = principal;
    for (let i = 1; i <= n; i++) {
      balance -= monthly;
      schedule.push({ month: i, payment: monthly, principal: monthly, interest: 0, balance: Math.max(0, balance) });
    }
    return schedule;
  }
  const r = annualRate / 100 / 12;
  const monthly = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  let balance = principal;
  for (let i = 1; i <= n; i++) {
    const interest = balance * r;
    const principalPaid = monthly - interest;
    balance -= principalPaid;
    schedule.push({
      month: i,
      payment: monthly,
      principal: principalPaid,
      interest,
      balance: Math.max(0, balance),
    });
  }
  return schedule;
}

function calcStampDuty(price, isFirstTimeBuyer, isGozo) {
  if (isGozo) return price * 0.02;
  if (isFirstTimeBuyer) {
    const firstSlice = Math.min(price, 200000);
    const remaining = Math.max(0, price - 200000);
    return firstSlice * 0.035 + remaining * 0.05;
  }
  return price * 0.05;
}

const fmt = (n) =>
  '€ ' + (isNaN(n) ? '0' : Math.round(n)).toLocaleString('en-MT');

const fmtFull = (n) =>
  '€ ' + (isNaN(n) ? '0.00' : n.toLocaleString('en-MT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

const fmtPct = (n) => (isNaN(n) ? '0.00' : n.toFixed(2)) + '%';

// ── Style constants ─────────────────────────────────────────────────────────

const pageWrap = {
  padding: 'var(--space-6)',
  maxWidth: '1280px',
  margin: '0 auto',
  fontFamily: 'var(--font-body)',
  color: 'var(--color-text-primary)',
};

const card = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(212,175,55,0.15)',
  borderRadius: '16px',
  padding: 'var(--space-6)',
  marginBottom: 'var(--space-6)',
};

const sectionTitle = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-accent-gold)',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  marginBottom: 'var(--space-4)',
};

const lbl = {
  display: 'block',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-medium)',
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-wide)',
  marginBottom: 'var(--space-1)',
};

const inp = {
  padding: 'var(--space-2) var(--space-3)',
  borderRadius: '8px',
  border: '1px solid rgba(212,175,55,0.2)',
  background: 'rgba(255,255,255,0.06)',
  color: 'var(--color-text-primary)',
  fontSize: 'var(--text-sm)',
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const goldBtn = {
  padding: 'var(--space-3) var(--space-6)',
  borderRadius: '8px',
  border: '1px solid var(--color-accent-gold)',
  background: 'var(--color-accent-gold)',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)',
  boxShadow: 'var(--shadow-gold-sm)',
  transition: 'all 0.2s',
};

const ghostBtn = (active) => ({
  padding: 'var(--space-1) var(--space-3)',
  borderRadius: '6px',
  border: `1px solid ${active ? 'var(--color-accent-gold)' : 'rgba(212,175,55,0.2)'}`,
  background: active ? 'rgba(212,175,55,0.15)' : 'transparent',
  color: active ? 'var(--color-accent-gold)' : 'var(--color-text-muted)',
  cursor: 'pointer',
  fontSize: 'var(--text-xs)',
  fontWeight: active ? 'var(--font-semibold)' : 'var(--font-normal)',
  transition: 'all 0.15s',
});

const thStyle = {
  padding: 'var(--space-2) var(--space-3)',
  textAlign: 'left',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '1px solid rgba(212,175,55,0.15)',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: 'var(--space-2) var(--space-3)',
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-secondary)',
  borderBottom: '1px solid rgba(212,175,55,0.07)',
};

// ── Sub-components ──────────────────────────────────────────────────────────

const ResultCard = ({ icon, label, value, highlight }) => (
  <div style={{
    background: highlight ? 'rgba(212,175,55,0.10)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${highlight ? 'rgba(212,175,55,0.40)' : 'rgba(212,175,55,0.12)'}`,
    borderRadius: '12px',
    padding: 'var(--space-4)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
    </div>
    <div style={{
      fontSize: highlight ? 'var(--text-2xl)' : 'var(--text-xl)',
      fontWeight: 'var(--font-bold)',
      color: highlight ? 'var(--color-accent-gold)' : 'var(--color-text-primary)',
      fontFamily: 'var(--font-heading)',
    }}>{value}</div>
  </div>
);

const FormField = ({ label, children }) => (
  <div style={{ marginBottom: 'var(--space-4)' }}>
    <label style={lbl}>{label}</label>
    {children}
  </div>
);

const RatePreset = ({ rate, current, onClick }) => (
  <button
    onClick={() => onClick(rate)}
    style={ghostBtn(String(current) === String(rate))}
  >
    {rate}%
  </button>
);

// ── Amortization Chart (CSS bars) ────────────────────────────────────────────

const AmortChart = ({ schedule }) => {
  const yearlyData = useMemo(() => {
    const byYear = [];
    for (let y = 0; y < Math.ceil(schedule.length / 12); y++) {
      const slice = schedule.slice(y * 12, y * 12 + 12);
      byYear.push({
        year: y + 1,
        principal: slice.reduce((s, r) => s + r.principal, 0),
        interest: slice.reduce((s, r) => s + r.interest, 0),
      });
    }
    return byYear;
  }, [schedule]);

  const maxVal = useMemo(() => Math.max(...yearlyData.map(d => d.principal + d.interest)), [yearlyData]);

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '120px', minWidth: `${yearlyData.length * 28}px` }}>
        {yearlyData.map((d) => {
          const total = d.principal + d.interest;
          const pPct = (d.principal / total) * 100;
          const iPct = (d.interest / total) * 100;
          const heightPct = (total / maxVal) * 100;
          return (
            <div key={d.year} title={`Year ${d.year}: Principal €${Math.round(d.principal).toLocaleString()}, Interest €${Math.round(d.interest).toLocaleString()}`}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', cursor: 'default' }}>
              <div style={{ height: `${heightPct}%`, display: 'flex', flexDirection: 'column', borderRadius: '3px 3px 0 0', overflow: 'hidden' }}>
                <div style={{ height: `${iPct}%`, background: 'rgba(168,92,92,0.55)' }} />
                <div style={{ height: `${pPct}%`, background: 'rgba(212,175,55,0.65)' }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '4px', marginTop: '4px', overflowX: 'hidden' }}>
        {yearlyData.map(d => (
          <div key={d.year} style={{ flex: 1, textAlign: 'center', fontSize: '9px', color: 'var(--color-text-muted)' }}>{d.year}</div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 10, height: 10, background: 'rgba(212,175,55,0.65)', borderRadius: 2, display: 'inline-block' }} /> Principal
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 10, height: 10, background: 'rgba(168,92,92,0.55)', borderRadius: 2, display: 'inline-block' }} /> Interest
        </span>
      </div>
    </div>
  );
};

// ── Scenario comparison ──────────────────────────────────────────────────────

const defaultScenario = () => ({ price: '', downPct: '20', rate: '3.5', term: '25' });

const ScenarioCol = ({ idx, s, onChange, onRemove, canRemove, isBest }) => {
  const price = parseFloat(s.price) || 0;
  const dp = price * (parseFloat(s.downPct) / 100);
  const principal = price - dp;
  const { monthly, totalPaid, totalInterest } = calcMortgage(principal, parseFloat(s.rate) || 0, parseInt(s.term) || 25);
  const ltv = price > 0 ? (principal / price) * 100 : 0;

  return (
    <div style={{
      flex: 1,
      minWidth: '220px',
      background: isBest ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${isBest ? 'rgba(212,175,55,0.45)' : 'rgba(212,175,55,0.12)'}`,
      borderRadius: '12px',
      padding: 'var(--space-4)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Scenario {idx + 1}
        </span>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {isBest && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent-gold)', fontWeight: 'var(--font-semibold)' }}>★ Best</span>}
          {canRemove && (
            <button onClick={onRemove} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>✕</button>
          )}
        </div>
      </div>
      {[
        { key: 'price', label: 'Property Price (€)', type: 'number', placeholder: '350000' },
        { key: 'downPct', label: 'Down Payment (%)', type: 'number', placeholder: '20' },
        { key: 'rate', label: 'Interest Rate (%)', type: 'number', placeholder: '3.5', step: '0.1' },
        { key: 'term', label: 'Term (Years)', type: 'number', placeholder: '25' },
      ].map(f => (
        <div key={f.key} style={{ marginBottom: 'var(--space-2)' }}>
          <label style={{ ...lbl, marginBottom: '2px' }}>{f.label}</label>
          <input type={f.type} value={s[f.key]} step={f.step || '1'}
            onChange={e => onChange({ ...s, [f.key]: e.target.value })}
            placeholder={f.placeholder}
            style={{ ...inp, padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--text-xs)' }} />
        </div>
      ))}
      <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid rgba(212,175,55,0.12)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Monthly</span>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', color: 'var(--color-accent-gold)' }}>{fmtFull(monthly)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Total Interest</span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{fmt(totalInterest)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Total Paid</span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{fmt(totalPaid)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>LTV</span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{fmtPct(ltv)}</span>
        </div>
      </div>
    </div>
  );
};

// ── Main page ────────────────────────────────────────────────────────────────

const CrmMortgageCalculatorPage = () => {
  // ── Main calculator state ──────────────────────────────────────────────────
  const [price, setPrice] = useState('350000');
  const [downAmt, setDownAmt] = useState('');
  const [downPct, setDownPct] = useState('20');
  const [downMode, setDownMode] = useState('pct'); // 'pct' | 'amt'
  const [term, setTerm] = useState('25');
  const [rate, setRate] = useState('3.5');

  // Malta costs
  const [isFirstTimeBuyer, setIsFirstTimeBuyer] = useState(false);
  const [isGozo, setIsGozo] = useState(false);

  // Amortization
  const [showFullAmort, setShowFullAmort] = useState(false);

  // Scenario comparison
  const [scenarios, setScenarios] = useState([defaultScenario(), defaultScenario()]);

  // Affordability
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [monthlyExpenses, setMonthlyExpenses] = useState('');

  // ── Derived values ─────────────────────────────────────────────────────────
  const numPrice = parseFloat(price) || 0;
  const numRate = parseFloat(rate) || 0;
  const numTerm = parseInt(term) || 25;

  const downPayment = useMemo(() => {
    if (downMode === 'pct') return numPrice * ((parseFloat(downPct) || 0) / 100);
    return parseFloat(downAmt) || 0;
  }, [downMode, numPrice, downPct, downAmt]);

  const downPctDerived = numPrice > 0 ? (downPayment / numPrice) * 100 : 0;
  const principal = Math.max(0, numPrice - downPayment);
  const ltv = numPrice > 0 ? (principal / numPrice) * 100 : 0;

  const { monthly, totalPaid, totalInterest } = useMemo(
    () => calcMortgage(principal, numRate, numTerm),
    [principal, numRate, numTerm]
  );

  const amortSchedule = useMemo(
    () => (principal > 0 && numRate >= 0 && numTerm > 0 ? buildAmortization(principal, numRate, numTerm) : []),
    [principal, numRate, numTerm]
  );

  const stampDuty = useMemo(() => calcStampDuty(numPrice, isFirstTimeBuyer, isGozo), [numPrice, isFirstTimeBuyer, isGozo]);
  const notaryFees = numPrice * 0.015;
  const peritFees = numPrice * 0.005;
  const totalAcquisitionCost = numPrice + stampDuty + notaryFees + peritFees;

  // Affordability
  const numIncome = parseFloat(monthlyIncome) || 0;
  const numExpenses = parseFloat(monthlyExpenses) || 0;
  const annualIncome = numIncome * 12;
  const suggestedMax = annualIncome * 3.5;
  const disposable = numIncome - numExpenses;
  const dti = numIncome > 0 ? (monthly / numIncome) * 100 : 0;
  const affordableMonthly = disposable * 0.4;

  // Scenarios
  const scenarioTotals = scenarios.map(s => {
    const p = parseFloat(s.price) || 0;
    const dp = p * ((parseFloat(s.downPct) || 0) / 100);
    const { totalPaid } = calcMortgage(p - dp, parseFloat(s.rate) || 0, parseInt(s.term) || 25);
    return totalPaid;
  });
  const bestScenarioIdx = scenarioTotals.some(v => v > 0)
    ? scenarioTotals.reduce((best, v, i) => (v > 0 && (best === -1 || v < scenarioTotals[best]) ? i : best), -1)
    : -1;

  const handleDownAmt = (val) => {
    setDownAmt(val);
    setDownMode('amt');
    if (numPrice > 0) setDownPct(((parseFloat(val) || 0) / numPrice * 100).toFixed(1));
  };
  const handleDownPct = (val) => {
    setDownPct(val);
    setDownMode('pct');
    if (numPrice > 0) setDownAmt((numPrice * ((parseFloat(val) || 0) / 100)).toFixed(0));
  };
  const handlePrice = (val) => {
    setPrice(val);
    const p = parseFloat(val) || 0;
    if (downMode === 'pct') setDownAmt((p * ((parseFloat(downPct) || 0) / 100)).toFixed(0));
    else setDownPct(p > 0 ? ((parseFloat(downAmt) || 0) / p * 100).toFixed(1) : '0');
  };

  const amortDisplay = showFullAmort ? amortSchedule : amortSchedule.slice(0, 12);
  const RATE_PRESETS = [3.0, 3.5, 4.0, 4.5, 5.0];

  return (
    <div style={pageWrap}>
      {/* ── Page header ── */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-text-primary)', margin: 0 }}>
          Mortgage Calculator
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
          Calculate mortgage payments, Malta acquisition costs, and compare financing scenarios.
        </p>
      </div>

      {/* ── Main calculator + Results ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>

        {/* Inputs card */}
        <div style={{ ...card, margin: 0 }}>
          <div style={sectionTitle}>📊 Loan Parameters</div>

          <FormField label="Property Price (€)">
            <input type="number" min="0" step="1000" value={price} onChange={e => handlePrice(e.target.value)} style={inp} placeholder="350000" />
          </FormField>

          <FormField label="Down Payment">
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
              <button onClick={() => { setDownMode('pct'); }} style={ghostBtn(downMode === 'pct')}>%</button>
              <button onClick={() => { setDownMode('amt'); }} style={ghostBtn(downMode === 'amt')}>€ Amount</button>
            </div>
            {downMode === 'pct' ? (
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <input type="number" min="0" max="100" step="0.5" value={downPct} onChange={e => handleDownPct(e.target.value)} style={{ ...inp, flex: 1 }} placeholder="20" />
                <span style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>= {fmt(downPayment)}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <input type="number" min="0" step="1000" value={downAmt} onChange={e => handleDownAmt(e.target.value)} style={{ ...inp, flex: 1 }} placeholder="70000" />
                <span style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>= {fmtPct(downPctDerived)}</span>
              </div>
            )}
          </FormField>

          <FormField label="Annual Interest Rate (%)">
            <input type="number" min="0" max="30" step="0.1" value={rate} onChange={e => setRate(e.target.value)} style={{ ...inp, marginBottom: 'var(--space-2)' }} placeholder="3.5" />
            <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
              {RATE_PRESETS.map(r => <RatePreset key={r} rate={r} current={rate} onClick={v => setRate(String(v))} />)}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>Malta bank rate presets</div>
          </FormField>

          <FormField label={`Loan Term: ${term} years`}>
            <input type="range" min="5" max="40" step="1" value={term} onChange={e => setTerm(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--color-accent-gold)', cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              <span>5 yrs</span><span>40 yrs</span>
            </div>
          </FormField>
        </div>

        {/* Results card */}
        <div style={{ ...card, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={sectionTitle}>💰 Results</div>
          <ResultCard icon="🏠" label="Monthly Payment" value={fmtFull(monthly)} highlight />
          <ResultCard icon="📈" label="Total Interest Paid" value={fmt(totalInterest)} />
          <ResultCard icon="💳" label="Total Amount Paid" value={fmt(totalPaid)} />
          <ResultCard icon="📊" label="Loan-to-Value (LTV)" value={`${fmtPct(ltv)} (principal ${fmt(principal)})`} />
        </div>
      </div>

      {/* ── Malta-specific costs ── */}
      <div style={card}>
        <div style={sectionTitle}>🇲🇹 Malta Acquisition Costs</div>
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            <input type="checkbox" checked={isFirstTimeBuyer} onChange={e => setIsFirstTimeBuyer(e.target.checked)}
              style={{ accentColor: 'var(--color-accent-gold)', width: 14, height: 14 }} />
            First-Time Buyer
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            <input type="checkbox" checked={isGozo} onChange={e => setIsGozo(e.target.checked)}
              style={{ accentColor: 'var(--color-accent-gold)', width: 14, height: 14 }} />
            Gozo Property (2% rate)
          </label>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
            <thead>
              <tr>
                <th style={thStyle}>Cost Item</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Rate</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Estimated Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}>
                  <strong style={{ color: 'var(--color-text-primary)' }}>Stamp Duty</strong>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {isGozo ? '2% (Gozo)' : isFirstTimeBuyer ? '3.5% on first €200k, 5% remainder' : '5% standard rate'}
                  </div>
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{isGozo ? '2%' : isFirstTimeBuyer ? '3.5–5%' : '5%'}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)' }}>{fmt(stampDuty)}</td>
              </tr>
              <tr>
                <td style={tdStyle}>
                  <strong style={{ color: 'var(--color-text-primary)' }}>Notary Fees</strong>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Legal conveyancing, contract drafting</div>
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>~1.5%</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)' }}>{fmt(notaryFees)}</td>
              </tr>
              <tr>
                <td style={tdStyle}>
                  <strong style={{ color: 'var(--color-text-primary)' }}>Architect / Perit Fees</strong>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Property survey and AIP assessment</div>
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>~0.5%</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)' }}>{fmt(peritFees)}</td>
              </tr>
              <tr>
                <td style={{ ...tdStyle, paddingTop: 'var(--space-3)', borderBottom: 'none' }}>
                  <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--color-accent-gold)' }}>Total Acquisition Cost</strong>
                </td>
                <td style={{ ...tdStyle, borderBottom: 'none' }} />
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 'var(--font-bold)', color: 'var(--color-accent-gold)', fontSize: 'var(--text-base)', borderBottom: 'none' }}>{fmt(totalAcquisitionCost)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-3)', fontStyle: 'italic' }}>
          * Ground rent (if applicable) is typically €100–€500/year. Figures are estimates; consult a Malta notary for exact costs.
        </div>
      </div>

      {/* ── Amortization schedule ── */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <div style={sectionTitle}>📅 Amortization Schedule</div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button onClick={() => setShowFullAmort(v => !v)} style={ghostBtn(showFullAmort)}>
              {showFullAmort ? 'Show First 12 Months' : `Show All ${amortSchedule.length} Months`}
            </button>
          </div>
        </div>

        {amortSchedule.length > 0 ? (
          <>
            <div style={{ marginBottom: 'var(--space-5)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Principal vs Interest by Year
              </div>
              <AmortChart schedule={amortSchedule} />
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 540 }}>
                <thead>
                  <tr>
                    {['Month', 'Payment', 'Principal', 'Interest', 'Balance'].map(h => (
                      <th key={h} style={{ ...thStyle, textAlign: h === 'Month' ? 'left' : 'right' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {amortDisplay.map(row => (
                    <tr key={row.month} style={{ transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={tdStyle}>{row.month}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtFull(row.payment)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--color-accent-gold)' }}>{fmtFull(row.principal)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: '#A85C5C' }}>{fmtFull(row.interest)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!showFullAmort && amortSchedule.length > 12 && (
              <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
                <button onClick={() => setShowFullAmort(true)} style={ghostBtn(false)}>
                  + Show remaining {amortSchedule.length - 12} months
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            Enter loan parameters above to generate the amortization schedule.
          </div>
        )}
      </div>

      {/* ── Scenario comparison ── */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <div style={sectionTitle}>⚖️ Scenario Comparison</div>
          {scenarios.length < 3 && (
            <button onClick={() => setScenarios(s => [...s, defaultScenario()])} style={ghostBtn(false)}>
              + Add Scenario
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          {scenarios.map((s, i) => (
            <ScenarioCol
              key={i}
              idx={i}
              s={s}
              onChange={val => setScenarios(arr => arr.map((x, j) => j === i ? val : x))}
              onRemove={() => setScenarios(arr => arr.filter((_, j) => j !== i))}
              canRemove={scenarios.length > 1}
              isBest={bestScenarioIdx !== -1 && i === bestScenarioIdx}
            />
          ))}
        </div>
      </div>

      {/* ── Affordability calculator ── */}
      <div style={card}>
        <div style={sectionTitle}>🏦 Affordability Calculator</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
          <FormField label="Monthly Gross Income (€)">
            <input type="number" min="0" step="100" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} style={inp} placeholder="4000" />
          </FormField>
          <FormField label="Monthly Expenses (€)">
            <input type="number" min="0" step="100" value={monthlyExpenses} onChange={e => setMonthlyExpenses(e.target.value)} style={inp} placeholder="1500" />
          </FormField>
        </div>
        {numIncome > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
            <ResultCard icon="🏠" label="Suggested Max Property Price" value={fmt(suggestedMax)} />
            <ResultCard icon="💸" label="Max Affordable Monthly Payment" value={fmtFull(affordableMonthly)} />
            {monthly > 0 ? (
            <div style={{
              background: dti > 40 ? 'rgba(168,92,92,0.12)' : 'rgba(107,143,107,0.10)',
              border: `1px solid ${dti > 40 ? 'rgba(168,92,92,0.35)' : 'rgba(107,143,107,0.30)'}`,
              borderRadius: '12px',
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ fontSize: '1.2rem' }}>{dti > 40 ? '⚠️' : '✅'}</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Debt-to-Income Ratio</span>
              </div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: dti > 40 ? '#A85C5C' : 'var(--color-success)', fontFamily: 'var(--font-heading)' }}>
                {fmtPct(dti)}
              </div>
              {dti > 40 && (
                <div style={{ fontSize: 'var(--text-xs)', color: '#A85C5C' }}>
                  ⚠️ DTI exceeds 40% — Malta lenders may decline this loan.
                </div>
              )}
            </div>
            ) : null}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(212,175,55,0.12)',
              borderRadius: '12px',
              padding: 'var(--space-4)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              lineHeight: '1.7',
            }}>
              <strong style={{ color: 'var(--color-text-secondary)', display: 'block', marginBottom: 'var(--space-2)' }}>Malta Lending Criteria</strong>
              <div>• Maximum loan: <strong>3.5× annual income</strong></div>
              <div>• Max repayment age: typically <strong>65</strong></div>
              <div>• Max DTI ratio: <strong>40%</strong> of gross income</div>
              <div>• Min deposit: <strong>10%</strong> (first-time buyer may vary)</div>
            </div>
          </div>
        )}
        {numIncome === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            Enter your monthly income above to see affordability estimates.
          </div>
        )}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .crm-sidebar, .crm-header { display: none !important; }
          body { background: #fff !important; color: #000 !important; }
        }
      `}</style>
    </div>
  );
};

export default CrmMortgageCalculatorPage;
