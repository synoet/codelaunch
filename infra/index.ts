import * as k8s from "@pulumi/kubernetes";

const apiDeployment = new k8s.apps.v1.Deployment("api-deployment", {
  spec: {
    replicas: 1,
    selector: {
      matchLabels: {
        app: "api",
      },
    },
    template: {
      metadata: {
        labels: {
          app: "api",
        },
      },
      spec: {
        containers: [
          {
            name: "api",
            image: "localhost:5000/mc-api:latest",
            ports: [
              {
                containerPort: 8000,
              },
            ],
          },
        ],
      },
    },
  },
});

const apiService = new k8s.core.v1.Service("api-service", {
  metadata: {
    name: "api-service",
    labels: {
      app: "api",
    },
  },
  spec: {
    type: "NodePort",
    ports: [{ port: 8000, targetPort: 8000 }],
    selector: {
      app: "api",
    },
  },
});

const ingressConfig = new k8s.core.v1.ConfigMap("ingress-config", {
  metadata: {
    name: "ingress-config",
  },
  data: {
    "routes.yaml": `
      - match:
					path:
						exact: "/ide"
          headers:
            x-cluster-ip:
              regex: ".*"
        route:
          cluster: "{{ normalize(header(X-Cluster-IP)) }}"
    `,
  },
});

const ingress = new k8s.networking.v1.Ingress("mc-router", {
  metadata: {
    name: "mc-router",
    annotations: {
      "pulumi.com/skipAwait": "true",
      "kubernetes.io/ingress.class": "traefik",
      "traefik.ingress.kubernetes.io/router.entrypoints": "http",
			"kubernetes.io/ingress.class": "nginx",
      // "traefik.ingress.kubernetes.io/router.tls.certresolver": "default",
      // "traefik.ingress.kubernetes.io/router.tls.tls": "true",
      // "traefik.ingress.kubernetes.io/router.configmap": "ingress-config",
    },
  },
  spec: {
    rules: [
      {
        host: "minicube-local.dev",
        http: {
          paths: [
            {
              path: "/",
              pathType: "Prefix",
              backend: {
                service: {
                  name: "api-service",
                  port: {
                    number: 80,
                  },
                },
              },
            },
          ],
        },
      },
    ],
		ingressClassName: ''
  },
});
