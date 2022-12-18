import * as k8s from "@pulumi/kubernetes";
import * as digitalocean from "@pulumi/digitalocean";

const cluster = new digitalocean.KubernetesCluster("codelaunch", {
  region: digitalocean.Region.NYC1,
  version: "1.25.4-do.0",
  nodePool: {
    name: "default",
    size: digitalocean.DropletSlug.DropletS2VCPU2GB,
    nodeCount: 1,
  },
});

const provider = new k8s.Provider("codelaunch", {});

export const kubeconfig = cluster.kubeConfigs[0].rawConfig;

const apiDeployment = new k8s.apps.v1.Deployment("api-deployment", {
  metadata: {
    name: "api-deployment",
    namespace: "default",
  },
  spec: {
    replicas: 1,
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

const stripPrefixMiddleware = new k8s.apiextensions.CustomResource(
  "strip-prefix-middlware",
  {
    apiVersion: "traefik.containo.us/v1alpha1",
    kind: "Middleware",
    metadata: {
      name: "strip-prefix-middleware",
    },
    spec: {
      stripPrefix: {
        prefixes: ["/api", "/ide"],
      },
    },
  }
);

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
            name: stripPrefixMiddleware.metadata.name,
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
