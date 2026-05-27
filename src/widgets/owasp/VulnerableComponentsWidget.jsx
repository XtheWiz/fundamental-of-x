import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// A06 — Vulnerable & Outdated Components
//
// The pedagogical bet: a single stale transitive can punch a hole through
// the whole app. Learners scrub through historical versions of four direct
// deps and watch the CVE list, the total risk score, and the dependency
// tree colours respond in real time. "Bump all to latest" wipes the list
// to drive home that the fix is often free, you just have to do it.
//
// Strictly educational — every CVE, CVSS score, and "fixed-in" version is
// fabricated. No real exploit code, no working PoCs, no advisory links.

// ---------------------------------------------------------------------------
// Fake package universe — direct deps + their available versions (oldest →
// newest). The pickers below render in this exact order.
// ---------------------------------------------------------------------------

const PACKAGES = [
  {
    key: 'lodash',
    name: 'lodash',
    versions: ['4.17.5', '4.17.11', '4.17.20', '4.17.21'],
    transitives: ['lodash._baseiteratee', 'lodash._root'],
  },
  {
    key: 'express',
    name: 'express',
    versions: ['4.16.0', '4.17.1', '4.18.2'],
    transitives: ['body-parser', 'qs', 'cookie'],
  },
  {
    key: 'log4j',
    name: 'log4j-core',
    versions: ['2.14.0', '2.15.0', '2.16.0', '2.17.1'],
    transitives: ['log4j-api'],
  },
  {
    key: 'jackson',
    name: 'jackson-databind',
    versions: ['2.9.8', '2.10.5', '2.13.4', '2.15.3'],
    transitives: ['jackson-core', 'jackson-annotations'],
  },
  {
    key: 'springcore',
    name: 'spring-core',
    versions: ['5.2.0', '5.3.18', '5.3.30', '6.1.2'],
    transitives: ['spring-jcl'],
  },
];

// The "latest" pick for each package — used by Bump-all and to render the
// "fixed in" cell when no later version exists.
const LATEST = Object.fromEntries(
  PACKAGES.map((p) => [p.key, p.versions[p.versions.length - 1]]),
);

// ---------------------------------------------------------------------------
// Fake CVE database — keyed by package+version pairs that are still
// vulnerable. A version not listed is considered "clean". `fixedIn` points
// at the first version in PACKAGES that drops the issue, so the lesson
// about "bump and move on" actually lines up with the picker options.
// ---------------------------------------------------------------------------

