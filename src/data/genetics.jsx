import HelixWidget from '../widgets/genetics/HelixWidget.jsx';
import ReplicationWidget from '../widgets/genetics/ReplicationWidget.jsx';
import TranscriptionWidget from '../widgets/genetics/TranscriptionWidget.jsx';
import TranslationWidget from '../widgets/genetics/TranslationWidget.jsx';
import MutationsWidget from '../widgets/genetics/MutationsWidget.jsx';
import SequencingWidget from '../widgets/genetics/SequencingWidget.jsx';
import AlignmentWidget from '../widgets/genetics/AlignmentWidget.jsx';
import CrisprWidget from '../widgets/genetics/CrisprWidget.jsx';

export const manifest = {
  slug: 'genetics',
  title: 'Genetics',
  tagline: "DNA's molecular machinery — how cells store, copy, and run a program written in four letters.",
  intro: (
    <>
      Life runs on a program written in four letters. These eight lessons walk
      from the double helix down to gene editing: how DNA stores information,
      how it copies itself, how it turns into protein, how we read it, and
      how we now rewrite it.
    </>
  ),
  lessons: [
    {
      slug: 'helix',
      number: '01',
      title: 'The Double Helix',
      blurb: 'Two strands, four bases, one elegant pairing rule. A-T and G-C, twisting around each other.',
      Widget: HelixWidget,
      intro: <>DNA is a long polymer of four bases — <strong>A</strong>denine, <strong>T</strong>hymine, <strong>G</strong>uanine, <strong>C</strong>ytosine — strung along a sugar-phosphate backbone. Two such strands twist around each other, held together by a strict pairing rule: A always pairs with T, G always pairs with C.</>,
      sections: [{
        heading: 'Why the pairing rule matters',
        body: (
          <>
            <p>The pairing is what makes DNA both a stable store and an easy copy. The two strands carry redundant information — given one, you can reconstruct the other. Every later trick (replication, transcription, repair) is built on this complementarity.</p>
            <ul>
              <li><strong>A · T</strong> share two hydrogen bonds.</li>
              <li><strong>G · C</strong> share three hydrogen bonds — slightly tighter, so GC-rich DNA melts at higher temperatures.</li>
              <li>The two strands run <em>antiparallel</em> (5'→3' on one, 3'→5' on the other) — important for everything that reads them.</li>
            </ul>
          </>
        ),
      }],
      takeaways: [
        'Four bases, two pairing rules. Everything else is downstream.',
        'Each strand fully specifies the other — DNA is its own backup.',
        'The helix is about 10 base pairs per full turn; the major and minor grooves are where most proteins read it.',
        'Genomes are huge: ~3 billion base pairs in a human, packed into 2 metres of DNA per cell.',
      ],
    },
    {
      slug: 'replication',
      number: '02',
      title: 'DNA Replication',
      blurb: 'A fork opens, polymerase races down each strand, and one cell becomes two — with two identical copies of the genome.',
      Widget: ReplicationWidget,
      intro: <>Before a cell divides, it must copy its entire genome. A fork opens, the strands separate, and each one acts as a template for a new partner. The result: two double helices identical to the original.</>,
      sections: [{
        heading: 'The fork machinery',
        body: (
          <>
            <ul>
              <li><strong>Helicase</strong> unwinds the helix and pulls the strands apart.</li>
              <li><strong>DNA polymerase</strong> reads each template strand and synthesizes the complement, one base at a time, 5'→3'.</li>
              <li><strong>Leading strand</strong> is synthesized continuously toward the fork.</li>
              <li><strong>Lagging strand</strong> can only be made in chunks (Okazaki fragments), because polymerase only works in one direction. Ligase stitches them together.</li>
            </ul>
            <p>This is <em>semiconservative</em> replication — each daughter helix has one old strand and one new one.</p>
          </>
        ),
      }],
      takeaways: [
        'Two daughter helices, each half-old, half-new. Confirmed by the famous Meselson-Stahl experiment in 1958.',
        'Polymerase is one-directional — that asymmetry is why the lagging strand exists.',
        'Error rate is ~1 per billion bases after proofreading. Mutations slip through anyway.',
        'Replication is fast: 50 bases/second per fork, with thousands of forks active at once.',
      ],
    },
    {
      slug: 'transcription',
      number: '03',
      title: 'Transcription',
      blurb: 'RNA polymerase reads DNA and writes a single-stranded mRNA copy. The first step of expressing a gene.',
      Widget: TranscriptionWidget,
      intro: <>To <em>express</em> a gene, the cell makes an RNA copy of it. RNA polymerase opens a short bubble in the DNA, reads one strand, and builds a single-stranded messenger RNA using the same base-pairing rule — except U replaces T.</>,
      sections: [{
        heading: 'The DNA→RNA mapping',
        body: (
          <>
            <ul>
              <li>A in DNA → U in RNA (not T!)</li>
              <li>T in DNA → A in RNA</li>
              <li>G in DNA → C in RNA</li>
              <li>C in DNA → G in RNA</li>
            </ul>
            <p>RNA is chemically a little different from DNA — an extra hydroxyl on the sugar makes it less stable, but that's fine because mRNA is meant to be temporary. It's the work order, not the master copy.</p>
          </>
        ),
      }],
      takeaways: [
        'mRNA is a working copy. The DNA stays in the nucleus; mRNA travels to the ribosome.',
        'The "template strand" is the one read by polymerase; the mRNA matches the other (coding) strand — with U instead of T.',
        'Eukaryotic mRNA gets capped, tailed, and spliced before leaving the nucleus.',
        'One gene can be transcribed many times in parallel — that\'s how cells dial expression up and down.',
      ],
    },
    {
      slug: 'translation',
      number: '04',
      title: 'Translation',
      blurb: 'Ribosomes walk the mRNA three letters at a time. Each codon picks an amino acid. Proteins emerge.',
      Widget: TranslationWidget,
      intro: <>The mRNA leaves the nucleus. A ribosome grabs it and reads three letters (a <em>codon</em>) at a time, looking each one up in the genetic code to grab the matching amino acid. The amino acids form a chain — that's the protein.</>,
      sections: [{
        heading: 'The genetic code',
        body: (
          <>
            <p>There are 4 RNA bases and 3 positions per codon, so 4³ = 64 codons. They encode 20 amino acids plus a stop signal — meaning the code is <em>redundant</em>: most amino acids have multiple codons (e.g. Leucine has six). The redundancy makes the code robust to point mutations.</p>
            <p>Translation always starts at <code>AUG</code> (which codes for Methionine) and ends when one of three stop codons (UAA, UAG, UGA) is read.</p>
          </>
        ),
      }],
      takeaways: [
        'The genetic code is nearly universal — bacteria, plants, and humans use the same table (with tiny mitochondrial exceptions).',
        'Redundancy ("wobble") protects against mutations in the third codon position — many silent mutations land here.',
        'Frame matters: shift the starting point by one base and the whole protein changes — that\'s a frameshift mutation.',
        'The same mRNA can be translated by many ribosomes simultaneously (a polysome), making lots of protein fast.',
      ],
    },
    {
      slug: 'mutations',
      number: '05',
      title: 'Mutations',
      blurb: 'Substitutions, insertions, deletions, frameshifts. Sometimes silent, sometimes catastrophic, sometimes the engine of evolution.',
      Widget: MutationsWidget,
      intro: <>Replication is incredibly accurate but not perfect. UV light, chemicals, and copying errors all leave tiny changes in the DNA. The genetic code's structure decides whether each change is invisible, harmful, or — occasionally — beneficial.</>,
      sections: [{
        heading: 'Four kinds, very different consequences',
        body: (
          <ul>
            <li><strong>Silent</strong> — codon changes but the amino acid stays the same (thanks to the code's redundancy).</li>
            <li><strong>Missense</strong> — amino acid swaps for a different one. Sickle-cell is a single missense mutation in hemoglobin.</li>
            <li><strong>Nonsense</strong> — codon becomes a stop codon. The protein is truncated and usually broken.</li>
            <li><strong>Frameshift</strong> — an insertion or deletion that isn't a multiple of 3 shifts every codon downstream. Almost always catastrophic.</li>
          </ul>
        ),
      }],
      takeaways: [
        'Frameshift > nonsense > missense > silent — in roughly that order of severity.',
        'Most mutations are silent or neutral; that\'s why we accumulate ~70 new mutations per human birth without dying.',
        'Evolution depends on this: rare beneficial mutations get selected for over millions of generations.',
        'Cancer is often driven by accumulating mutations in cell-cycle genes — same machinery, different scale.',
      ],
    },
    {
      slug: 'sequencing',
      number: '06',
      title: 'DNA Sequencing',
      blurb: 'Sanger, Illumina, Nanopore — three generations of "what letters are in this molecule" and the trade-offs between them.',
      Widget: SequencingWidget,
      intro: <>"What letters are in this molecule?" Three generations of technology answer this question with very different trade-offs between read length, accuracy, throughput, and cost.</>,
      sections: [{
        heading: 'Three generations',
        body: (
          <>
            <ul>
              <li><strong>Sanger (1977)</strong> — gold standard for accuracy. One read at a time, ~1000 bp long. The Human Genome Project used 1.5 million Sanger reads.</li>
              <li><strong>Illumina (2007+)</strong> — massively parallel, billions of short reads (50–300 bp). Very cheap, very accurate, but reads are too short to span repeats.</li>
              <li><strong>Nanopore / PacBio (2014+)</strong> — long reads (10kb to 1Mb), spans repeats easily. Higher error rate (~5–10%) but improving fast.</li>
            </ul>
            <p>Real labs combine them: short reads for accuracy, long reads to figure out structure.</p>
          </>
        ),
      }],
      takeaways: [
        'Genome sequencing cost dropped from $3B (2003) to under $200 (today) — faster than Moore\'s law.',
        'Short reads need assembly: a computational puzzle to figure out the original molecule from millions of fragments.',
        'Long reads make assembly easier but error correction harder.',
        'Throughput, length, accuracy, cost — pick three. There is no technology that wins on all four.',
      ],
    },
    {
      slug: 'alignment',
      number: '07',
      title: 'Sequence Alignment',
      blurb: 'Needleman-Wunsch. Fill a matrix, trace back, and discover that human and chimp DNA are 98.8% identical.',
      Widget: AlignmentWidget,
      intro: <>Given two DNA sequences, how similar are they — and where? <em>Needleman-Wunsch</em> is the classic answer: fill a 2D scoring matrix with dynamic programming, then trace back the best path. The path is the alignment.</>,
      sections: [{
        heading: 'The algorithm in one paragraph',
        body: (
          <>
            <p>Each cell <code>M[i][j]</code> holds the best score for aligning the first <code>i</code> characters of sequence A with the first <code>j</code> of sequence B. To fill it, look at three neighbors: the diagonal (match or mismatch), top (insert a gap in A), and left (insert a gap in B). Take the max. After the matrix is full, trace back from the bottom-right to reconstruct which moves got you there.</p>
            <p>The same idea, with slightly different scoring, gives <em>local</em> alignment (Smith-Waterman, used in BLAST).</p>
          </>
        ),
      }],
      takeaways: [
        'O(n·m) time and space — fine for genes, too slow for whole genomes (hence heuristics like BLAST).',
        'The path encodes which bases align, which are mismatches, and where gaps go.',
        'Substitution matrices (BLOSUM, PAM) give chemically similar amino acids better scores than wild swaps.',
        'This algorithm is the basis for genome comparison, phylogeny, gene finding, and a huge chunk of bioinformatics.',
      ],
    },
    {
      slug: 'crispr',
      number: '08',
      title: 'CRISPR Gene Editing',
      blurb: 'A guide RNA finds a target; Cas9 cuts the DNA. The cell repairs it — and you get to choose the new sequence.',
      Widget: CrisprWidget,
      intro: <>A guide RNA finds a matching sequence in the genome. A Cas9 enzyme rides along, recognizes the right neighborhood (a <em>PAM</em> site), and cuts both DNA strands. The cell tries to repair the cut — and that's the moment you can insert, delete, or replace a sequence.</>,
      sections: [{
        heading: 'How the cut becomes an edit',
        body: (
          <ul>
            <li><strong>Guide RNA</strong> — ~20-base RNA you design to match the target. Complementarity decides where Cas9 binds.</li>
            <li><strong>PAM site</strong> — a short motif (usually NGG) just downstream of the target. Cas9 won't cut without it. This is a safety feature evolution gave bacteria; we exploit it.</li>
            <li><strong>Double-strand break</strong> — Cas9 cuts both strands 3 bases upstream of the PAM.</li>
            <li><strong>Repair</strong> — the cell either ligates the ends back (NHEJ, error-prone, usually disables the gene) or copies a template you supply (HDR, slow but precise).</li>
          </ul>
        ),
      }],
      takeaways: [
        'CRISPR turned gene editing from "PhD project" to "kit you order online" — Doudna & Charpentier got the 2020 Nobel for it.',
        'The PAM constraint means you can\'t target absolutely anywhere — design tools search for nearby NGG sites.',
        'NHEJ is good for knockouts; HDR is needed for precise rewrites and is much less efficient (~1%).',
        'The first CRISPR-based therapy (Casgevy for sickle-cell) was approved in 2023.',
      ],
    },
  ],
};
