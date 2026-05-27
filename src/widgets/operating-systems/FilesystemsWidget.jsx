import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Tiny pretend filesystem: 8 inodes (#0 = root /), 16 data blocks (4 KB each).
// ext4 journaling: metadata is journalled; a crash mid-write can still leave a
//   torn *data* block (journal=metadata-only by default).
// COW (ZFS/btrfs): new data goes to free blocks, inode pointer flips atomically.
//   Crash before the flip = old data intact, nothing damaged.

const NUM_INODES = 8;
const NUM_BLOCKS = 16;
const BLOCK_SIZE = 4; // KB, for display

function emptyFS() {
  const inodes = Array.from({ length: NUM_INODES }, (_, i) => ({
    id: i,
    used: i === 0,
    type: i === 0 ? 'dir' : null,
    size: i === 0 ? 0 : 0,
    blocks: [],
    links: i === 0 ? 1 : 0,
  }));
  const blocks = Array.from({ length: NUM_BLOCKS }, () => ({ used: false, fill: 0, owner: null }));
  const dirents = []; // { name, inode }
  return { inodes, blocks, dirents };
}

function cloneFS(fs) {
  return {
    inodes: fs.inodes.map((n) => ({ ...n, blocks: [...n.blocks] })),
    blocks: fs.blocks.map((b) => ({ ...b })),
    dirents: fs.dirents.map((d) => ({ ...d })),
  };
}

function allocInode(fs) {
  return fs.inodes.find((n) => !n.used) || null;
}
function freeBlocks(fs) {
  return fs.blocks.filter((b) => !b.used);
}

const FS_TYPES = {
  ext4: { label: 'ext4 (journaling)', short: 'ext4' },
  cow:  { label: 'ZFS / btrfs (COW)', short: 'COW' },
};

export default function FilesystemsWidget() {
  const [fs, setFs] = useState(() => {
    // seed with a couple of files so the picture isn't empty.
    const f = emptyFS();
    const a = f.inodes[1];
    a.used = true; a.type = 'file'; a.size = 6; a.blocks = [0, 1]; a.links = 1;
    f.blocks[0] = { used: true, fill: 1.0, owner: 1 };
    f.blocks[1] = { used: true, fill: 0.5, owner: 1 };
    f.dirents.push({ name: 'notes.txt', inode: 1 });
    f.inodes[0].size = f.dirents.length;
    return f;
  });
  const [fsType, setFsType] = useState('ext4');
  const [writeSize, setWriteSize] = useState(8); // KB
  const [selected, setSelected] = useState(1);   // inode id
  const [filename, setFilename] = useState('file.txt');
  const [linkname, setLinkname] = useState('alias.txt');
  const [renameTo, setRenameTo] = useState('renamed.txt');
  const [log, setLog] = useState('Tip: select an inode in the table, then write / rename / delete it.');
  const [crash, setCrash] = useState(null); // { fsType, recovered: boolean, corrupted: boolean, caption }

  function note(msg) { setLog(msg); }

  function withFS(mut) {
    setFs((cur) => {
      const next = cloneFS(cur);
      mut(next);
      // keep root dir size = dirent count
      next.inodes[0].size = next.dirents.length;
      return next;
    });
    setCrash(null);
  }

  function doCreate() {
    if (!filename.trim()) { note('Give the file a name first.'); return; }
    if (fs.dirents.some((d) => d.name === filename)) { note(`"${filename}" already exists.`); return; }
    withFS((next) => {
      const ino = allocInode(next);
      if (!ino) { note('Out of inodes.'); return; }
      ino.used = true; ino.type = 'file'; ino.size = 0; ino.blocks = []; ino.links = 1;
      next.dirents.push({ name: filename, inode: ino.id });
      setSelected(ino.id);
      note(`create("${filename}") -> allocated inode #${ino.id}, 0 data blocks.`);
    });
  }

  function doWrite() {
    const inode = fs.inodes[selected];
    if (!inode || !inode.used || inode.type !== 'file') { note('Select a file inode first.'); return; }
    const blocksNeeded = Math.max(1, Math.ceil(writeSize / BLOCK_SIZE));
    withFS((next) => {
      const n = next.inodes[selected];
      // free its current blocks
      for (const b of n.blocks) next.blocks[b] = { used: false, fill: 0, owner: null };
      n.blocks = [];
      const free = next.blocks.map((b, i) => (b.used ? -1 : i)).filter((i) => i >= 0);
      if (free.length < blocksNeeded) { note(`Not enough free blocks (need ${blocksNeeded}, have ${free.length}).`); return; }
      let remaining = writeSize;
      for (let i = 0; i < blocksNeeded; i++) {
        const bi = free[i];
        const chunk = Math.min(BLOCK_SIZE, remaining);
        next.blocks[bi] = { used: true, fill: chunk / BLOCK_SIZE, owner: n.id };
        n.blocks.push(bi);
        remaining -= chunk;
      }
      n.size = writeSize;
      note(`write(inode #${n.id}, ${writeSize} KB) -> ${blocksNeeded} block(s): [${n.blocks.join(', ')}].`);
    });
  }

  function doRename() {
    if (!renameTo.trim()) { note('Type a new name.'); return; }
    const entry = fs.dirents.find((d) => d.inode === selected);
    if (!entry) { note('Selected inode has no directory entry.'); return; }
    if (fs.dirents.some((d) => d.name === renameTo)) { note(`"${renameTo}" already exists.`); return; }
    withFS((next) => {
      const e = next.dirents.find((d) => d.inode === selected);
      const oldName = e.name; e.name = renameTo;
      note(`rename("${oldName}" -> "${renameTo}") — inode #${selected} unchanged, only the dirent.`);
    });
  }

  function doDelete() {
    const inode = fs.inodes[selected];
    if (!inode || !inode.used || inode.id === 0) { note('Pick a non-root used inode.'); return; }
    withFS((next) => {
      const n = next.inodes[selected];
      // remove ALL dirents pointing at it (hardlinks)
      const removed = next.dirents.filter((d) => d.inode === selected).map((d) => d.name);
      next.dirents = next.dirents.filter((d) => d.inode !== selected);
      n.links = 0;
      // free blocks + inode (unlink == 0 links == free)
      for (const b of n.blocks) next.blocks[b] = { used: false, fill: 0, owner: null };
      n.used = false; n.type = null; n.size = 0; n.blocks = [];
      setSelected(0);
      note(`unlink: removed dirent(s) [${removed.join(', ')}], freed inode + ${removed.length ? '' : ''}data blocks.`);
    });
  }

  function doHardlink() {
    const inode = fs.inodes[selected];
    if (!inode || !inode.used || inode.type !== 'file') { note('Hardlink target must be a file inode.'); return; }
    if (!linkname.trim()) { note('Give the hardlink a name.'); return; }
    if (fs.dirents.some((d) => d.name === linkname)) { note(`"${linkname}" already exists.`); return; }
    withFS((next) => {
      next.dirents.push({ name: linkname, inode: selected });
      next.inodes[selected].links += 1;
      note(`link("${linkname}" -> inode #${selected}) — same data, two names. link count = ${next.inodes[selected].links}.`);
    });
  }

  function doCrashMidWrite() {
    const inode = fs.inodes[selected];
    if (!inode || !inode.used || inode.type !== 'file' || inode.blocks.length === 0) {
      note('Pick a file with data, then crash a write to it.');
      return;
    }
    // Simulate: we asked to overwrite the file with writeSize KB. Power goes
    // out *between* the data-block writes and the metadata commit.
    if (fsType === 'ext4') {
      // Journal replay reconciles metadata; the last data block is left torn.
      withFS((next) => {
        const n = next.inodes[selected];
        if (n.blocks.length === 0) return;
        const torn = n.blocks[n.blocks.length - 1];
        next.blocks[torn] = { ...next.blocks[torn], fill: 0.35 };
      });
      setCrash({
        fsType: 'ext4',
        corrupted: true,
        caption: 'Journal replay restores metadata consistency — inode + dirent agree. '
               + 'But ext4 journals metadata only by default: the half-written data block stays torn. '
               + 'The file opens, the bytes are garbage.',
      });
    } else {
      // COW: pointer never flipped — inode still references old blocks.
      setCrash({
        fsType: 'cow',
        corrupted: false,
        caption: 'COW wrote the new data to *fresh* blocks and was about to swing the inode pointer. '
               + 'Crash hit before the swing. On reboot the inode still points at the old blocks. '
               + 'Old contents intact. No fsck. No torn write.',
      });
    }
    note('Simulated power loss mid-write.');
  }

  function resetFS() {
    setFs(emptyFS());
    setSelected(0);
    setCrash(null);
    note('Filesystem wiped. Only root / remains.');
  }

  // ---------- metrics ----------
  const metrics = useMemo(() => {
    const files = fs.inodes.filter((n) => n.used && n.type === 'file').length;
    const inodesUsed = fs.inodes.filter((n) => n.used).length;
    const blocksUsed = fs.blocks.filter((b) => b.used).length;
    const freePct = Math.round(((NUM_BLOCKS - blocksUsed) / NUM_BLOCKS) * 100);
    return { files, inodesUsed, blocksUsed, freePct };
  }, [fs]);

  const corruptBadge = fsType === 'ext4' ? 'maybe (torn data block)' : 'no';

  // ---------- visualisation ----------
  const inode = fs.inodes[selected];

  return (
    <div className="widget">
      <div className="widget-title">Filesystems — inodes, journaling, COW</div>

      <div className="controls pill-group" style={{ flexWrap: 'wrap' }}>
        {Object.entries(FS_TYPES).map(([k, v]) => (
          <label key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            <input type="radio" name="fs-type" checked={fsType === k} onChange={() => { setFsType(k); setCrash(null); }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>{v.label}</span>
          </label>
        ))}
      </div>

      <div className="controls" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="field" style={{ width: 130 }} value={filename} onChange={(e) => setFilename(e.target.value)} placeholder="filename" />
        <button className="btn btn-accent" onClick={doCreate}>create</button>
        <button className="btn" onClick={doWrite}>write</button>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
          size
          <input type="range" min={1} max={32} step={1} value={writeSize} onChange={(e) => setWriteSize(+e.target.value)} />
          <span style={{ minWidth: 38 }}>{writeSize} KB</span>
        </label>
      </div>

      <div className="controls" style={{ flexWrap: 'wrap' }}>
        <input className="field" style={{ width: 130 }} value={renameTo} onChange={(e) => setRenameTo(e.target.value)} placeholder="new name" />
        <button className="btn" onClick={doRename}>rename</button>
        <input className="field" style={{ width: 130 }} value={linkname} onChange={(e) => setLinkname(e.target.value)} placeholder="hardlink name" />
        <button className="btn" onClick={doHardlink}>hardlink</button>
        <button className="btn" onClick={doDelete}>delete</button>
        <button className="btn btn-accent" onClick={doCrashMidWrite} style={{ marginLeft: 'auto' }}>
          crash mid-write
        </button>
        <button className="btn btn-ghost" onClick={resetFS}>reset</button>
      </div>

      <div className="widget-stage" style={{ minHeight: 360 }}>
        <svg viewBox="0 0 720 360" width="100%" style={{ maxWidth: 740 }}>
          {/* superblock */}
          <g>
            <rect x={10} y={10} width={140} height={56} rx={6} fill="var(--paper-deep)" stroke="var(--ink)" strokeWidth={2.5} />
            <text x={80} y={30} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>superblock</text>
            <text x={80} y={47} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}>
              type: {FS_TYPES[fsType].short}
            </text>
            <text x={80} y={60} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}>
              {NUM_INODES} inodes · {NUM_BLOCKS} blocks
            </text>
          </g>

          {/* root directory (inode 0) dirents */}
          <g>
            <text x={170} y={26} style={{ fontFamily: 'var(--font-display)', fontSize: 12 }}>dirents in /</text>
            {fs.dirents.length === 0 && (
              <text x={170} y={50} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-faint)' }}>
                (empty)
              </text>
            )}
            {fs.dirents.map((d, i) => (
              <g key={`${d.name}-${d.inode}`} transform={`translate(${170 + (i % 4) * 130}, ${38 + Math.floor(i / 4) * 22})`}>
                <rect width={120} height={18} rx={3} fill="var(--paper)" stroke="var(--ink)" strokeWidth={1.5} />
                <text x={6} y={13} style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{d.name}</text>
                <text x={114} y={13} textAnchor="end" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--accent)' }}>
                  -&gt; #{d.inode}
                </text>
              </g>
            ))}
          </g>

          {/* inode table */}
          <g transform="translate(10, 100)">
            <text x={0} y={-4} style={{ fontFamily: 'var(--font-display)', fontSize: 12 }}>inode table</text>
            {fs.inodes.map((n, i) => {
              const x = (i % 4) * 175;
              const y = Math.floor(i / 4) * 80 + 4;
              const isSel = selected === i;
              return (
                <g key={i} transform={`translate(${x}, ${y})`} style={{ cursor: 'pointer' }} onClick={() => setSelected(i)}>
                  <rect width={165} height={72} rx={5}
                    fill={n.used ? 'var(--paper)' : 'var(--paper-deep)'}
                    stroke={isSel ? 'var(--accent)' : 'var(--ink)'} strokeWidth={isSel ? 3 : 1.8} />
                  <text x={8} y={14} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700 }}>
                    #{i} {n.used ? (n.type === 'dir' ? '[dir]' : '[file]') : '[free]'}
                  </text>
                  <text x={157} y={14} textAnchor="end" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}>
                    links: {n.links}
                  </text>
                  <text x={8} y={30} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}>
                    size: {n.used ? (n.type === 'dir' ? `${n.size} entries` : `${n.size} KB`) : '-'}
                  </text>
                  <text x={8} y={45} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}>
                    ptrs:
                  </text>
                  <text x={36} y={45} style={{ fontFamily: 'var(--font-mono)', fontSize: 9 }}>
                    {n.used && n.blocks.length ? `[${n.blocks.join(', ')}]` : (n.used ? '[]' : '-')}
                  </text>
                  {/* mini block strip */}
                  <g transform="translate(8, 52)">
                    {Array.from({ length: 8 }).map((_, k) => {
                      const filled = n.blocks[k] !== undefined;
                      return (
                        <rect key={k} x={k * 18} y={0} width={16} height={14} rx={2}
                          fill={filled ? 'var(--accent)' : 'var(--paper-deep)'}
                          stroke="var(--ink)" strokeWidth={1} />
                      );
                    })}
                  </g>
                </g>
              );
            })}
          </g>

          {/* data blocks */}
          <g transform="translate(10, 280)">
            <text x={0} y={-4} style={{ fontFamily: 'var(--font-display)', fontSize: 12 }}>data blocks</text>
            {fs.blocks.map((b, i) => {
              const x = i * 42;
              const ownedBySelected = b.owner === selected && selected !== 0;
              return (
                <g key={i} transform={`translate(${x}, 4)`}>
                  <rect width={38} height={50} rx={4}
                    fill="var(--paper-deep)" stroke={ownedBySelected ? 'var(--accent)' : 'var(--ink)'} strokeWidth={ownedBySelected ? 2.5 : 1.5} />
                  <AnimatePresence>
                    {b.used && (
                      <motion.rect
                        key={`fill-${i}-${b.owner}-${b.fill}`}
                        initial={{ height: 0, y: 50 }}
                        animate={{ height: 50 * b.fill, y: 50 - 50 * b.fill }}
                        transition={{ duration: 0.25 }}
                        width={38} rx={4}
                        fill={b.fill < 0.5 ? '#e0aa3e' : 'var(--accent)'} opacity={0.85} />
                    )}
                  </AnimatePresence>
                  <text x={19} y={62} textAnchor="middle"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-soft)' }}>
                    {i}
                  </text>
                  {b.used && b.owner != null && (
                    <text x={19} y={14} textAnchor="middle"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, fill: 'white' }}>
                      #{b.owner}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="metrics">
        <div className="metric"><div className="label">files</div><div className="value">{metrics.files}</div></div>
        <div className="metric"><div className="label">inodes used</div><div className="value">{metrics.inodesUsed} / {NUM_INODES}</div></div>
        <div className="metric"><div className="label">blocks used</div><div className="value">{metrics.blocksUsed} / {NUM_BLOCKS}</div></div>
        <div className="metric"><div className="label">free space</div><div className="value">{metrics.freePct}%</div></div>
        <div className={`metric ${fsType === 'ext4' ? 'accent' : ''}`}>
          <div className="label">crash corrupts?</div>
          <div className="value" style={{ fontSize: '1rem' }}>{corruptBadge}</div>
        </div>
      </div>

      <div className="callout">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{log}</div>
        {inode && inode.used && (
          <div style={{ marginTop: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
            selected: inode #{inode.id} ({inode.type}), {inode.type === 'dir' ? `${inode.size} entries` : `${inode.size} KB`},
            blocks [{inode.blocks.join(', ') || '—'}], links {inode.links}
          </div>
        )}
        {crash && (
          <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.7rem', borderRadius: 6,
            border: `2px solid ${crash.corrupted ? 'var(--accent)' : '#2a8a3e'}`,
            background: crash.corrupted ? '#fde2e2' : '#e6f4ea' }}>
            <strong>{crash.corrupted ? 'Recovered — but data is torn.' : 'Recovered cleanly.'}</strong>{' '}
            {crash.caption}
          </div>
        )}
      </div>
    </div>
  );
}
