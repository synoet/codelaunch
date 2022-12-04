import * as k8s from "@kubernetes/client-node"

const kc = new k8s.KubeConfig()
kc.loadFromDefault()

const k8sApi = kc.makeApiClient(k8s.CoreV1Api)


const podFromImage = ( userId: string) => {
  return {
    apiVersion: "v1",
    kind: "Pod",
    metadata: {
      name: `mc-ide-pod-${userId}`,
      labels: {
        app: "mc-ide"
      }
    },
    spec: {
      containers: [
        {
          name: 'mc-ide',
          image: 'localhost:5000/mc-ide:latest'
        }
      ]
    }
  }
}
const pod = {
  apiVersion: "v1",
  kind: "Pod",
  metadata: {
    name: "mc-ide-pod",
    labels: {
      app: "mc-ide"
    }
  },
  spec: {
    containers: [
      {
        name: 'mc-ide',
        image: 'localhost:5000/mc-ide:latest'
      }
    ]
  }
}

const service = {
  apiVersion: "v1",
  kind: "Service",
  metadata: {
    name: "mc-load-balancer"
  },
  spec: {
    type: "LoadBalancer",
    ports: [
      {
        port: 80,
        targetPort: 8080
      }
    ],
    selector: {
      app: "mc-ide"
    }
  }
};


export const createPod = async (name: string) => {
  k8sApi.createNamespacedPod("default", podFromImage(name)).then((res) => {
    return k8sApi.createNamespacedService("default", service);
  }).then((res) => {
    console.log(res)
  })
}

export const deletePod = async (podId: string) => {
  k8sApi.deleteNamespacedPod(podId, "default").then((res) => {
  })
}