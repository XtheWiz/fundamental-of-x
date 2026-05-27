import BrokenAccessControlWidget from '../widgets/owasp/BrokenAccessControlWidget.jsx';
import CryptoFailuresWidget from '../widgets/owasp/CryptoFailuresWidget.jsx';
import InjectionWidget from '../widgets/owasp/InjectionWidget.jsx';
import InsecureDesignWidget from '../widgets/owasp/InsecureDesignWidget.jsx';
import MisconfigurationWidget from '../widgets/owasp/MisconfigurationWidget.jsx';
import VulnerableComponentsWidget from '../widgets/owasp/VulnerableComponentsWidget.jsx';
import AuthFailuresWidget from '../widgets/owasp/AuthFailuresWidget.jsx';
import IntegrityFailuresWidget from '../widgets/owasp/IntegrityFailuresWidget.jsx';
import LoggingFailuresWidget from '../widgets/owasp/LoggingFailuresWidget.jsx';
import SSRFWidget from '../widgets/owasp/SSRFWidget.jsx';

export const manifest = {
  slug: 'owasp',
  title: 'OWASP Top 10',
  intro: <>Ten lessons, one per official 2021 OWASP category. Every widget pairs the BAD pattern with the GOOD fix in the same sandbox — type a payload, see what unsafe code does to your app, then watch the same payload bounce off the fixed version.</>,
  lessons: [
    { slug: 'a01-access-control', number: '01', title: 'A01 — Broken Access Control',
      blurb: 'Type a different user ID into the URL. With no authz check, you see whose data comes back.',
      Widget: BrokenAccessControlWidget,
      intro: <>The most common web vulnerability of the decade. The bug isn\'t exotic — it\'s a missing one-line check ("does this session\'s user own the resource being asked for?"). The fix isn\'t exotic either. The reason it keeps shipping is that the BAD code looks fine to a reviewer who isn\'t looking for it.</>,
      sections: [],
      takeaways: [
        "Default-deny in your authorisation layer. Every endpoint should require an explicit allow.",
        "Don\'t trust IDs from the client (URL params, hidden form fields). Re-derive ownership server-side from the session.",
        "Test horizontal privilege escalation systematically: every endpoint, every resource, every user role.",
        "Centralise authz — middleware or a policy engine — so reviewers can see what\'s protected at a glance.",
      ] },

    { slug: 'a02-crypto-failures', number: '02', title: 'A02 — Cryptographic Failures',
      blurb: 'Weak hash, plaintext in transit, hardcoded keys. Three classic crypto sins with their fixes.',
      Widget: CryptoFailuresWidget,
      intro: <>"Don\'t roll your own crypto" is half the lesson. The other half is using the standard primitives correctly: bcrypt/argon2 for passwords (not SHA-256), TLS for transit (not "we\'re behind a firewall"), KMS-issued keys (not constants in source).</>,
      sections: [],
      takeaways: [
        "Password hashing is not general-purpose hashing. Use a slow, memory-hard function (bcrypt, scrypt, argon2).",
        "Any data crossing a network needs TLS. \"Internal\" networks have insiders and lateral movement.",
        "Keys belong in a KMS or vault with rotation. A constant in source is a leak waiting to be indexed.",
        "Use vetted libraries (libsodium, AWS Encryption SDK). Don\'t reach for raw AES/RSA primitives.",
      ] },

    { slug: 'a03-injection', number: '03', title: 'A03 — Injection (SQLi, XSS, Command)',
      blurb: 'Three flavours of injection in one widget. Type a payload, watch unsafe code execute it; switch to safe code and it becomes data.',
      Widget: InjectionWidget,
      intro: <>Injection happens when user input is mixed into an interpreter\'s instructions — SQL, HTML, shell — instead of staying as data. The cure is universal: keep code and data separate. Parameterised queries, output encoding, argument arrays. Once you internalise this, the whole class disappears.</>,
      sections: [],
      takeaways: [
        "Never concatenate user input into SQL. Use bound parameters. Every language has this.",
        "Never inject user input into HTML as raw strings. Use a templating engine that escapes by default.",
        "Never pass user input to a shell. Use exec with an argument array, not a command string.",
        "ORMs help by default but can be misused. Watch for `whereRaw`, `Sequelize.literal`, etc.",
      ] },

    { slug: 'a04-insecure-design', number: '04', title: 'A04 — Insecure Design',
      blurb: 'Pick a password-reset design. Some are broken by design — no patch can fix them.',
      Widget: InsecureDesignWidget,
      intro: <>Some bugs you can fix with a code change. Some you can only fix by redesigning the flow. A04 is the category for flaws that aren\'t implementation slip-ups — they\'re the system doing exactly what was specified, where the specification itself is wrong.</>,
      sections: [],
      takeaways: [
        "Threat-model the design before you implement it. The cheapest fix is the one you never had to ship.",
        "Be skeptical of \"security questions\" — the answers are often public.",
        "Tokens should be high-entropy, time-bounded, and single-use. Sequential IDs are enumeration-bait.",
        "If a security audit can only suggest \"redesign this feature\", you found A04.",
      ] },

    { slug: 'a05-misconfiguration', number: '05', title: 'A05 — Security Misconfiguration',
      blurb: 'Defaults bite. Tick each common misconfiguration and watch the attack surface score climb.',
      Widget: MisconfigurationWidget,
      intro: <>The vulnerability isn\'t in the code — it\'s in what got left enabled. Verbose error pages, default credentials, exposed admin endpoints, CORS set to `*`. Every one of these has a default that\'s safe; every one is sometimes shipped wrong.</>,
      sections: [],
      takeaways: [
        "Treat infrastructure config as code: review it, version it, lint it.",
        "Use security-header presets (HSTS, CSP, X-Frame-Options, X-Content-Type-Options). The defaults are bad.",
        "Don\'t ship DEBUG to production. Verbose errors leak everything.",
        "Periodically scan your own surface — there are good open-source scanners (nuclei, trivy) for exactly this.",
      ] },

    { slug: 'a06-vulnerable-components', number: '06', title: 'A06 — Vulnerable & Outdated Components',
      blurb: 'Bump a version, see CVEs disappear. The whole topic in one widget.',
      Widget: VulnerableComponentsWidget,
      intro: <>Most of your code\'s attack surface is in dependencies. Once a CVE is published, the timer starts: attackers automate exploitation. The half-life of patching matters more than the patch itself.</>,
      sections: [],
      takeaways: [
        "Subscribe to advisories for what you use. Dependabot or equivalent is a baseline.",
        "Have a routine for the urgent patch — not just the quarterly upgrade.",
        "Pin major + minor; allow patch range. Lockfile commits exact resolved versions.",
        "Audit transitive deps too — the worst CVE usually comes from something you didn\'t install directly.",
      ] },

    { slug: 'a07-auth-failures', number: '07', title: 'A07 — Identification & Authentication Failures',
      blurb: 'Weak passwords, no rate limit, predictable session IDs. Three failures, three fixes, side-by-side.',
      Widget: AuthFailuresWidget,
      intro: <>Auth is the gate to everything else. Get it wrong and the rest of your security model is irrelevant. Modern auth is solved enough that you should rarely roll it yourself — but knowing the failure modes is how you spot the implementation that did.</>,
      sections: [],
      takeaways: [
        "Use established libraries / providers (Auth0, Cognito, Authelia, NextAuth). Don\'t write the password flow yourself.",
        "Rate-limit login attempts — IP-based AND account-based. Don\'t let attackers reuse the same account name forever.",
        "Session IDs must be cryptographically random and long. Sequential IDs are catastrophic.",
        "Add MFA for anything that matters. Costs a bit of UX; cuts most credential-stuffing wins to zero.",
      ] },

    { slug: 'a08-integrity-failures', number: '08', title: 'A08 — Software & Data Integrity Failures',
      blurb: 'Unsigned cookies, unsigned releases. Tamper the payload — does the server notice?',
      Widget: IntegrityFailuresWidget,
      intro: <>If you can\'t verify that bytes haven\'t changed, you have to assume they have. This is the deserialisation lesson plus the supply-chain lesson plus the auto-update lesson — different shapes of the same principle: sign, verify, refuse on mismatch.</>,
      sections: [],
      takeaways: [
        "Sign any data that leaves your trust boundary and comes back (cookies, JWTs, signed URLs).",
        "Verify before you parse — never deserialise untrusted bytes.",
        "Software updates must be cryptographically signed; verifiers must enforce.",
        "Sigstore, in-toto, SLSA are the modern toolchain for supply-chain integrity.",
      ] },

    { slug: 'a09-logging-failures', number: '09', title: 'A09 — Security Logging & Monitoring Failures',
      blurb: 'Run an attack against your system. With logging off, you find out from the news.',
      Widget: LoggingFailuresWidget,
      intro: <>Detection is what separates a one-day breach from a six-month one. The breach happens anyway; the question is when you find out. Logs that aren\'t centralised, aren\'t alerted on, and aren\'t retained are decoration.</>,
      sections: [],
      takeaways: [
        "Log authentication attempts (both success and fail), admin actions, and access to sensitive data.",
        "Ship logs to a central SIEM you can actually query. Local files don\'t survive ransomware.",
        "Alert on the patterns that matter — failed-login bursts, privilege changes, geographic anomalies.",
        "Retain at least 90 days. Many breaches are only discovered weeks later.",
      ] },

    { slug: 'a10-ssrf', number: '10', title: 'A10 — Server-Side Request Forgery (SSRF)',
      blurb: 'Type any URL and watch the server fetch it. With no allowlist, internal endpoints fall first.',
      Widget: SSRFWidget,
      intro: <>SSRF lets an attacker make your server reach inside the network they can\'t reach themselves. Cloud metadata endpoints, internal admin pages, other services on the VPC — the server has access; the attacker just needs to point it where they want.</>,
      sections: [],
      takeaways: [
        "Don\'t fetch attacker-controlled URLs. If you must, allowlist by domain.",
        "Block private IPs (169.254/16, 10/8, 172.16/12, 192.168/16) after DNS resolution.",
        "Use IMDSv2 on AWS — it requires a session token, defeating most cloud-metadata SSRF.",
        "Egress controls help: app servers shouldn\'t be able to reach the metadata endpoint at all.",
      ] },
  ],
};
