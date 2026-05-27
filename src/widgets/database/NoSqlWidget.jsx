import { useMemo, useState } from 'react';

// One small domain ("users with posts and comments") modelled three ways:
//   - Relational : 3 normalised tables, joined by foreign key
//   - Document   : each user is one JSON doc with embedded posts + comments
//   - Key-value  : each user is one opaque blob under a single key
//
// Four query types run against every model. The cost changes dramatically
// with the shape — every model+query switch immediately recomputes the ops
// count and the one-line verdict so the learner can feel the trade-offs.

// ----- Dataset (tiny so snippets fit on screen) -----------------------------
const USERS = [
  { id: 1, name: 'ada',   email: 'ada@ex.com'   },
  { id: 2, name: 'linus', email: 'linus@ex.com' },
  { id: 3, name: 'grace', email: 'grace@ex.com' },
  { id: 4, name: 'alan',  email: 'alan@ex.com'  },
];
const POSTS = [
  { id: 11, user_id: 1, title: 'On analytical engines' },
  { id: 12, user_id: 1, title: 'Notes G' },
  { id: 21, user_id: 2, title: 'Just for fun' },
  { id: 22, user_id: 2, title: 'Why monorepos' },
  { id: 31, user_id: 3, title: 'COBOL is fine' },
  { id: 32, user_id: 3, title: 'Compiler debuggery' },
  { id: 41, user_id: 4, title: 'Imitation games' },
  { id: 42, user_id: 4, title: 'On enigma' },
];
const COMMENTS = [
  { id: 101, post_id: 11, user_id: 2, text: 'beautiful' },
  { id: 102, post_id: 11, user_id: 3, text: 'classic' },
  { id: 103, post_id: 12, user_id: 4, text: 'wow' },
  { id: 104, post_id: 21, user_id: 1, text: 'agreed' },
  { id: 105, post_id: 21, user_id: 3, text: 'lol' },
  { id: 106, post_id: 22, user_id: 4, text: 'hmm' },
  { id: 107, post_id: 31, user_id: 1, text: 'fair' },
  { id: 108, post_id: 32, user_id: 2, text: 'tasty' },
  { id: 109, post_id: 41, user_id: 1, text: 'classic' },
  { id: 110, post_id: 41, user_id: 3, text: 'iconic' },
  { id: 111, post_id: 42, user_id: 2, text: 'cool' },
  { id: 112, post_id: 42, user_id: 3, text: '+1' },
];
const N_USERS = USERS.length;

const MODELS = {
  relational: { label: 'Relational', sublabel: '3 tables, FKs',           lang: 'SQL' },
  document:   { label: 'Document',   sublabel: 'nested JSON per user',    lang: 'MQL' },
  keyvalue:   { label: 'Key-value',  sublabel: 'blob per user',           lang: 'GET' },
};

// Build the "document" view: one nested object per user.
function buildUserDoc(u) {
  return {
    _id: u.id, name: u.name, email: u.email,
    posts: POSTS.filter((p) => p.user_id === u.id).map((p) => ({
      id: p.id, title: p.title,
      comments: COMMENTS.filter((c) => c.post_id === p.id).map((c) => ({
        id: c.id, by: USERS.find((x) => x.id === c.user_id).name, text: c.text,
      })),
    })),
  };
}

function snippet(obj, max = 240) {
  const s = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
  return s.length > max ? s.slice(0, max - 3) + '...' : s;
}

