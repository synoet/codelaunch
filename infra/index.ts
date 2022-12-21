import * as k8s from "@pulumi/kubernetes";
import * as digitalocean from "@pulumi/digitalocean";

const cluster = new digitalocean.KubernetesCluster("codelaunch", {
  region: digitalocean.Region.NYC1,
  version: "1.25.4-do.0",
  nodePool: {
    name: "default",
    size: digitalocean.DropletSlug.DropletS2VCPU2GB,
    nodeCount: 10,
  },
});

const provider = new k8s.Provider("codelaunch", {});

export const kubeconfig = cluster.kubeConfigs[0].rawConfig;

const pvCreatorClusterRole = new k8s.rbac.v1.ClusterRole("pv-creator", {
  metadata: {
    namespace: "default",
    name: "pv-creator-role",
  },
  rules: [
    {
      apiGroups: ["*"],
      resources: ["persistentvolumes", "persistentvolumeclaims", "pods", "services"],
      verbs: ["create", "get", "list"],
    },
  ],
});

const pvCreatorClusterBinding = new k8s.rbac.v1.ClusterRoleBinding(
  "pv-creator-binding",
  {
    metadata: {
      namespace: "default",
      name: "pv-creator-role-binding",
    },
    subjects: [
      {
        kind: "ServiceAccount",
        name: "default",
        namespace: "default",
      },
    ],
    roleRef: {
      kind: "ClusterRole",
      name: pvCreatorClusterRole.metadata.name,
      apiGroup: "rbac.authorization.k8s.io",
    },
  }
);

const apiDeployment = new k8s.apps.v1.Deployment("api-deployment", {
  metadata: {
    name: "api-deployment",
    namespace: "default",
    labels: {
      app: "api",
    },
  },
  spec: {
    replicas: 1,
    strategy: {
      rollingUpdate: {
        maxSurge: 0,
      },
    },
    selector: {
      matchLabels: {
        app: "api",
      },
    },
    template: {
      metadata: {
        name: "api-deployment",
        labels: {
          app: "api",
        },
      },
      spec: {
        serviceAccount: "default",
        containers: [
          {
            name: "api",
            image: "registry.digitalocean.com/codelaunch/cl-api:latest",
            ports: [
              {
                containerPort: 8000,
                hostPort: 80,
              },
            ],
          },
        ],
        imagePullSecrets: [
          {
            name: "codelaunch",
          },
        ],
      },
    },
  },
});

const webDeployment = new k8s.apps.v1.Deployment("web-deployment", {
  metadata: {
    name: "web-deployment",
    namespace: "default",
    labels: {
      app: "web",
    },
  },
  spec: {
    replicas: 1,
    strategy: {
      rollingUpdate: {
        maxSurge: 0,
      },
    },
    selector: {
      matchLabels: {
        app: "web",
      },
    },
    template: {
      metadata: {
        name: "web-deployment",
        labels: {
          app: "web",
        },
      },
      spec: {
        serviceAccount: "default",
        containers: [
          {
            name: "web",
            image: "registry.digitalocean.com/codelaunch/cl-web:latest",
            ports: [
              {
                containerPort: 3000,
                hostPort: 80,
              },
            ],
          },
        ],
        imagePullSecrets: [
          {
            name: "codelaunch",
          },
        ],
      },
    },
  },
});

const webService = new k8s.core.v1.Service("web-service", {
  metadata: {
    name: "web-service",
    namespace: "default",
    labels: {
      app: apiDeployment.metadata.labels.app,
    },
  },
  spec: {
    type: "NodePort",
    ports: [{ port: 3000, targetPort: 3000 }],
    selector: {
      app: webDeployment.metadata.labels.app,
    },
  },
});



const apiService = new k8s.core.v1.Service("api-service", {
  metadata: {
    name: "api-service",
    namespace: "default",
    labels: {
      app: apiDeployment.metadata.labels.app,
    },
  },
  spec: {
    type: "NodePort",
    ports: [{ port: 8000, targetPort: 8000 }],
    selector: {
      app: apiDeployment.metadata.labels.app,
    },
  },
});

