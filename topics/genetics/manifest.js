// Genetics topic manifest.

export const manifest = {
  slug: 'genetics',
  title: 'Genetics',
  tagline: "DNA's molecular machinery — how cells store, copy, and run a program written in four letters.",
  lessons: [
    { slug: 'helix',         title: 'The Double Helix',     blurb: 'Two strands, four bases, one elegant pairing rule. A-T and G-C, twisting around each other.' },
    { slug: 'replication',   title: 'DNA Replication',      blurb: 'A fork opens, polymerase races down each strand, and one cell becomes two — with two identical copies of the genome.' },
    { slug: 'transcription', title: 'Transcription (DNA→RNA)', blurb: 'RNA polymerase reads DNA and writes a single-stranded mRNA copy. The first step of expressing a gene.' },
    { slug: 'translation',   title: 'Translation (RNA→Protein)', blurb: 'Ribosomes walk the mRNA three letters at a time. Each codon picks an amino acid. Proteins emerge.' },
    { slug: 'mutations',     title: 'Mutations',            blurb: 'Substitutions, insertions, deletions, frameshifts. Sometimes silent, sometimes catastrophic, sometimes the engine of evolution.' },
    { slug: 'sequencing',    title: 'DNA Sequencing',       blurb: 'Sanger, Illumina, Nanopore — three generations of "what letters are in this molecule" and the trade-offs between them.' },
    { slug: 'alignment',     title: 'Sequence Alignment',   blurb: 'Needleman-Wunsch. Fill a matrix, trace back, and discover that human and chimp DNA are 98.8% identical.' },
    { slug: 'crispr',        title: 'CRISPR Gene Editing',  blurb: 'A guide RNA finds a target; Cas9 cuts the DNA. The cell repairs it — and you get to choose the new sequence.' },
  ],
};
