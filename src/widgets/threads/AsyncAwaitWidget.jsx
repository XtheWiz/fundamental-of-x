import { useState } from 'react';

const SAMPLES = {
  js: `// JavaScript — single-threaded event loop
async function fetchUser(id) {
  const res = await fetch(\`/users/\${id}\`);
  const user = await res.json();
  return user;
}

const [a, b] = await Promise.all([
  fetchUser(1),
  fetchUser(2),
]);`,
  python: `# Python — asyncio, also single-threaded
import aiohttp, asyncio

async def fetch_user(session, id):
    async with session.get(f"/users/{id}") as r:
        return await r.json()

async def main():
    async with aiohttp.ClientSession() as s:
        a, b = await asyncio.gather(
            fetch_user(s, 1),
            fetch_user(s, 2),
        )

asyncio.run(main())`,
  rust: `// Rust — tokio, multi-threaded executor
use reqwest::Client;

async fn fetch_user(c: &Client, id: u32) -> reqwest::Result<User> {
    c.get(&format!("/users/{}", id)).send().await?.json().await
}

#[tokio::main]
async fn main() -> reqwest::Result<()> {
    let c = Client::new();
    let (a, b) = tokio::try_join!(
        fetch_user(&c, 1),
        fetch_user(&c, 2),
    )?;
    Ok(())
}`,
};

const NOTES = {
  js: <>Single-threaded. await yields back to the event loop; no other JS runs in this isolate. Data races impossible by construction.</>,
  python: <>Same model as JS — one event loop, no true parallelism (GIL aside). Concurrency without thread safety pain.</>,
  rust: <>tokio runs futures on a thread pool. await can resume on any worker thread, so types must be Send. The "coloured functions" cost is real here.</>,
};

export default function AsyncAwaitWidget() {
  const [lang, setLang] = useState('js');

  return (
    <div className="widget">
      <div className="widget-title">async / await — three languages, same shape</div>
      <div className="controls">
        <button className={`btn ${lang === 'js' ? 'btn-accent' : ''}`} onClick={() => setLang('js')}>JavaScript</button>
        <button className={`btn ${lang === 'python' ? 'btn-accent' : ''}`} onClick={() => setLang('python')}>Python</button>
        <button className={`btn ${lang === 'rust' ? 'btn-accent' : ''}`} onClick={() => setLang('rust')}>Rust (tokio)</button>
      </div>
      <div className="widget-stage" style={{ minHeight: 320 }}>
        <pre className="code-block" style={{ margin: 0, maxHeight: 360 }}>{SAMPLES[lang]}</pre>
      </div>
      <div className="callout">{NOTES[lang]}</div>
    </div>
  );
}
