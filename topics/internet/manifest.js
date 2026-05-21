// Internet topic manifest — single source of truth for lesson order,
// titles, and blurbs. Sidebar, lesson nav, and topic hub all render
// from this.

export const manifest = {
  slug: 'internet',
  title: 'Internet',
  tagline: 'How bytes actually get from one machine to another.',
  lessons: [
    {
      slug: 'journey',
      title: 'Journey of a Request',
      blurb: 'Type a URL, hit enter. Five protocols and a dozen machines later, you have a webpage. Watch every step.',
    },
    {
      slug: 'ip',
      title: 'IP & Routing',
      blurb: 'Addresses, subnets, and the hop-by-hop journey of a packet across a network of routers.',
    },
    {
      slug: 'dns',
      title: 'DNS',
      blurb: 'Names to numbers. Follow a recursive resolver from your laptop to the root and back.',
    },
    {
      slug: 'tcp',
      title: 'TCP Handshake & Flow',
      blurb: 'The three-way handshake, sliding windows, and how TCP recovers from packet loss.',
    },
    {
      slug: 'tcp-vs-udp',
      title: 'TCP vs UDP',
      blurb: 'Side-by-side: send the same data over both, drop a packet, see what each does about it.',
    },
    {
      slug: 'tls',
      title: 'TLS Handshake',
      blurb: 'How two strangers agree on a shared secret over an eavesdropped wire. TLS 1.3 in slow motion.',
    },
    {
      slug: 'http-versions',
      title: 'HTTP/1, HTTP/2, HTTP/3',
      blurb: 'Race three versions loading the same page. See head-of-line blocking disappear with QUIC.',
    },
    {
      slug: 'latency',
      title: 'Latency & Performance',
      blurb: 'RTT, throughput, bufferbloat, CDN. What actually decides how fast your site feels.',
    },
  ],
};