// ----- Queries: each returns { query, reads, writes, result, verdict } ------
const QUERIES = {
  postsByUser: {
    label: 'Get all posts by user X',
    param: 'user',
    run(model, x) {
      const posts = POSTS.filter((p) => p.user_id === x).map((p) => ({ id: p.id, title: p.title }));
      if (model === 'relational') return {
        query: `SELECT * FROM posts WHERE user_id = ${x};`,
        reads: 1 + posts.length, writes: 0, result: posts,
        verdict: 'native fit — single indexed lookup on posts.user_id.',
      };
      if (model === 'document') return {
        query: `db.users.findOne({ _id: ${x} }, { posts: 1 });`,
        reads: 1, writes: 0, result: posts,
        verdict: 'native fit — posts live inside the user doc; one read.',
      };
      return {
        query: `value = GET user:${x}; parse JSON; pluck .posts`,
        reads: 1, writes: 0, result: posts,
        verdict: 'needs full deserialise — fetch the whole user blob, then parse.',
      };
    },
  },

  userWithAll: {
    label: 'Get user with all their content',
    param: 'user',
    run(model, x) {
      const user = USERS.find((u) => u.id === x);
      const posts = POSTS.filter((p) => p.user_id === x);
      const comments = COMMENTS.filter((c) => posts.some((p) => p.id === c.post_id));
      if (model === 'relational') return {
        query:
`SELECT u.*, p.*, c.*
FROM users u
LEFT JOIN posts    p ON p.user_id = u.id
LEFT JOIN comments c ON c.post_id = p.id
WHERE u.id = ${x};`,
        // 1 user + 1 posts-probe + N posts + 1 comments-probe per post
        reads: 1 + 1 + posts.length + posts.length, writes: 0,
        result: { user: user.name, posts: posts.length, comments: comments.length },
        verdict: 'needs join — three tables joined to reassemble the aggregate.',
      };
      if (model === 'document') return {
        query: `db.users.findOne({ _id: ${x} });`,
        reads: 1, writes: 0, result: buildUserDoc(user),
        verdict: 'native fit — the aggregate IS the document. One read, zero joins.',
      };
      return {
        query: `value = GET user:${x}; parse JSON`,
        reads: 1, writes: 0, result: buildUserDoc(user),
        verdict: 'native fit (for this user) — single GET returns the whole blob.',
      };
    },
  },

  updateComment: {
    label: "Update one comment's text",
    param: 'comment',
    run(model, x) {
      const c = COMMENTS.find((cc) => cc.id === x);
      if (!c) return { query: '', reads: 0, writes: 0, result: null, verdict: '' };
      const owningPost = POSTS.find((p) => p.id === c.post_id);
      const after = { id: c.id, before: c.text, after: '...' };
      if (model === 'relational') return {
        query: `UPDATE comments SET text = '...' WHERE id = ${x};`,
        reads: 1, writes: 1, result: after,
        verdict: 'native fit — comments are a top-level table, update is local.',
      };
      if (model === 'document') return {
        query:
`db.users.updateOne(
  { _id: ${owningPost.user_id}, "posts.comments.id": ${x} },
  { $set: { "posts.$[p].comments.$[c].text": "..." } },
  { arrayFilters: [ { "p.id": ${owningPost.post_id} }, { "c.id": ${x} } ] });`,
        reads: 1, writes: 1, result: after,
        verdict: 'needs nested update — server rewrites the entire user document.',
      };
      return {
        query:
`v = GET user:${owningPost.user_id};
d = parse(v); mutate(d.posts[*].comments[*].text);
SET user:${owningPost.user_id} = serialise(d);`,
        reads: 1, writes: 1, result: after,
        verdict: 'needs full deserialise + reserialise — read-modify-write the whole blob.',
      };
    },
  },

  whoCommentedOnPost: {
    label: 'Find all users who commented on post Y',
    param: 'post',
    run(model, x) {
      const cs = COMMENTS.filter((c) => c.post_id === x);
      const commenterIds = [...new Set(cs.map((c) => c.user_id))];
      const commenters = commenterIds.map((id) => USERS.find((u) => u.id === id).name);
      if (model === 'relational') return {
        query:
`SELECT DISTINCT u.name
FROM users u
JOIN comments c ON c.user_id = u.id
WHERE c.post_id = ${x};`,
        reads: 1 + cs.length + commenterIds.length, writes: 0, result: commenters,
        verdict: 'needs join — but an index on comments.post_id keeps it cheap.',
      };
      if (model === 'document') return {
        query: `db.users.find({ "posts.id": ${x} }, { "posts.$": 1 });`,
        reads: N_USERS, writes: 0, result: commenters,
        verdict: `needs scan + filter — comments are buried inside other users' docs; must visit all ${N_USERS}.`,
      };
      return {
        query:
`for k in KEYS user:*:        // ${N_USERS} reads
  d = parse(GET k)
  if any c in d.posts[*].comments where post_id == ${x}: collect d.name`,
        reads: N_USERS, writes: 0, result: commenters,
        verdict: `needs scan + full deserialise — no secondary index, walk every one of ${N_USERS} blobs.`,
      };
    },
  },
};

