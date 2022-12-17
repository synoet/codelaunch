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
            image: "mc-api:latest",
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
    labels: {
      app: "api",
    },
  },
  spec: {
    type: "LoadBalancer",
    ports: [{ port: 8000, targetPort: 8000 }],
    selector: {
      app: "api",
    },
  },
});