const CVES = {
  lodash: {
    '4.17.5': [
      { id: 'CVE-FAKE-2018-1011', severity: 7.4, exploit: true,  fixedIn: '4.17.11', desc: 'Prototype pollution via merge/defaultsDeep on attacker-controlled JSON.' },
      { id: 'CVE-FAKE-2019-1023', severity: 5.6, exploit: false, fixedIn: '4.17.20', desc: 'ReDoS in template() when fed crafted format strings.' },
      { id: 'CVE-FAKE-2020-1029', severity: 7.1, exploit: true,  fixedIn: '4.17.21', desc: 'Command injection in template helper when used as a CLI shim.' },
    ],
    '4.17.11': [
      { id: 'CVE-FAKE-2019-1023', severity: 5.6, exploit: false, fixedIn: '4.17.20', desc: 'ReDoS in template() when fed crafted format strings.' },
      { id: 'CVE-FAKE-2020-1029', severity: 7.1, exploit: true,  fixedIn: '4.17.21', desc: 'Command injection in template helper when used as a CLI shim.' },
    ],
    '4.17.20': [
      { id: 'CVE-FAKE-2020-1029', severity: 7.1, exploit: true,  fixedIn: '4.17.21', desc: 'Command injection in template helper when used as a CLI shim.' },
    ],
    '4.17.21': [],
  },
  express: {
    '4.16.0': [
      { id: 'CVE-FAKE-2018-2041', severity: 6.1, exploit: false, fixedIn: '4.17.1', desc: 'Open redirect on res.location when host header is reflected unsanitised.' },
      { id: 'CVE-FAKE-2019-2057', severity: 8.1, exploit: true,  fixedIn: '4.18.2', desc: 'Prototype pollution via qs nested parameter parsing (transitive).' },
    ],
    '4.17.1': [
      { id: 'CVE-FAKE-2019-2057', severity: 8.1, exploit: true,  fixedIn: '4.18.2', desc: 'Prototype pollution via qs nested parameter parsing (transitive).' },
      { id: 'CVE-FAKE-2021-2073', severity: 4.3, exploit: false, fixedIn: '4.18.2', desc: 'Cookie parsing skips __Host- prefix checks on rare inputs.' },
    ],
    '4.18.2': [],
  },
  log4j: {
    '2.14.0': [
      { id: 'CVE-FAKE-2021-4401', severity: 10.0, exploit: true, fixedIn: '2.16.0', desc: 'JNDI lookup in message format string allows remote class loading (Log4Shell-class).' },
      { id: 'CVE-FAKE-2021-4419', severity: 9.0,  exploit: true, fixedIn: '2.16.0', desc: 'Recursive lookup expansion bypasses partial mitigations.' },
      { id: 'CVE-FAKE-2021-4503', severity: 6.6,  exploit: false, fixedIn: '2.17.1', desc: 'Thread context map deserialisation crash under crafted payloads.' },
    ],
    '2.15.0': [
      { id: 'CVE-FAKE-2021-4419', severity: 9.0,  exploit: true, fixedIn: '2.16.0', desc: 'Recursive lookup expansion bypasses partial mitigations.' },
      { id: 'CVE-FAKE-2021-4503', severity: 6.6,  exploit: false, fixedIn: '2.17.1', desc: 'Thread context map deserialisation crash under crafted payloads.' },
    ],
    '2.16.0': [
      { id: 'CVE-FAKE-2021-4503', severity: 6.6,  exploit: false, fixedIn: '2.17.1', desc: 'Thread context map deserialisation crash under crafted payloads.' },
    ],
    '2.17.1': [],
  },
  jackson: {
    '2.9.8': [
      { id: 'CVE-FAKE-2019-3011', severity: 9.8, exploit: true, fixedIn: '2.10.5', desc: 'Polymorphic deserialisation gadget chain via default typing.' },
      { id: 'CVE-FAKE-2020-3027', severity: 7.5, exploit: true, fixedIn: '2.13.4', desc: 'Untyped JDBC driver lookup during deserialisation.' },
      { id: 'CVE-FAKE-2022-3041', severity: 5.3, exploit: false, fixedIn: '2.15.3', desc: 'Stack overflow on deeply nested arrays before depth check.' },
    ],
    '2.10.5': [
      { id: 'CVE-FAKE-2020-3027', severity: 7.5, exploit: true, fixedIn: '2.13.4', desc: 'Untyped JDBC driver lookup during deserialisation.' },
      { id: 'CVE-FAKE-2022-3041', severity: 5.3, exploit: false, fixedIn: '2.15.3', desc: 'Stack overflow on deeply nested arrays before depth check.' },
    ],
    '2.13.4': [
      { id: 'CVE-FAKE-2022-3041', severity: 5.3, exploit: false, fixedIn: '2.15.3', desc: 'Stack overflow on deeply nested arrays before depth check.' },
    ],
    '2.15.3': [],
  },
  springcore: {
    '5.2.0': [
      { id: 'CVE-FAKE-2020-5008', severity: 8.8, exploit: true,  fixedIn: '5.3.18', desc: 'Spring4Shell-class binder gadget on JDK 9+ when bound to a Java bean.' },
      { id: 'CVE-FAKE-2021-5022', severity: 5.9, exploit: false, fixedIn: '5.3.30', desc: 'SpEL evaluator does not cap recursion, enabling DoS on hostile expressions.' },
    ],
    '5.3.18': [
      { id: 'CVE-FAKE-2021-5022', severity: 5.9, exploit: false, fixedIn: '5.3.30', desc: 'SpEL evaluator does not cap recursion, enabling DoS on hostile expressions.' },
    ],
    '5.3.30': [],
    '6.1.2': [],
  },
};

// ---------------------------------------------------------------------------
// Derived helpers
// ---------------------------------------------------------------------------

