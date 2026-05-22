import LegacyWidget from '../widgets/database/LegacyWidget.jsx';
import { initJourneyWidget } from '../widgets/internet/legacy/journey.js';
import { initIpWidget } from '../widgets/internet/legacy/ip.js';
import { initDnsWidget } from '../widgets/internet/legacy/dns.js';
import { initTcpWidget } from '../widgets/internet/legacy/tcp.js';
import { initTcpVsUdpWidget } from '../widgets/internet/legacy/tcp-vs-udp.js';
import { initTlsWidget } from '../widgets/internet/legacy/tls.js';
import { initHttpVersionsWidget } from '../widgets/internet/legacy/http-versions.js';
import { initLatencyWidget } from '../widgets/internet/legacy/latency.js';

const W = (init) => () => <LegacyWidget init={init} />;

export const manifest = {
  slug: 'internet',
  title: 'Internet',
  intro: <>Eight lessons covering the plumbing under every URL — from the packet that leaves your machine to the bytes that come back. IP, TCP, UDP, DNS, TLS, HTTP versions, latency. Each animated.</>,
  lessons: [
    { slug: 'journey',        number: '01', title: 'Journey of a Request',        blurb: 'Type a URL, hit enter. Five protocols and a dozen machines later, you have a webpage. Watch every step.', Widget: W(initJourneyWidget),
      intro: <>What actually happens between hitting Enter and the page rendering? The browser does DNS, then TCP, then TLS, then HTTP — and only then asks for the file.</>,
      sections: [{ heading: 'Five protocols, one click', body: <p>Every URL triggers the same dance: name resolution, connection setup, encryption negotiation, request, response. The widget walks through it in slow motion.</p> }],
      takeaways: ['Even a "fast" page does 5+ round-trips before the first byte.', 'Each protocol layer adds a fixed cost. Latency compounds.', 'CDNs flatten this by being geographically close.', 'HTTP/3 collapses TCP + TLS into one handshake.'],
    },
    { slug: 'ip',             number: '02', title: 'IP & Routing',                blurb: 'Addresses, subnets, and the hop-by-hop journey of a packet across a network of routers.', Widget: W(initIpWidget),
      intro: <>IP gets a packet from any address to any other address. Every router along the way just looks at the destination and picks the next hop. No global view, no end-to-end state.</>,
      sections: [{ heading: 'Hop by hop', body: <p>Each router has a routing table. It checks the destination, looks up the longest prefix match, forwards out the corresponding interface. The packet's source has no idea what path it actually took.</p> }],
      takeaways: ['IP is stateless and unreliable. Routers can drop packets at will.', 'BGP is how routers learn paths between autonomous systems.', 'IPv4 ran out of addresses in 2011. IPv6 has 2^128.', 'Traceroute exposes the hops by lying about TTLs.'],
    },
    { slug: 'dns',            number: '03', title: 'DNS',                          blurb: 'Names to numbers. Follow a recursive resolver from your laptop to the root and back.', Widget: W(initDnsWidget),
      intro: <>The Domain Name System maps human-readable names to IP addresses. Behind the scenes it's a hierarchical, globally-distributed database queried at the speed of light — and cached aggressively.</>,
      sections: [{ heading: 'The hierarchy', body: <p>Root nameservers know the .com / .org / .net authorities. Those know <code>example.com</code>'s nameservers. Those know the IP. Your resolver walks the chain.</p> }],
      takeaways: ['DNS is hierarchical: root → TLD → authoritative → record.', 'Caching at every level keeps the load manageable.', 'TTLs control how long answers are cached. Lower = more flexible, higher = less load.', 'DNS-over-HTTPS (DoH) prevents your ISP from snooping queries.'],
    },
    { slug: 'tcp',            number: '04', title: 'TCP Handshake & Flow',         blurb: 'The three-way handshake, sliding windows, and how TCP recovers from packet loss.', Widget: W(initTcpWidget),
      intro: <>TCP turns IP's unreliable packets into a reliable, ordered byte stream. The cost: a handshake before you can send anything, and per-packet ACKs.</>,
      sections: [{ heading: 'The dance', body: <p>SYN, SYN-ACK, ACK. After that, every byte gets a sequence number; the receiver ACKs them back. Loss triggers retransmission with exponential backoff. Congestion control slows things down when the network is busy.</p> }],
      takeaways: ['Three-way handshake = 1.5 RTTs of overhead before any data.', 'TCP guarantees ordering. Out-of-order packets get reassembled.', 'Congestion control (Reno, CUBIC, BBR) prevents senders from flooding the network.', 'Modern protocols (QUIC) keep TCP\'s reliability but get rid of the handshake cost.'],
    },
    { slug: 'tcp-vs-udp',     number: '05', title: 'TCP vs UDP',                   blurb: 'Side-by-side: send the same data over both, drop a packet, see what each does about it.', Widget: W(initTcpVsUdpWidget),
      intro: <>Same IP, opposite philosophies. TCP guarantees delivery; UDP just fires packets and forgets. The right pick depends on whether retransmission helps or hurts.</>,
      sections: [{ heading: 'When to pick which', body: <ul><li><strong>TCP</strong>: web, file transfer, anything that breaks if a byte is missing.</li><li><strong>UDP</strong>: voice, video, games, DNS — where a stale packet is worse than a missing one.</li></ul> }],
      takeaways: ['TCP retransmits lost packets. UDP doesn\'t.', 'For real-time audio/video, retransmission would just produce a glitch later.', 'QUIC is UDP-based but adds TCP-style reliability on top, configurably.', 'Most "UDP" protocols add their own reliability (RTP, SRT, WebRTC).'],
    },
    { slug: 'tls',            number: '06', title: 'TLS Handshake',                blurb: 'How two strangers agree on a shared secret over an eavesdropped wire. TLS 1.3 in slow motion.', Widget: W(initTlsWidget),
      intro: <>TLS gives you encryption + identity + integrity over a network where anyone can read your bytes. The handshake exchanges a session key without ever sending the key.</>,
      sections: [{ heading: 'The trick: Diffie-Hellman', body: <p>Both sides exchange public values. Each computes a shared secret using the other's public value and their own private value. An eavesdropper sees both publics but can't derive the secret.</p> }],
      takeaways: ['TLS 1.3 needs just one round-trip. 1.2 needed two.', 'Certificates prove the server is who it claims to be.', 'Perfect Forward Secrecy = past sessions stay safe even if the server\'s key leaks.', '0-RTT resumption lets the client send data on its first packet — at the cost of replay risk.'],
    },
    { slug: 'http-versions',  number: '07', title: 'HTTP/1, HTTP/2, HTTP/3',       blurb: 'Race three versions loading the same page. See head-of-line blocking disappear with QUIC.', Widget: W(initHttpVersionsWidget),
      intro: <>Same protocol, three eras. Each version solves the bottleneck of the previous one — and exposes a new one.</>,
      sections: [{ heading: 'What changes between versions', body: <ul><li><strong>HTTP/1.1</strong>: one connection, one request at a time. Pipelining never really worked.</li><li><strong>HTTP/2</strong>: multiplexed streams on one TCP connection. Until one packet drops and blocks everyone.</li><li><strong>HTTP/3</strong>: same multiplexing on UDP/QUIC. Per-stream loss recovery.</li></ul> }],
      takeaways: ['HTTP/1.1 = sequential by default. Multiple connections required for parallelism.', 'HTTP/2 = parallel streams but still TCP-blocked on packet loss.', 'HTTP/3 = QUIC fixes head-of-line blocking and folds in TLS.', 'Most production sites support all three; clients pick the newest mutual version.'],
    },
    { slug: 'latency',        number: '08', title: 'Latency & Performance',        blurb: 'RTT, throughput, bufferbloat, CDN. What actually decides how fast your site feels.', Widget: W(initLatencyWidget),
      intro: <>Bandwidth is cheap; latency is physics. The speed of light through fiber means a New York ↔ Tokyo round-trip can never be under ~150 ms.</>,
      sections: [{ heading: 'Latency is multiplicative', body: <p>A page that fetches 30 resources sequentially sees 30 × RTT just to start each request. Parallelism, caching, and CDNs are how you fight this.</p> }],
      takeaways: ['First-byte latency is mostly RTT × hops. Throughput is bandwidth limits.', 'CDNs reduce hops by putting servers near users.', 'Bufferbloat = oversized queues that look like throughput but ruin latency.', 'For interactive apps, p99 latency matters more than averages.'],
    },
  ],
};