// "Rename ada" — canonical write-amplification demo for denormalised stores.
function denormCost(model) {
  if (model === 'relational') {
    return { writes: 1, detail: '1 row in users — the name lives in exactly one place.' };
  }
  const adaComments = COMMENTS.filter((c) => c.user_id === 1);
  const affected = new Set(adaComments.map((c) => POSTS.find((p) => p.id === c.post_id).user_id));
  affected.add(1); // ada's own doc
  const n = affected.size;
  if (model === 'document') return {
    writes: n,
    detail: `${n} documents must be rewritten — every doc that embeds an ada-authored comment.`,
  };
  return {
    writes: n,
    detail: `${n} blobs must be read, mutated and written back — same fan-out, no atomicity guarantees.`,
  };
}

// Schema preview pinned to the current model.
function schemaPreview(model) {
  if (model === 'relational') return (
`-- users(id, name, email)
1 | ada    | ada@ex.com
2 | linus  | linus@ex.com
3 | grace  | grace@ex.com
4 | alan   | alan@ex.com

-- posts(id, user_id, title)            8 rows
-- comments(id, post_id, user_id, text) 12 rows`);
  if (model === 'document') return `// users collection — 4 documents
${snippet(buildUserDoc(USERS[0]), 480)}`;
  return `// 4 keys (opaque values)
user:1 -> "${JSON.stringify(buildUserDoc(USERS[0])).slice(0, 60)}..."
user:2 -> "..."
user:3 -> "..."
user:4 -> "..."`;
}

// Small style helpers
const labelStyle = {
  fontFamily: 'var(--font-display)', fontSize: '0.75rem',
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--ink-soft)',
};