const proxyDeployment = new k8s.apps.v1.Deployment("proxy-deployment", {
  metadata: {
    name: "proxy-deployment",
    namespace: "default",
    labels: {
      app: "proxy",
    },
  },
  spec: {
    strategy: {
      rollingUpdate: {
        maxSurge: 0,
      },
    },
    replicas: 2,
    selector: {
      matchLabels: {
        app: "proxy",
      },
    },
    template: {
      metadata: {
        name: "proxy-deployment",
        labels: {
          app: "proxy",
        },
      },
      spec: {
        containers: [
          {
            name: "proxy",
            image: "registry.digitalocean.com/codelaunch/cl-proxy:latest",
            ports: [
              {
                containerPort: 8000,
              },
            ],
          },
        ],
        imagePullSecrets: [
          {
            name: "codelaunch",
          },
        ],
      },
    },
  },
});

const proxyService = new k8s.core.v1.Service("proxy-service", {
  metadata: {
    name: "proxy-service",
    namespace: "default",
    labels: {
      app: apiDeployment.metadata.labels.app,
    },
  },
  spec: {
    type: "NodePort",
    ports: [{ port: 8000, targetPort: 8000 }],
    selector: {
      app: proxyDeployment.metadata.labels.app,
    },
  },
});

const traefik = new k8s.helm.v3.Chart(
  "traefik",
  {
    chart: "traefik",
    namespace: "kube-system",
    fetchOpts: { repo: "https://traefik.github.io/charts" },
    values: {
      serviceType: "LoadBalancer",
      rbac: {
        create: true,
      },
    },
  },
  { provider: provider }
);

const stripApiPathPrefixMiddleware = new k8s.apiextensions.CustomResource(
  "strip-api-path-prefix-middlware",
  {
    apiVersion: "traefik.containo.us/v1alpha1",
    kind: "Middleware",
    metadata: {
      name: "strip-api-path-prefix-middleware",
    },
    spec: {
      stripPrefix: {
        prefixes: ["/api"],
      },
    },
  }
);

const stripIdePathPrefixMiddleware = new k8s.apiextensions.CustomResource(
  "strip-ide-path-prefix-middlware",
  {
    apiVersion: "traefik.containo.us/v1alpha1",
    kind: "Middleware",
    metadata: {
      name: "strip-ide-path-prefix-middleware",
    },
    spec: {
      stripPrefix: {
        prefixes: ["/ide"],
      },
    },
  }
);

const webRouter = new k8s.apiextensions.CustomResource("web-router", {
  apiVersion: "traefik.containo.us/v1alpha1",
  kind: "IngressRoute",
  metadata: {
    name: "web-router",
  },
  spec: {
    entryPoints: ["web"],
    routes: [
      {
        kind: "Rule",
        match: "PathPrefix(`/`)",
        services: [
          {
            name: webService.metadata.name,
            port: 3000,
          },
        ],
      },
    ],
  },
});

const apiRouter = new k8s.apiextensions.CustomResource("api-router", {
  apiVersion: "traefik.containo.us/v1alpha1",
  kind: "IngressRoute",
  metadata: {
    name: "api-router",
  },
  spec: {
    entryPoints: ["web"],
    routes: [
      {
        kind: "Rule",
        match: "PathPrefix(`/api`)",
        middlewares: [
          {
            name: stripApiPathPrefixMiddleware.metadata.name,
          },
        ],
        services: [
          {
            name: apiService.metadata.name,
            port: 8000,
          },
        ],
      },
    ],
  },
});

const ideProxyRouter = new k8s.apiextensions.CustomResource("proxy-router", {
  apiVersion: "traefik.containo.us/v1alpha1",
  kind: "IngressRoute",
  metadata: {
    name: "proxy-router",
  },
  spec: {
    entryPoints: ["web"],
    routes: [
      {
        kind: "Rule",
        match: "Host(`ide.codelaunch.sh`)",
        middlewares: [
          {
            name: stripIdePathPrefixMiddleware.metadata.name,
          },
        ],
        services: [
          {
            name: proxyService.metadata.name,
            port: 8000,
          },
        ],
      },
    ],
  },
});


