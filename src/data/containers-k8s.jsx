import OCIImagesWidget from '../widgets/containers-k8s/OCIImagesWidget.jsx';
import RuntimesWidget from '../widgets/containers-k8s/RuntimesWidget.jsx';
import K8sArchitectureWidget from '../widgets/containers-k8s/K8sArchitectureWidget.jsx';
import PodsServicesWidget from '../widgets/containers-k8s/PodsServicesWidget.jsx';
import IngressEgressWidget from '../widgets/containers-k8s/IngressEgressWidget.jsx';
import ConfigVolumesWidget from '../widgets/containers-k8s/ConfigVolumesWidget.jsx';
import NetworkingWidget from '../widgets/containers-k8s/NetworkingWidget.jsx';
import SchedulingWidget from '../widgets/containers-k8s/SchedulingWidget.jsx';

export const manifest = {
  slug: 'containers-k8s',
  title: 'Containers & Kubernetes',
  intro: <>Eight lessons starting where the OS topic\'s container lesson leaves off: image layers, runtimes, the Kubernetes control plane, ingress/egress, networking, and autoscaling. Every concept comes with a sandbox you can poke at.</>,
  lessons: [
    { slug: 'oci-images', number: '01', title: 'OCI Images & Layers',
      blurb: 'A Dockerfile is a layer cache. Reorder lines, watch the cache shatter or hold.',
      Widget: OCIImagesWidget,
      intro: <>An OCI image is a stack of immutable layers, each a filesystem diff. The order in your Dockerfile decides which layers get cached across builds — and one badly placed `COPY . .` can invalidate everything downstream on every code change.</>,
      sections: [],
      takeaways: [
        "Order from least to most frequently changing: base image → system packages → dep manifests → deps → source → build.",
        "Each `RUN` and `COPY` produces a layer. Chain commands with `&&` to keep them in one layer when it makes sense.",
        "Multi-stage builds let you discard build-only tools and ship only the final binary — smaller, less attack surface.",
        "Distroless or scratch base images cut dozens of MB and most CVEs from the image.",
      ] },

    { slug: 'runtimes', number: '02', title: 'Container Runtimes',
      blurb: 'kubectl → CRI → containerd → runc → kernel. Walk the stack one hop at a time.',
      Widget: RuntimesWidget,
      intro: <>"A container" is a Linux process with extra paperwork. Between `kubectl apply` and that process running, half a dozen layers translate intent into syscalls. Knowing what each layer does is what lets you debug correctly when something breaks.</>,
      sections: [],
      takeaways: [
        "Kubelet talks to a CRI implementation (containerd, CRI-O). CRI handles image pull + lifecycle.",
        "CRI delegates the actual start to a low-level OCI runtime (runc is the default).",
        "runc uses namespaces + cgroups + capabilities to create the container — pure kernel features, no Docker required.",
        "Alternative runtimes (gVisor sandboxes syscalls; Kata uses lightweight VMs) trade performance for isolation.",
      ] },

    { slug: 'architecture', number: '03', title: 'Kubernetes Architecture',
      blurb: 'API server, etcd, scheduler, controllers, kubelet. Watch a kubectl apply ripple through all of them.',
      Widget: K8sArchitectureWidget,
      intro: <>Kubernetes is a database (etcd) with controllers reconciling desired state to actual state. The control plane is the brain; nodes are the muscle. Almost every concept in K8s is a "controller watching for objects, reconciling them, writing status back".</>,
      sections: [],
      takeaways: [
        "Everything goes through the API server. It\'s the only thing that writes to etcd.",
        "Controllers loop: read desired state, observe actual state, take the diff action. Idempotent.",
        "Kubelet is the agent on each node — it talks to the API server, runs the containers, reports status.",
        "Kill the API server and the cluster keeps running (pods stay up), but you can\'t make changes.",
      ] },

    { slug: 'pods-services', number: '04', title: 'Pods, Deployments, Services',
      blurb: 'Scale replicas, kill pods, watch the Service stay routable regardless of which pod IPs come and go.',
      Widget: PodsServicesWidget,
      intro: <>Pods are ephemeral — they get IPs, they die, they get new IPs. Services are the stable abstraction that hides this from clients. Deployments and ReplicaSets are what make sure the right number of pods exist.</>,
      sections: [],
      takeaways: [
        "Pod = one or more containers sharing a network namespace + volumes. Treat as cattle, not pets.",
        "Deployment owns a ReplicaSet, which owns Pods. You usually only edit the Deployment.",
        "Service gives a stable IP + DNS name; kube-proxy load-balances to the current pod set.",
        "Headless Services skip the LB and return each pod IP — useful for StatefulSets.",
      ] },

    { slug: 'ingress-egress', number: '05', title: 'Ingress & Egress',
      blurb: 'Two concepts, same word: HTTP routing INTO the cluster, and NetworkPolicy rules between pods.',
      Widget: IngressEgressWidget,
      intro: <>"Ingress" in K8s lingo means two distinct things. The Ingress *resource* routes HTTP from outside the cluster to internal Services. NetworkPolicy controls pod-to-pod traffic — both ingress (incoming) and egress (outgoing). They\'re unrelated but constantly confused.</>,
      sections: [],
      takeaways: [
        "Ingress resource: host + path → Service. Implemented by an Ingress Controller (nginx, traefik, AWS ALB).",
        "NetworkPolicy: pod-to-pod L3/L4 firewall. Default-allow until you create one — then default-deny.",
        "Both work together: ingress lets traffic in, NetworkPolicy decides where it can go next.",
        "Always create at least one egress policy — otherwise compromised pods can phone home freely.",
      ] },

    { slug: 'config-volumes', number: '06', title: 'ConfigMaps, Secrets & Volumes',
      blurb: 'Edit a ConfigMap key, see it appear in the pod. Restart the pod — does the file survive?',
      Widget: ConfigVolumesWidget,
      intro: <>State enters a pod three ways: ConfigMaps (non-secret config), Secrets (sensitive config), Volumes (filesystems). The mount mode (env var vs file) and the volume type (emptyDir vs hostPath vs PVC) decide how the pod actually sees the data.</>,
      sections: [],
      takeaways: [
        "ConfigMap = non-secret config. Mount as files or env vars. Updates roll out per pod restart.",
        "Secret = sensitive config. Same shape as ConfigMap, but base64-encoded and best-encrypted-at-rest.",
        "emptyDir lives with the pod and dies with it. hostPath ties you to a node. PVC is the only durable, cluster-wide option.",
        "For real secrets, integrate with an external vault (Vault, AWS Secrets Manager) — K8s Secrets are base64, not encrypted.",
      ] },

    { slug: 'networking', number: '07', title: 'Cluster Networking',
      blurb: 'Trace a packet from pod A on node 1 to pod B on node 2. Flip CNI plugins and service-mesh sidecars.',
      Widget: NetworkingWidget,
      intro: <>Every pod gets its own IP. To make that work across nodes, you need a CNI (Container Network Interface) plugin that bridges the per-node networks. Service meshes layer on top: sidecar proxies that handle mTLS, retries, and observability without your app knowing.</>,
      sections: [],
      takeaways: [
        "CNI plugins handle the data plane. Flannel = simple VXLAN. Calico = BGP + policy. Cilium = eBPF, fastest + best policy.",
        "Service mesh (Istio, Linkerd) adds sidecars for mTLS, retries, circuit-breaking, observability.",
        "Sidecars cost CPU and latency. Worth it for compliance + ops; skip for small clusters.",
        "Cilium can replace both CNI and most of the service-mesh feature set without sidecars (using eBPF in-kernel).",
      ] },

    { slug: 'scheduling', number: '08', title: 'Scheduling & Autoscaling',
      blurb: 'HPA grows pod count, VPA grows pod size, Cluster Autoscaler grows the cluster. Watch all three react.',
      Widget: SchedulingWidget,
      intro: <>Three layers of autoscaling: HPA changes how many pods you have, VPA changes how much each pod gets, Cluster Autoscaler changes how many nodes there are. They\'re independent and can be combined.</>,
      sections: [],
      takeaways: [
        "Set realistic requests AND limits. Requests drive scheduling; limits prevent noisy-neighbour.",
        "HPA on CPU is the easy default. For latency-sensitive workloads, scale on a custom queue-depth metric instead.",
        "VPA and HPA don\'t mix on the same metric — pick one. VPA on memory + HPA on CPU is fine.",
        "Cluster Autoscaler reacts to Pending pods. If a workload is too large for any node shape you have, it stays Pending forever.",
      ] },
  ],
};
