import ThreatModelWidget from '../widgets/software-security/ThreatModelWidget.jsx';
import DefenseInDepthWidget from '../widgets/software-security/DefenseInDepthWidget.jsx';
import MemorySafetyWidget from '../widgets/software-security/MemorySafetyWidget.jsx';
import SupplyChainWidget from '../widgets/software-security/SupplyChainWidget.jsx';
import SecretsWidget from '../widgets/software-security/SecretsWidget.jsx';
import IncidentResponseWidget from '../widgets/software-security/IncidentResponseWidget.jsx';

export const manifest = {
  slug: 'software-security',
  title: 'Software Security',
  intro: <>Six lessons on the parts of security that aren't covered by Cryptography or OWASP — threat modelling, defense in depth, memory safety, supply chain, secrets management, and incident response. Hands-on sandboxes for every concept.</>,
  lessons: [
    { slug: 'threat-model', number: '01', title: 'Threat Model & Trust Boundaries',
      blurb: 'Security starts with naming what crosses which line. Pick attacker capabilities and defenses; watch the exposed surface change.',
      Widget: ThreatModelWidget,
      intro: <>Threat modelling isn't a checklist — it's a habit. For any system, name the assets, the trust boundaries between components, the capabilities an attacker has at each boundary, and the defenses that mitigate each crossing. Everything else flows from that.</>,
      sections: [{
        heading: 'STRIDE and the trust boundary',
        body: (
          <ul>
            <li><strong>Spoofing</strong> — identity. Whose request is this really?</li>
            <li><strong>Tampering</strong> — integrity. Did anything change in transit?</li>
            <li><strong>Repudiation</strong> — accountability. Can we prove who did what?</li>
            <li><strong>Information disclosure</strong> — confidentiality. Who can read this?</li>
            <li><strong>Denial of service</strong> — availability. Can it be made unavailable?</li>
            <li><strong>Elevation of privilege</strong> — authorisation. Can a lesser role become a greater one?</li>
          </ul>
        ),
      }],
      takeaways: [
        "Threat models are cheap to draw and expensive to skip. Do them at the design stage, not after launch.",
        "The most useful artifact is a diagram with trust boundaries drawn — everything crossing a dashed line needs an explicit defense.",
        "Re-do the model when the system changes shape: new component, new third-party, new data class.",
        "Defenses cost something; don't apply them where there's no boundary crossing.",
      ] },

    { slug: 'defense-in-depth', number: '02', title: 'Defense in Depth',
      blurb: 'No single layer is bulletproof. Toggle five rings of defense and watch attacks slowed, deflected, or stopped.',
      Widget: DefenseInDepthWidget,
      intro: <>One layer of defense always fails eventually — a WAF rule has a gap, an input validator misses a corner case, an ORM is misused. Defense in depth is the assumption that each layer is fallible and the system survives anyway because the layers compose.</>,
      sections: [],
      takeaways: [
        "Each layer has different failure modes — that's the whole point. Two firewalls don't help; a firewall + a parameterised query + a least-privilege DB role do.",
        "The cost of an extra layer is usually small. The cost of being wrong about which one was bulletproof is total.",
        "Test the depth: routinely turn off one layer and check the others still hold.",
        "Layers also make attacks slower and noisier — which buys you detection time.",
      ] },

    { slug: 'memory-safety', number: '03', title: 'Memory Safety',
      blurb: 'Type a string longer than the buffer and watch adjacent stack bytes get smashed. Toggle the mitigations.',
      Widget: MemorySafetyWidget,
      intro: <>Buffer overflows are the textbook software vulnerability, alive and well in any language without bounds-checking. Stack canaries, ASLR, and non-executable stacks each shut down a different stage of the classic exploit — but only memory-safe languages remove the bug class entirely.</>,
      sections: [{
        heading: 'Why this bug class won\'t die',
        body: (
          <p>C and C++ trust you to know what you\'re doing with pointers. They\'re fast, they\'re portable, and they sit beneath almost every operating system, browser, and runtime. Every major mitigation (canaries, ASLR, NX, CFI, ShadowStack) raised the cost of exploitation without eliminating the underlying class. Rust eliminates it at the type level; languages with managed runtimes (Go, Java, Python, JavaScript) eliminate it via bounds-checked containers.</p>
        ),
      }],
      takeaways: [
        "Memory safety is a *language* property, not a *programmer* property — the best C programmer still ships overflows over a long enough timeline.",
        "Mitigations stack: canary catches the overflow, ASLR makes hijacked addresses guesswork, NX stops shellcode execution. Each independent.",
        "If you have a choice, write new components in a memory-safe language. CVE counts drop by an order of magnitude.",
        "When you can\'t (kernels, embedded, legacy), turn on every mitigation your toolchain has.",
      ] },

    { slug: 'supply-chain', number: '04', title: 'Supply Chain',
      blurb: 'Install one package. See N transitives come along. Now imagine one of them is malicious.',
      Widget: SupplyChainWidget,
      intro: <>You don\'t write most of your code — your dependencies do. A typosquat one level deep in your tree gets the same code-execution rights as anything you wrote yourself. The fix isn\'t to write everything yourself; it\'s to pin, verify, inventory, and review.</>,
      sections: [],
      takeaways: [
        "A lockfile with hashes pins exactly what you build against — and lets a future audit verify nothing changed under you.",
        "An SBOM (software bill of materials) is the inventory you need when a CVE drops. Without it, you don\'t know if you\'re affected.",
        "Typosquatting is cheap and ongoing — favour known publishers, scoped names, and short dep trees.",
        "Dependency confusion attacks (private name resolved from public registry) are a real and recurring class. Lock the resolver to private first.",
      ] },

    { slug: 'secrets', number: '05', title: 'Secrets & Key Management',
      blurb: 'A leaked secret\'s blast radius depends entirely on where you stored it. Compare hardcoded vs env vars vs a vault.',
      Widget: SecretsWidget,
      intro: <>Every secret eventually leaks — to a log, to a screenshot, to a fork, to an attacker. The difference between a near-miss and a breach is how fast you can contain it. Hardcoded secrets have infinite blast radius; vault-issued short-lived tokens have seconds.</>,
      sections: [],
      takeaways: [
        "Never put secrets in source. The repo history is forever.",
        "Env vars are an improvement but persist until next redeploy and leak into logs.",
        "A vault gives you short-lived tokens, audit logs, and instant rotation. The blast radius shrinks from years to minutes.",
        "Plan for the leak before it happens: have a rotation runbook and test it.",
      ] },

    { slug: 'incident-response', number: '06', title: 'Incident Response',
      blurb: 'Suspicious login just succeeded. What do you do first? Branch through the playbook and see how the outcome diverges.',
      Widget: IncidentResponseWidget,
      intro: <>The wrong first action in an incident often makes things worse — alerting the attacker, destroying forensic evidence, panicking customers before you know facts. The right order (detect → contain → eradicate → recover → review) feels slow but lands you in a better place.</>,
      sections: [{
        heading: 'The five-phase playbook',
        body: (
          <ol>
            <li><strong>Detect</strong> — confirm something\'s actually wrong; gather scope.</li>
            <li><strong>Contain</strong> — stop the bleeding without destroying evidence (network isolation, not wipe-and-restore).</li>
            <li><strong>Eradicate</strong> — remove the attacker\'s persistence (rotated creds, removed implants, patched holes).</li>
            <li><strong>Recover</strong> — restore service from clean state; verify with monitoring.</li>
            <li><strong>Review</strong> — post-mortem; what gap let this in, what would have caught it sooner.</li>
          </ol>
        ),
      }],
      takeaways: [
        "Practice the playbook in tabletop exercises — the first time can\'t be live.",
        "Containment ≠ eradication. Pulling the network plug stops bleeding but doesn\'t remove backdoors.",
        "Disclosure timing matters — be honest with customers, but only after you have facts. Speculation hurts.",
        "Every incident is a free lesson if you write the post-mortem. The lesson costs zero. Repeating the incident costs everything.",
      ] },
  ],
};
