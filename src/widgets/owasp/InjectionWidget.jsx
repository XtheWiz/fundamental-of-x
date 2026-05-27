import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// OWASP A03 — Injection
//
// Three injection classes side by side. For each one the learner types a
// payload into a single input and immediately sees what a BAD (unsafe) path
// would produce vs what a GOOD (parameterised / escaped / arg-array) path
// produces. Every check happens 100% in-memory — no real DB, no real DOM
// execution, no real shell. The XSS demo parses HTML in an inert parser and
// shows the resulting tree, so the payload is never inserted into the live
// document and event handlers never fire.

// --- Fake users table for the SQL demo ---------------------------------
const USERS = [
  { id: 1, name: 'alice', role: 'admin'  },
  { id: 2, name: 'bob',   role: 'member' },
  { id: 3, name: 'carol', role: 'member' },
  { id: 4, name: 'dave',  role: 'guest'  },
];

// Toy SQL evaluator for `SELECT * FROM users WHERE <expr>`. Understands
// string literals, identifiers, `=`, OR/AND, parens, and `--` line comments.
function evalSqlWhere(expr, row) {
  const stripped = expr.split('--')[0].trim();
  if (!stripped) return true;
  const tokens = [];
  let i = 0;
  while (i < stripped.length) {
    const c = stripped[i];
    if (c === ' ' || c === '\t') { i++; continue; }
    if (c === "'") {
      let j = i + 1, s = '';
      while (j < stripped.length && stripped[j] !== "'") { s += stripped[j]; j++; }
      tokens.push({ k: 'str', v: s });
      i = j + 1;
      continue;
    }
    if (c === '=') { tokens.push({ k: 'op', v: '=' }); i++; continue; }
    if (c === '(' || c === ')') { tokens.push({ k: c }); i++; continue; }
    let j = i;
    while (j < stripped.length && /[A-Za-z0-9_]/.test(stripped[j])) j++;
    if (j > i) {
      const w = stripped.slice(i, j), u = w.toUpperCase();
      tokens.push(u === 'OR' || u === 'AND' ? { k: 'logic', v: u } : { k: 'id', v: w });
      i = j;
    } else { return false; }
  }
  let p = 0;
  const peek = () => tokens[p];
  const eat  = () => tokens[p++];
  function parseCmp() {
    const left = eat();
    if (!left) return false;
    if (left.k === '(') {
      const inner = parseOr();
      if (peek() && peek().k === ')') eat();
      return inner;
    }
    const op = eat(), right = eat();
    if (!op || !right || op.k !== 'op') return false;
    const lv = left.k === 'id' ? String(row[left.v] ?? '') : String(left.v);
    const rv = right.k === 'id' ? String(row[right.v] ?? '') : String(right.v);
    return lv === rv;
  }
  function parseAnd() {
    let v = parseCmp();
    while (peek() && peek().k === 'logic' && peek().v === 'AND') { eat(); v = parseCmp() && v; }
    return v;
  }
  function parseOr() {
    let v = parseAnd();
    while (peek() && peek().k === 'logic' && peek().v === 'OR') { eat(); v = parseAnd() || v; }
    return v;
  }
  try { return Boolean(parseOr()); } catch { return false; }
}

const buildBadQuery = (name) => `SELECT * FROM users WHERE name = '${name}'`;
const runBadSql  = (name) => USERS.filter((u) => evalSqlWhere(`name = '${name}'`, u));
// Parameter binding: `?` is replaced by an opaque value, never re-parsed as
// SQL. The whole payload is searched as a literal string and matches nothing.
const runGoodSql = (name) => USERS.filter((u) => u.name === name);

// --- XSS sandbox parser ------------------------------------------------
// Parse the payload into a DOM tree *without* attaching it to the page,
// then walk it to produce a printable description. Event-handler attributes
// like onerror never fire because the parsed nodes are never inserted.
function parseHtmlTree(html) {
  if (typeof window === 'undefined' || !window.DOMParser) {
    return [{ type: 'text', value: html, depth: 0 }];
  }
  const doc = new window.DOMParser().parseFromString(`<root>${html}</root>`, 'text/html');
  const root = doc.querySelector('root');
  const out = [];
  function walk(node, depth) {
    if (node.nodeType === 3) {
      const t = node.nodeValue;
      if (t && t.length) out.push({ type: 'text', value: t, depth });
      return;
    }
    if (node.nodeType !== 1) return;
    const attrs = [];
    let dangerous = false;
    for (const a of node.attributes) {
      const isHandler = /^on/i.test(a.name);
      const isJsUrl = /^(href|src)$/i.test(a.name) && /^\s*javascript:/i.test(a.value);
      if (isHandler || isJsUrl) dangerous = true;
      attrs.push({ name: a.name, value: a.value, dangerous: isHandler || isJsUrl });
    }
    out.push({ type: 'el', tag: node.tagName.toLowerCase(), attrs, dangerous, depth });
    for (const child of node.childNodes) walk(child, depth + 1);
  }
  if (root) for (const child of root.childNodes) walk(child, 0);
  return out;
}

