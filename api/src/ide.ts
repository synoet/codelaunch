import * as k8s from "@kubernetes/client-node";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const kc = new k8s.KubeConfig();
kc.loadFromCluster();

export const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

const createIDEPVC = async (
  name: string,
  volumeName: string,
  size: number
): Promise<k8s.V1PersistentVolumeClaim> => {
  const volumeClaim: k8s.V1PersistentVolumeClaim = {
    metadata: {
      name: name,
    },
    spec: {
      storageClassName: "standard",
      volumeMode: "Filesystem",
      accessModes: ["ReadWriteMany"],
      volumeName: volumeName,
      resources: {
        requests: {
          storage: "2Gi",
        },
      },
    },
    status: {
      capacity: {
        storage: `2Gi`,
      },
    },
  };

  const { body: responseVolumeClaim }: { body: k8s.V1PersistentVolumeClaim } =
    await k8sApi
      .createNamespacedPersistentVolumeClaim("default", volumeClaim)
      .catch((e) => console.log(e));

  return responseVolumeClaim;
};

const createIDEPod = async (
  name: string,
  volumeName: string,
  pvc: k8s.V1PersistentVolumeClaim
): Promise<k8s.V1Pod> => {
  const pod: k8s.V1Pod = {
    apiVersion: "v1",
    kind: "Pod",
    metadata: {
      name: name,
      labels: {
        app: "cl-ide",
      },
    },
    spec: {
      containers: [
        {
          name: "cl-ide",
          image: "registry.digitalocean.com/codelaunch/cl-ide:latest",
          env: [
            {
              name: "PASSWORD",
              value: "coder",
            },
          ],
          ports: [
            {
              containerPort: 8080,
              hostPort: 8080,
            },
          ],
        },
      ],
      imagePullSecrets: [
        {
          name: "codelaunch",
        },
      ],
      volumes: [
        {
          name: "cl-ide-volume",
          persistentVolumeClaim: {
            claimName: pvc.metadata?.name as string,
          },
        },
      ],
    },
  };

  const { body: responsePod }: { body: k8s.V1Pod } = await k8sApi
    .createNamespacedPod("default", pod)
    .catch((e) => console.log(e));

  return responsePod;
};

const createIDEService = async (
  name: string,
  podName: string,
): Promise<k8s.V1Service> => {
  const service: k8s.V1Service = {
    apiVersion: "v1",
    kind: "Service",
    metadata: {
      name: name,
    },
    spec: {
      type: "ClusterIP",
      ports: [
        {
          port: 80,
          targetPort: 8080,
        },
      ],
      selector: {
        name: podName,
      },
    },
  };

  const { body: responseService }: { body: k8s.V1Service } = await k8sApi
    .createNamespacedService("default", service)
    .catch((e) => {
      console.log(e);
    });

  return responseService;
};

interface IDEResponse {
  status: "created" | "running" | "failed";
  clusterIP?: string;
}

export const initializeIDE = async (
  name: string,
  volumeSize: number = 2
): Promise<IDEResponse> => {
  //setup naming conventions for resrouces
  const volumeName = `cl-ide-volume-${name.toLowerCase()}`;
  const volumeClaimName = `cl-ide-pvc-${name.toLowerCase()}`;
  const podName = `cl-ide-pod-${name.toLowerCase()}`;
  const serviceName = `cl-ide-service-${name.toLowerCase()}`;

  // read current status of pvc
  let { body: pvc }: { body: k8s.V1PersistentVolumeClaim | undefined } =
    await k8sApi
      .readNamespacedPersistentVolumeClaim(volumeClaimName, "default")
      .catch((e) => {
        console.log(`failed to get existing pvc for user: ${name}`);
        return {
          body: undefined,
        } as any;
      });

  if (!pvc) {
    try {
      console.log(`creating new persistentvolume and pvc for user: ${name}`);
      await k8sApi.createPersistentVolume({
        metadata: {
          name: volumeName,
          labels: {
            app: 'ide'
          }
        },
        spec: {
          capacity: {
            storage: `2Gi`,
          },
          accessModes: ["ReadWriteMany"],
          storageClassName: "standard",
          hostPath: {
            path: `/data/${name}`,
          },
        },
      });
    } catch (e) {
      console.log(`failed to create pvc for user ${name}`);
      console.error(e);
      return {
        status: "failed",
      };
    }
    pvc = await createIDEPVC(volumeClaimName, volumeName, volumeSize);
  }

  let { body: pod }: { body: k8s.V1Pod | undefined } =
    await k8sApi.readNamespacedPod(podName, "default").catch((e) => {
      console.log(`failed to get existing ide-pod for user ${name}`)
      return {
        body: undefined,
      }
    })

  if (pod) {
    return {
      status: "running",
    };
  }

  if (!pod) {
    pod = await createIDEPod(podName, volumeName, pvc);
    const service = await createIDEService(serviceName, podName);

    const { spec } = service;

    if (spec && spec.clusterIP) {
      return {
        status: "created",
        clusterIP: spec.clusterIP,
      };
    }
  }

  return {
    status: "failed",
  };
};

export const isIDERunning = async (id: string): Promise<boolean> => {
  let { body: pod }: { body: k8s.V1Pod | undefined } = await k8sApi
    .readNamespacedPod(`cl-ide-pod-${id}`, "default")
    .catch((e) => {
      console.log(e);
      return {
        body: undefined,
      } as any;
    });

  return !!pod;
};

export const deletePod = async (podId: string) => {
  k8sApi.deleteNamespacedPod(podId, "default").then((res) => {});
};