function severityClass(score) {
  if (score >= 9.0) return 'crit';
  if (score >= 7.0) return 'high';
  if (score >= 4.0) return 'med';
  return 'low';
}

function severityColor(score) {
  if (score >= 9.0) return '#a83232';
  if (score >= 7.0) return 'var(--accent)';
  if (score >= 4.0) return '#c47a14';
  return '#1c6dd0';
}

function severityLabel(score) {
  if (score >= 9.0) return 'CRIT';
  if (score >= 7.0) return 'HIGH';
  if (score >= 4.0) return 'MED';
  return 'LOW';
}

function getCves(pkgKey, version) {
  const tbl = CVES[pkgKey] || {};
  return tbl[version] || [];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const INITIAL_SELECTION = {
  lodash: '4.17.5',
  express: '4.16.0',
  log4j: '2.14.0',
  jackson: '2.9.8',
  springcore: '5.2.0',
};

export default function VulnerableComponentsWidget() {
  const [selection, setSelection] = useState(INITIAL_SELECTION);

  // Per-package CVE lists + total risk number, recomputed on every change.
  const perPackage = useMemo(
    () =>
      PACKAGES.map((p) => {
        const version = selection[p.key];
        const cves = getCves(p.key, version);
        const score = cves.reduce((s, c) => s + c.severity, 0);
        return { ...p, version, cves, score };
      }),
    [selection],
  );

  const totalRisk = perPackage.reduce((s, p) => s + p.score, 0);
  const totalCves = perPackage.reduce((s, p) => s + p.cves.length, 0);
  const exploitable = perPackage.reduce(
    (s, p) => s + p.cves.filter((c) => c.exploit).length,
    0,
  );
  const vulnPkgs = perPackage.filter((p) => p.cves.length > 0).length;
  const allClean = totalCves === 0;

  function pickVersion(pkgKey, version) {
    setSelection((s) => ({ ...s, [pkgKey]: version }));
  }

  function bumpAll() {
    setSelection({ ...LATEST });
  }

  function resetAll() {
    setSelection({ ...INITIAL_SELECTION });
  }

  return (
    <div className="widget">
      <div className="widget-title">A06 — vulnerable & outdated components</div>
      <div className="widget-hint">
        Pick a version for each direct dependency. The CVE list, total risk
        score, and dependency tree all react instantly. Every CVE here is
        fabricated for teaching — defensive concepts only.
      </div>

      <div className="controls">
        <button className="btn btn-accent" onClick={bumpAll} disabled={allClean}>
          Bump all to latest
        </button>
        <button className="btn btn-ghost" onClick={resetAll}>
          Reset to old versions
        </button>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
          {vulnPkgs} of {PACKAGES.length} direct deps vulnerable
        </span>
      </div>

      <div
        className="widget-stage"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 1fr) minmax(260px, 1.2fr)',
          gap: '0.9rem',
          alignItems: 'start',
        }}
      >
        {/* ----------------------------- package.json panel */}
        <div>
          <div style={panelHeading}>package.json</div>
          <div className="code-block" style={{ fontSize: '0.82rem', lineHeight: 1.55 }}>
            {'{\n'}
            {'  "dependencies": {\n'}
            {perPackage.map((p, i) => {
              const vuln = p.cves.length > 0;
              return (
                <div
                  key={p.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.15rem 0',
                    color: vuln ? 'var(--accent)' : 'var(--ink)',
                  }}
                >
                  <span style={{ flex: '0 0 auto' }}>
                    {'    "'}{p.name}{'": "'}
                  </span>
                  <select
                    className="field"
                    value={p.version}
                    onChange={(e) => pickVersion(p.key, e.target.value)}
                    style={{
                      padding: '0.1em 0.35em',
                      fontSize: '0.78rem',
                      fontFamily: 'var(--font-mono)',
                      borderColor: vuln ? 'var(--accent)' : 'var(--ink)',
                    }}
                  >
                    {p.versions.map((v) => (
                      <option key={v} value={v}>
                        {v}
                        {getCves(p.key, v).length === 0 ? '  (clean)' : `  (${getCves(p.key, v).length} CVE)`}
                      </option>
                    ))}
                  </select>
                  <span>{'"'}{i < perPackage.length - 1 ? ',' : ''}</span>
                  {vuln && (
                    <span
                      className="badge err"
                      style={{ marginLeft: 'auto', fontSize: '0.6rem' }}
                      title="this version has known CVEs"
                    >
                      vuln
                    </span>
                  )}
                </div>
              );
            })}
            {'  }\n'}
            {'}'}
          </div>
          <DependencyTree perPackage={perPackage} />
        </div>

        {/* ----------------------------- live CVE panel */}
        <div>
          <div style={panelHeading}>
            CVE feed{' '}
            <span style={{ color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
              ({totalCves} open)
            </span>
          </div>
          <div className="log" style={{ maxHeight: 360, padding: '0.4rem 0.6rem' }}>
            {allClean && (
              <div style={{ padding: '0.5rem 0.2rem', color: '#2a8a3e', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                Inventory clean. No matching advisories in the database.
              </div>
            )}
            <AnimatePresence initial={false}>
              {perPackage
                .filter((p) => p.cves.length > 0)
                .flatMap((p) =>
                  p.cves.map((c) => (
                    <CveRow key={`${p.key}-${p.version}-${c.id}`} pkg={p} cve={c} />
                  )),
                )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="metrics">
        <div className={`metric ${totalRisk > 0 ? 'accent' : ''}`}>
          <div className="label">Total risk (Σ CVSS)</div>
          <div className="value">{totalRisk.toFixed(1)}</div>
        </div>
        <div className="metric">
          <div className="label">Open CVEs</div>
          <div className="value">{totalCves}</div>
        </div>
        <div className="metric">
          <div className="label">Exploit available</div>
          <div className="value" style={{ color: exploitable > 0 ? 'var(--accent)' : 'var(--ink)' }}>
            {exploitable}
          </div>
        </div>
        <div className="metric">
          <div className="label">Vulnerable deps</div>
          <div className="value">{vulnPkgs} / {PACKAGES.length}</div>
        </div>
      </div>

      <div className="callout">
        {allClean ? (
          <span style={{ color: '#2a8a3e' }}>
            All five direct deps are at their latest pinned version. The CVE
            feed is empty and total risk is zero — that is the whole game:
            most of the OWASP A06 backlog is closed by a version bump that
            already exists.
          </span>
        ) : (
          <>
            <strong>Risk surface:</strong> {totalCves} CVE
            {totalCves === 1 ? '' : 's'} across {vulnPkgs} direct dep
            {vulnPkgs === 1 ? '' : 's'} — {exploitable} with a public exploit.
            A single forgotten transitive (think Log4Shell) is enough to make
            the whole app reachable. Bump any picker to a newer version and
            watch its CVEs drop off the feed.
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CveRow({ pkg, cve }) {
  const color = severityColor(cve.severity);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 6 }}
      transition={{ duration: 0.18 }}
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        columnGap: '0.5rem',
        rowGap: '0.15rem',
        padding: '0.45rem 0.4rem',
        borderTop: '1px dashed var(--ink-faint)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.78rem',
      }}
    >
      <span
        title={`CVSS ${cve.severity.toFixed(1)}`}
        style={{
          background: color,
          color: 'white',
          padding: '0 0.4em',
          borderRadius: 3,
          fontSize: '0.65rem',
          letterSpacing: '0.08em',
          fontWeight: 700,
          alignSelf: 'start',
          marginTop: 1,
        }}
      >
        {severityLabel(cve.severity)} {cve.severity.toFixed(1)}
      </span>
      <span style={{ color: 'var(--ink)', fontWeight: 600 }}>
        {cve.id}{' '}
        <span style={{ color: 'var(--ink-soft)', fontWeight: 400 }}>
          in {pkg.name}@{pkg.version}
        </span>
      </span>
      <span style={{ color: '#2a8a3e', alignSelf: 'start', marginTop: 1 }}>
        fixed in {cve.fixedIn}
      </span>
      <span style={{ gridColumn: '2 / -1', color: 'var(--ink-soft)' }}>
        {cve.desc}
      </span>
      {cve.exploit && (
        <span
          style={{
            gridColumn: '2 / -1',
            color: 'var(--accent)',
            fontWeight: 600,
            fontSize: '0.72rem',
            letterSpacing: '0.05em',
          }}
        >
          public exploit available — patch first
        </span>
      )}
    </motion.div>
  );
}

function DependencyTree({ perPackage }) {
  // SVG layout: app node centred top, one branch per direct dep, transitives
  // arranged underneath each branch. Recoloured live by vulnerability state.
  const colW = 130;
  const totalW = PACKAGES.length * colW;
  const height = 250;

  return (
    <div style={{ marginTop: '0.7rem' }}>
      <div style={{ ...panelHeading, fontSize: '0.85rem' }}>Dependency tree</div>
      <svg viewBox={`0 0 ${totalW} ${height}`} width="100%" style={{ maxWidth: totalW }}>
        {/* root app node */}
        <rect
          x={totalW / 2 - 40}
          y={6}
          width={80}
          height={26}
          rx={4}
          fill="var(--paper)"
          stroke="var(--ink)"
          strokeWidth={2}
        />
        <text
          x={totalW / 2}
          y={23}
          textAnchor="middle"
          style={{ fontFamily: 'var(--font-display)', fontSize: 12 }}
        >
          app
        </text>

        {perPackage.map((p, i) => {
          const cx = i * colW + colW / 2;
          const directY = 80;
          const vuln = p.cves.length > 0;
          const fill = vuln ? '#fde2e2' : '#d9ead3';
          const stroke = vuln ? 'var(--accent)' : '#2a8a3e';
          return (
            <g key={p.key}>
              {/* edge app → direct */}
              <line
                x1={totalW / 2}
                y1={32}
                x2={cx}
                y2={directY - 14}
                stroke="var(--ink-soft)"
                strokeWidth={1.5}
              />
              {/* direct dep node */}
              <motion.rect
                animate={{ fill }}
                transition={{ duration: 0.2 }}
                x={cx - 55}
                y={directY - 14}
                width={110}
                height={28}
                rx={4}
                stroke={stroke}
                strokeWidth={2}
              />
              <text
                x={cx}
                y={directY - 1}
                textAnchor="middle"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600 }}
              >
                {p.name}
              </text>
              <text
                x={cx}
                y={directY + 9}
                textAnchor="middle"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}
              >
                @{p.version}
              </text>
              {vuln && (
                <text
                  x={cx}
                  y={directY + 24}
                  textAnchor="middle"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--accent)', fontWeight: 700 }}
                >
                  {p.cves.length} CVE{p.cves.length === 1 ? '' : 's'}
                </text>
              )}
              {/* transitives */}
              {p.transitives.map((t, j) => {
                const ty = directY + 50 + j * 28;
                return (
                  <g key={t}>
                    <line
                      x1={cx}
                      y1={directY + 14}
                      x2={cx}
                      y2={ty - 10}
                      stroke="var(--ink-faint)"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                    />
                    <rect
                      x={cx - 50}
                      y={ty - 10}
                      width={100}
                      height={20}
                      rx={3}
                      fill="var(--paper)"
                      stroke="var(--ink-faint)"
                      strokeWidth={1}
                    />
                    <text
                      x={cx}
                      y={ty + 3}
                      textAnchor="middle"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, fill: 'var(--ink-soft)' }}
                    >
                      {t}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: '0.8rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-soft)', marginTop: '0.3rem' }}>
        <span><span style={legendSwatch('#d9ead3', '#2a8a3e')} /> clean</span>
        <span><span style={legendSwatch('#fde2e2', 'var(--accent)')} /> vulnerable</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// inline style helpers
// ---------------------------------------------------------------------------

const panelHeading = {
  fontFamily: 'var(--font-display)',
  fontSize: '0.95rem',
  letterSpacing: '0.03em',
  marginBottom: '0.4rem',
};

function legendSwatch(fill, stroke) {
  return {
    display: 'inline-block',
    width: 12,
    height: 12,
    background: fill,
    border: `1.5px solid ${stroke}`,
    borderRadius: 2,
    verticalAlign: -2,
    marginRight: 4,
  };
}

// Suppress lint warning about unused helper — kept for downstream parity.
// eslint-disable-next-line no-unused-vars
const _severityClassExport = severityClass;
