import LegacyWidget from '../widgets/database/LegacyWidget.jsx';
import { initHashingWidget } from '../widgets/cryptography/legacy/hashing.js';
import { initSymmetricWidget } from '../widgets/cryptography/legacy/symmetric.js';
import { initAsymmetricWidget } from '../widgets/cryptography/legacy/asymmetric.js';
import { initDhWidget } from '../widgets/cryptography/legacy/diffie-hellman.js';
import { initSignaturesWidget } from '../widgets/cryptography/legacy/signatures.js';
import { initCertificatesWidget } from '../widgets/cryptography/legacy/certificates.js';
import { initPasswordHashingWidget } from '../widgets/cryptography/legacy/password-hashing.js';
import { initTlsRevisitedWidget } from '../widgets/cryptography/legacy/tls-revisited.js';

const W = (init) => () => <LegacyWidget init={init} />;

export const manifest = {
  slug: 'cryptography',
  title: 'Cryptography',
  intro: <>Eight lessons walking up from one-way hash functions to the full TLS handshake — symmetric and asymmetric crypto, key exchange, signatures, certificates, and password hashing.</>,
  lessons: [
    { slug: 'hashing', number: '01', title: 'Hashing', blurb: 'One-way functions, the avalanche effect, and why a single character changes everything.', Widget: W(initHashingWidget),
      intro: <>A cryptographic hash takes any input and produces a fixed-size fingerprint. Easy forward, impossible to reverse, and tiny input changes produce wildly different outputs.</>, sections: [],
      takeaways: ['One-way: easy to compute, infeasible to invert.', 'Deterministic: same input → same hash.', 'Avalanche: flip one bit, half the output bits flip.', 'SHA-256, BLAKE3 are modern defaults; MD5 and SHA-1 are broken.'] },
    { slug: 'symmetric', number: '02', title: 'Symmetric Crypto', blurb: 'AES, ChaCha20, and the eternal problem: how do you share the key without exposing it?', Widget: W(initSymmetricWidget),
      intro: <>Same key encrypts and decrypts. Fast (microseconds for kilobytes), but only useful if both parties already share the key.</>, sections: [],
      takeaways: ['AES-256-GCM is the modern default — fast on hardware, authenticated.', 'Never use ECB mode. CBC is fine if you authenticate; GCM does both.', 'The "key distribution problem" is what asymmetric crypto solves.', 'For real systems: derive keys with HKDF, never reuse a nonce with GCM.'] },
    { slug: 'asymmetric', number: '03', title: 'Asymmetric Crypto', blurb: 'A keypair where one half is public and the other half is yours.', Widget: W(initAsymmetricWidget),
      intro: <>Two mathematically linked keys. Encrypt with one, decrypt with the other. Same trick gives us signatures, key exchange, and identity.</>, sections: [],
      takeaways: ['RSA: based on factoring large primes. Slow but well-understood.', 'Elliptic curve (Ed25519, X25519): smaller keys, same security, faster.', '1000× slower than symmetric — used only for setup, not bulk encryption.', 'Public key = "send me secrets". Private key = "this is me".'] },
    { slug: 'diffie-hellman', number: '04', title: 'Diffie-Hellman', blurb: 'Two strangers agree on a shared secret while shouting numbers across a crowded room.', Widget: W(initDhWidget),
      intro: <>Both parties pick a secret, exchange a derived public value, and combine to land on the same shared key — without ever sending it. The foundation of every TLS connection.</>, sections: [],
      takeaways: ['Each side computes the same secret from public + their private — without transmitting it.', 'Eavesdropper sees both public values but cannot derive the shared secret.', 'Ephemeral DH (DHE/ECDHE) gives forward secrecy — past sessions stay safe if a long-term key leaks.', 'Modern TLS always uses ephemeral key exchange.'] },
    { slug: 'signatures', number: '05', title: 'Digital Signatures', blurb: 'Sign with private, verify with public. Change one byte — verification fails.', Widget: W(initSignaturesWidget),
      intro: <>A signature proves who wrote a message and that nobody changed it. Hash the message, encrypt the hash with your private key, anyone can verify with your public key.</>, sections: [],
      takeaways: ['Authentication: only the private key holder can produce the signature.', 'Integrity: any change to the message invalidates the signature.', 'Non-repudiation: signer can\'t later deny signing.', 'Ed25519 is the modern default — fast, small, side-channel resistant.'] },
    { slug: 'certificates', number: '06', title: 'Certificate Chains', blurb: 'Why does your browser trust a stranger\'s site?', Widget: W(initCertificatesWidget),
      intro: <>Certificates are signed claims about who owns a public key. Chains of them go up to root CAs that your browser already trusts. Trust transfers down the chain.</>, sections: [],
      takeaways: ['Browsers ship a list of trusted root CAs.', 'A leaf cert says "this key is example.com" — signed by an intermediate.', 'Intermediate is signed by a root. Browser verifies the whole chain.', 'Misissued certs are revoked via OCSP or CRLs (slowly and unreliably).'] },
    { slug: 'password-hashing', number: '07', title: 'Password Hashing', blurb: 'bcrypt vs raw SHA-256 in a timing race. Salts, work factors, and why rainbow tables exist.', Widget: W(initPasswordHashingWidget),
      intro: <>Storing passwords means assuming your database will leak. Hash them with a deliberately slow function so brute-force costs become prohibitive.</>, sections: [],
      takeaways: ['Never store plaintext passwords. Never.', 'Use bcrypt, scrypt, or Argon2 — slow on purpose.', 'Salt per user prevents rainbow-table attacks across users.', 'Tune the work factor so a single hash takes ~100 ms on your hardware.'] },
    { slug: 'tls-revisited', number: '08', title: 'TLS Revisited', blurb: 'Now that you know the primitives, walk through the TLS handshake again.', Widget: W(initTlsRevisitedWidget),
      intro: <>Every TLS connection uses hashing, signatures, asymmetric key exchange, certificates, and symmetric encryption in sequence. With the primitives in hand, you can see how they fit.</>, sections: [],
      takeaways: ['ClientHello/ServerHello negotiate version + cipher suite.', 'Key exchange (ECDHE) establishes the session key.', 'Certificate (signed by a CA) authenticates the server.', 'Bulk data flows over symmetric AES-GCM thereafter.'] },
  ],
};