export default function NoSqlWidget() {
  const [model, setModel] = useState('relational');
  const [queryKey, setQueryKey] = useState('postsByUser');
  const [paramUser, setParamUser] = useState(1);
  const [paramPost, setParamPost] = useState(11);
  const [paramComment, setParamComment] = useState(101);

  const query = QUERIES[queryKey];
  const x = query.param === 'user'    ? paramUser
          : query.param === 'post'    ? paramPost
          : paramComment;

  const result = useMemo(() => query.run(model, x), [model, queryKey, x]);
  const denorm = useMemo(() => denormCost(model), [model]);
  const ops = result.reads + result.writes;

  const verdictColor =
    result.verdict.startsWith('native fit')   ? '#2a8a3e' :
    result.verdict.startsWith('needs join')   ? '#1c6dd0' :
    'var(--accent)';

  function renderParamPicker() {
    if (query.param === 'user') {
      return (
        <div className="pill-group" role="radiogroup" aria-label="user">
          {USERS.map((u) => (
            <span key={u.id}>
              <input type="radio" id={`u-${u.id}`} name="user"
                checked={paramUser === u.id}
                onChange={() => setParamUser(u.id)} />
              <label htmlFor={`u-${u.id}`}>{u.name}</label>
            </span>
          ))}
        </div>
      );
    }
    if (query.param === 'post') {
      return (
        <select className="field" value={paramPost} onChange={(e) => setParamPost(+e.target.value)}>
          {POSTS.map((p) => <option key={p.id} value={p.id}>#{p.id} — {p.title}</option>)}
        </select>
      );
    }
    return (
      <select className="field" value={paramComment} onChange={(e) => setParamComment(+e.target.value)}>
        {COMMENTS.map((c) => <option key={c.id} value={c.id}>#{c.id} — "{c.text}"</option>)}
      </select>
    );
  }

  return (
    <div className="widget">
      <div className="widget-title">NoSQL — same data, three shapes</div>

      <div className="controls" style={{ flexWrap: 'wrap' }}>
        <span style={{ ...labelStyle, alignSelf: 'center', marginRight: '0.3rem' }}>Model</span>
        {Object.entries(MODELS).map(([k, m]) => (
          <button key={k} className={`btn ${model === k ? 'btn-accent' : ''}`} onClick={() => setModel(k)}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="controls" style={{ flexWrap: 'wrap' }}>
        <span style={{ ...labelStyle, alignSelf: 'center', marginRight: '0.3rem' }}>Query</span>
        {Object.entries(QUERIES).map(([k, q]) => (
          <button key={k} className={`btn ${queryKey === k ? 'btn-accent' : ''}`} onClick={() => setQueryKey(k)}>
            {q.label}
          </button>
        ))}
      </div>

      <div className="controls" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ ...labelStyle, marginRight: '0.3rem' }}>
          {query.param === 'user' && 'X = user'}
          {query.param === 'post' && 'Y = post'}
          {query.param === 'comment' && 'target comment'}
        </span>
        {renderParamPicker()}
      </div>

      <div className="widget-stage" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(220px, 1fr) minmax(280px, 1.4fr)',
        gap: '1rem', alignItems: 'start', padding: '0.9rem 1rem', minHeight: 260,
      }}>
        {/* LEFT: storage shape */}
        <div>
          <div style={{ ...labelStyle, marginBottom: '0.3rem' }}>
            Storage shape — {MODELS[model].sublabel}
          </div>
          <pre className="code-block" style={{ maxHeight: 280, overflow: 'auto' }}>
            {schemaPreview(model)}
          </pre>
        </div>

        {/* RIGHT: query + result + verdict */}
        <div>
          <div style={{ ...labelStyle, marginBottom: '0.3rem' }}>{MODELS[model].lang}</div>
          <pre className="code-block" style={{ marginBottom: '0.6rem' }}>{result.query}</pre>

          <div style={{ ...labelStyle, marginBottom: '0.3rem' }}>Result</div>
          <pre className="code-block" style={{ maxHeight: 180, overflow: 'auto' }}>
            {snippet(result.result, 360)}
          </pre>

          <div style={{
            marginTop: '0.6rem', padding: '0.5rem 0.7rem',
            border: '2px solid var(--ink)', borderRadius: 'var(--radius)',
            background: 'var(--paper)', fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem', color: verdictColor, fontWeight: 600,
          }}>
            {result.verdict}
          </div>
        </div>
      </div>

      <div className="metrics">
        <div className="metric accent">
          <div className="label">Ops</div><div className="value">{ops}</div>
        </div>
        <div className="metric">
          <div className="label">Reads</div><div className="value">{result.reads}</div>
        </div>
        <div className="metric">
          <div className="label">Writes</div><div className="value">{result.writes}</div>
        </div>
        <div className="metric">
          <div className="label">Rename "ada" costs</div>
          <div className="value" style={{ fontSize: '1.4rem' }}>
            {denorm.writes} {denorm.writes === 1 ? 'write' : 'writes'}
          </div>
        </div>
      </div>

      <div className="callout">
        <strong>Denormalisation tax.</strong> {denorm.detail}
        {' '}A relational schema stores each fact once; document and key-value stores
        trade that for fast aggregate reads. The right choice depends on which
        queries dominate your workload.
      </div>
    </div>
  );
}
