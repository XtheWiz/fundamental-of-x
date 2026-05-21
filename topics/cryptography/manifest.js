// Cryptography topic manifest.

export const manifest = {
  slug: 'cryptography',
  title: 'Cryptography',
  tagline: 'How math turns secrets into safe, signed, sealed messages.',
  lessons: [
    {
      slug: 'hashing',
      title: 'Hashing',
      blurb: 'One-way functions, the avalanche effect, and why a single character changes everything.',
    },
    {
      slug: 'symmetric',
      title: 'Symmetric Crypto',
      blurb: 'AES, ChaCha20, and the eternal problem: how do you share the key without exposing it?',
    },
    {
      slug: 'asymmetric',
      title: 'Asymmetric Crypto',
      blurb: 'A keypair where one half is public and the other half is yours. The math that changed cryptography.',
    },
    {
      slug: 'diffie-hellman',
      title: 'Diffie-Hellman',
      blurb: 'Two strangers agree on a shared secret while shouting numbers across a crowded room.',
    },
    {
      slug: 'signatures',
      title: 'Digital Signatures',
      blurb: 'Sign with private, verify with public. Change one byte of the message — watch the verification fail.',
    },
    {
      slug: 'certificates',
      title: 'Certificate Chains',
      blurb: 'Why does your browser trust a stranger\'s site? Trace the chain from leaf cert up to a root CA.',
    },
    {
      slug: 'password-hashing',
      title: 'Password Hashing',
      blurb: 'bcrypt vs raw SHA-256 in a timing race. Salts, work factors, and why rainbow tables exist.',
    },
    {
      slug: 'tls-revisited',
      title: 'TLS Revisited',
      blurb: 'Now that you know the primitives, walk through the TLS handshake again — and see how they all fit.',
    },
  ],
};