const xssRiskSummary = (tree) => {
  const elems = tree.filter((n) => n.type === 'el');
  return { elems: elems.length, dangerous: elems.filter((n) => n.dangerous).length };
};

// --- Shell argv parser -------------------------------------------------
// Detect command-chaining metacharacters outside of quotes. With execFile
// (arg array), no shell runs at all, so the whole string stays one arg.
const SHELL_SEPARATORS = [';', '&&', '||', '|', '\n', '&'];
function detectShellChain(cmd) {
  let inSingle = false, inDouble = false;
  const hits = [];
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i];
    if (c === "'" && !inDouble) { inSingle = !inSingle; continue; }
    if (c === '"' && !inSingle) { inDouble = !inDouble; continue; }
    if (inSingle || inDouble) continue;
    for (const sep of SHELL_SEPARATORS) {
      if (cmd.slice(i, i + sep.length) === sep) {
        hits.push({ at: i, sep: sep === '\n' ? '\\n' : sep });
        i += sep.length - 1;
        break;
      }
    }
  }
  return hits;
}

const TABS = [
  { key: 'sql',   label: 'SQL injection'     },
  { key: 'xss',   label: 'XSS'               },
  { key: 'shell', label: 'Command injection' },
];

// =======================================================================
export default function InjectionWidget() {
  const [tab, setTab] = useState('sql');
  const [sqlInput,   setSqlInput]   = useState("admin' OR '1'='1");
  const [xssInput,   setXssInput]   = useState('<img src=x onerror="alert(1)">');
  const [shellInput, setShellInput] = useState('notes.txt; rm -rf /');

  return (
    <div className="widget">
      <div className="widget-title">Injection — BAD vs GOOD, live</div>
      <div className="widget-hint">
        Pick a class of injection, type a payload, compare an unsafe code path against a safe one.
        Everything is sandboxed in this page — no database, DOM, or shell is ever contacted.
      </div>
      <div className="controls" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={`btn ${tab === t.key ? 'btn-accent' : ''}`}
            onClick={() => setTab(t.key)}
          >{t.label}</button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {tab === 'sql' && (
          <motion.div key="sql" initial={fadeInit} animate={fadeIn} exit={fadeOut} transition={fadeT}>
            <SqlPane input={sqlInput} setInput={setSqlInput} />
          </motion.div>
        )}
        {tab === 'xss' && (
          <motion.div key="xss" initial={fadeInit} animate={fadeIn} exit={fadeOut} transition={fadeT}>
            <XssPane input={xssInput} setInput={setXssInput} />
          </motion.div>
        )}
        {tab === 'shell' && (
          <motion.div key="shell" initial={fadeInit} animate={fadeIn} exit={fadeOut} transition={fadeT}>
            <ShellPane input={shellInput} setInput={setShellInput} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SQL pane ----------------------------------------------------------
function SqlPane({ input, setInput }) {
  const badRows  = useMemo(() => runBadSql(input),  [input]);
  const goodRows = useMemo(() => runGoodSql(input), [input]);
  const badQuery = buildBadQuery(input);
  return (
    <>
      <PayloadInput
        id="sql-in" label="Username" value={input} setValue={setInput}
        exploit="admin' OR '1'='1" benign="alice"
      />
      <div className="widget-stage" style={paneGrid}>
        <Side variant="bad" title="BAD — string interpolation">
          <div className="code-block">{"db.query(`SELECT * FROM users WHERE name = '${name}'`)"}</div>
          <div style={subLabel}>Final query string sent to the DB:</div>
          <div className="code-block" style={badBg}>{badQuery}</div>
          <RowTable rows={badRows} />
          <Verdict bad>Returned {badRows.length} row{plural(badRows.length)}. Payload was parsed as SQL.</Verdict>
        </Side>
        <Side variant="good" title="GOOD — parameterised query">
          <div className="code-block">{"db.query('SELECT * FROM users WHERE name = ?', [name])"}</div>
          <div style={subLabel}>The DB receives the SQL once and the value separately:</div>
          <div className="code-block" style={goodBg}>
            {`SELECT * FROM users WHERE name = ?\n-- bound: [${JSON.stringify(input)}]`}
          </div>
          <RowTable rows={goodRows} />
          <Verdict>Returned {goodRows.length} row{plural(goodRows.length)}. Payload stayed a literal value.</Verdict>
        </Side>
      </div>
      <div className="callout">
        The unsafe path concatenates the user's text into the SQL <em>before</em> it reaches the database,
        so operators like <code>OR</code> become part of the query. Prepared statements send the SQL and the
        data over separate channels — the value can never be re-parsed as code.
      </div>
    </>
  );
}

function RowTable({ rows }) {
  if (rows.length === 0) return <div style={{ ...subLabel, marginTop: '0.6rem' }}>(no rows)</div>;
  return (
    <div style={{ marginTop: '0.6rem', overflowX: 'auto' }}>
      <table style={tableStyle}>
        <thead><tr><th style={thStyle}>id</th><th style={thStyle}>name</th><th style={thStyle}>role</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={tdStyle}>{r.id}</td>
              <td style={tdStyle}>{r.name}</td>
              <td style={tdStyle}>{r.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- XSS pane ----------------------------------------------------------
function XssPane({ input, setInput }) {
  const tree = useMemo(() => parseHtmlTree(input), [input]);
  const summary = xssRiskSummary(tree);
  return (
    <>
      <PayloadInput
        id="xss-in" label="Comment" value={input} setValue={setInput}
        exploit='<img src=x onerror="alert(1)">' benign="hello <b>world</b>"
      />
      <div className="widget-stage" style={paneGrid}>
        <Side variant="bad" title="BAD — dangerouslySetInnerHTML">
          <div className="code-block">{'<div dangerouslySetInnerHTML={{ __html: comment }} />'}</div>
          <div style={subLabel}>The browser would build this DOM tree (rendered inertly here):</div>
          <DomTree tree={tree} />
          <Verdict bad>
            {summary.dangerous > 0
              ? `${summary.dangerous} dangerous attribute${plural(summary.dangerous)} would fire on a real page.`
              : `Parsed ${summary.elems} element${plural(summary.elems)}. No event handlers in this payload — but the door is open.`}
          </Verdict>
        </Side>
        <Side variant="good" title="GOOD — text child node">
          <div className="code-block">{'<div>{comment}</div>'}</div>
          <div style={subLabel}>React inserts the value as a text node — markup is shown as characters:</div>
          <div style={textRenderBox}>
            {input || <span style={{ color: 'var(--ink-faint)' }}>(empty)</span>}
          </div>
          <Verdict>No tags created. The angle brackets render as <code>&lt;</code> and <code>&gt;</code>.</Verdict>
        </Side>
      </div>
      <div className="callout">
        The BAD path hands attacker-controlled markup to the HTML parser. The GOOD path treats it as data —
        by the time it reaches the DOM it is already a string of characters, never an <code>img</code> tag.
      </div>
    </>
  );
}

function DomTree({ tree }) {
  if (tree.length === 0) return <div style={{ ...subLabel, marginTop: '0.6rem' }}>(empty)</div>;
  return (
    <div className="log" style={domTreeBox} aria-label="Parsed DOM tree (sandbox)">
      {tree.map((n, i) => (
        <div key={i} className="entry" style={{ paddingLeft: `${n.depth * 14}px` }}>
          {n.type === 'text' ? (
            <span style={{ color: 'var(--ink-soft)' }}>"{n.value}"</span>
          ) : (
            <span>
              <span style={tagStyle}>&lt;{n.tag}</span>
              {n.attrs.map((a, j) => (
                <span key={j} style={{ marginLeft: 6, color: a.dangerous ? 'var(--accent)' : 'var(--ink)' }}>
                  {a.name}={JSON.stringify(a.value)}
                  {a.dangerous && <span className="badge err" style={{ marginLeft: 4 }}>WOULD FIRE</span>}
                </span>
              ))}
              <span style={tagStyle}>&gt;</span>
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// --- Shell pane --------------------------------------------------------
function ShellPane({ input, setInput }) {
  const badCmd = `cat ${input}`;
  const chain = useMemo(() => detectShellChain(badCmd), [badCmd]);
  const wouldChain = chain.length > 0;
  return (
    <>
      <PayloadInput
        id="sh-in" label="Filename" value={input} setValue={setInput}
        exploit="notes.txt; rm -rf /" benign="notes.txt"
      />
      <div className="widget-stage" style={paneGrid}>
        <Side variant="bad" title="BAD — exec on a built string">
          <div className="code-block">{'exec(`cat ${filename}`)'}</div>
          <div style={subLabel}>String handed to the shell:</div>
          <div className="code-block" style={badBg}>{badCmd}</div>
          <div style={subLabel}>Would the shell run a second command?</div>
          <div style={{ ...verdictBox, background: wouldChain ? 'var(--accent)' : '#d9ead3', color: wouldChain ? 'white' : 'var(--ink)' }}>
            {wouldChain
              ? `YES — separator${plural(chain.length)} found: ${chain.map((h) => h.sep).join(', ')}`
              : 'No separator found in this payload.'}
          </div>
          {wouldChain && (
            <div style={{ ...subLabel, marginTop: '0.4rem' }}>
              Nothing is actually executed — this widget only inspects the string for shell metacharacters.
            </div>
          )}
        </Side>
        <Side variant="good" title="GOOD — execFile with arg array">
          <div className="code-block">{"execFile('cat', [filename])"}</div>
          <div style={subLabel}>argv passed directly to the process — no shell parses it:</div>
          <div className="code-block" style={goodBg}>{`argv = ['cat', ${JSON.stringify(input)}]`}</div>
          <div style={subLabel}>Would the shell run a second command?</div>
          <div style={{ ...verdictBox, background: '#d9ead3' }}>
            No — there is no shell. The whole string is one literal argument to <code>cat</code>.
          </div>
        </Side>
      </div>
      <div className="callout">
        <code>exec</code> spawns a shell that re-parses the whole string, so characters like <code>;</code>,
        <code> &amp;&amp;</code> and <code>|</code> chain commands. <code>execFile</code> (or
        <code> spawn</code> with <code>shell: false</code>) passes the argv straight to the kernel — the
        attacker can choose the <em>filename</em>, never the <em>command</em>.
      </div>
    </>
  );
}

// --- Shared bits -------------------------------------------------------
function PayloadInput({ id, label, value, setValue, exploit, benign }) {
  return (
    <div className="controls">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className="field"
        style={{ flex: '1 1 240px', fontFamily: 'var(--font-mono)' }}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        spellCheck={false}
      />
      <button className="btn btn-ghost" onClick={() => setValue(exploit)}>Use exploit payload</button>
      <button className="btn btn-ghost" onClick={() => setValue(benign)}>Use benign input</button>
    </div>
  );
}

function Side({ variant, title, children }) {
  const isBad = variant === 'bad';
  return (
    <div style={sideBox}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className={`badge ${isBad ? 'err' : 'live'}`}>{isBad ? 'BAD' : 'GOOD'}</span>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

const Verdict = ({ children, bad }) => (
  <div style={{ ...verdictBox, background: bad ? '#fde2e2' : '#d9ead3' }}>{children}</div>
);

const plural = (n) => (n === 1 ? '' : 's');

const fadeInit = { opacity: 0, y: 4 };
const fadeIn   = { opacity: 1, y: 0 };
const fadeOut  = { opacity: 0 };
const fadeT    = { duration: 0.18 };

const paneGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '1rem',
  alignItems: 'stretch',
};

const sideBox = {
  border: '2px solid var(--ink)',
  borderRadius: 'var(--radius)',
  background: 'var(--paper)',
  padding: '0.9rem 1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  minWidth: 0,
};

const subLabel = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.75rem',
  color: 'var(--ink-soft)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginTop: '0.2rem',
};

const verdictBox = {
  border: '1.5px solid var(--ink)',
  borderRadius: 'var(--radius)',
  padding: '0.5rem 0.7rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.82rem',
  marginTop: '0.2rem',
};

const badBg  = { background: '#fde2e2' };
const goodBg = { background: '#d9ead3' };

const tableStyle = { borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', width: '100%' };
const thStyle = { border: '1.5px solid var(--ink)', background: 'var(--paper-deep)', padding: '0.3em 0.6em', textAlign: 'left' };
const tdStyle = { border: '1.5px solid var(--ink)', padding: '0.25em 0.6em', background: 'var(--paper)' };

const textRenderBox = {
  background: '#d9ead3',
  border: '1.5px solid var(--ink)',
  borderRadius: 'var(--radius)',
  padding: '0.6rem 0.8rem',
  fontFamily: 'var(--font-body)',
  minHeight: '2.4rem',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};

const domTreeBox = { background: '#fde2e2', maxHeight: 200, marginTop: '0.6rem' };
const tagStyle   = { color: '#1c6dd0', fontWeight: 600 };
