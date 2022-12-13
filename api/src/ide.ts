import * as k8s from "@kubernetes/client-node";
import type { V1PersistentVolume } from "@kubernetes/client-node";

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

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
    await k8sApi.createNamespacedPersistentVolumeClaim("default", volumeClaim);

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
        app: "mc-ide",
      },
    },
    spec: {
      containers: [
        {
          name: "mc-ide",
          image: "localhost:5000/mc-ide:latest",
          env: [
            {
              name: "PASSWORD",
              value: "coder",
            },
          ],
        },
      ],
      volumes: [
        {
          name: "mc-ide-volume",
          persistentVolumeClaim: {
            claimName: pvc.metadata?.name as string,
          },
        },
      ],
    },
  };

  const { body: responsePod }: { body: k8s.V1Pod } =
    await k8sApi.createNamespacedPod("default", pod);

  return responsePod;
};

const createIDEService = async (
  name: string,
  pod: k8s.V1Pod
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
        app: "mc-ide",
      },
    },
  };

  const { body: responseService }: { body: k8s.V1Service } =
    await k8sApi.createNamespacedService("default", service);

  return responseService;
};

export const initializeIDE = async (name: string, volumeSize: number = 2) => {
  const volumeName = `mc-ide-volume-${name}`;
  const volumeClaimName = `mc-ide-pvc-${name}`;
  const podName = `mc-ide-pod-${name}`;
  const serviceName = `mc-ide-service-${name}`;
  let { body: pvc }: { body: k8s.V1PersistentVolumeClaim | undefined } =
    await k8sApi
      .readNamespacedPersistentVolumeClaim(volumeClaimName, "default")
      .catch((_) => {
        return {
          body: undefined,
        };
      });

  if (!pvc) {
    pvc = await createIDEPVC(volumeClaimName, volumeName, volumeSize);
  }
  await k8sApi.createPersistentVolume({
    metadata: {
      name: volumeName,
    },
    spec: {
      capacity: {
        storage: `2Gi`,
      },
      accessModes: ["ReadWriteMany"],
      storageClassName: "standard",
      hostPath: {
        path: `/data/${name}`,
      }
    },
  })
  const pod = await createIDEPod(podName, volumeName, pvc);
  const service = await createIDEService(serviceName, pod);
};

export const deletePod = async (podId: string) => {
  k8sApi.deleteNamespacedPod(podId, "default").then((res) => {});
};
