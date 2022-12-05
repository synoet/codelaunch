"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    createIDEPod: ()=>createIDEPod,
    deletePod: ()=>deletePod
});
const _clientNode = _interopRequireWildcard(require("@kubernetes/client-node"));
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interopRequireWildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {};
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
const kc = new _clientNode.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(_clientNode.CoreV1Api);
const podFromImage = (userId, pvc)=>{
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
                    name: "mc-ide",
                    image: "localhost:5000/mc-ide:latest"
                }
            ]
        }
    };
};
const volumeWithSize = (name, size)=>{
    return {
        apiVersion: "v1",
        kind: "PersistentVolume",
        metadata: {
            name: name,
            labels: {
                app: "mc-ide"
            }
        },
        spec: {
            volumeType: "pvc",
            accessModes: [
                "ReadWriteMany"
            ],
            capacity: {
                storage: `${size}Gi`
            }
        }
    };
};
const volumeClaimWithSize = (name, size)=>{
    return {
        apiVersion: "v1",
        kind: "PersistentVolumeClaim",
        metadata: {
            name: name,
            labels: {
                app: "mc-ide"
            }
        },
        spec: {
            accessModes: [
                "ReadWriteMany"
            ],
            resources: {
                requests: {
                    storage: `${size}Gi`
                }
            }
        }
    };
};
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
const createIDEPod = async (name, volumeSize = 2)=>{
    const volumeName = `mc-ide-volume-${name}`;
    const volumeClaimName = `mc-ide-pvc-${name}`;
    await k8sApi.createPersistentVolume(volumeWithSize(volumeName, volumeSize)).catch((err)=>{
        console.log(err);
        throw Error("failed to create volume");
    });
    await k8sApi.createNamespacedPersistentVolumeClaim("default", volumeClaimWithSize(volumeClaimName, volumeSize)).catch((err)=>{
        console.log("failed to create namespaced pvc");
        console.log(err);
        return;
    });
    await k8sApi.createNamespacedPod("default", podFromImage(name, volumeClaimName)).catch((err)=>{
        console.log("failed to create namespaced pod");
        console.log(err);
        return;
    });
    const serviceResponse = await k8sApi.createNamespacedService("default", service).catch((err)=>{
        console.log("failed to create namespaced service");
        console.log(err);
        return;
    });
};
const deletePod = async (podId)=>{
    k8sApi.deleteNamespacedPod(podId, "default").then((res)=>{});
};

//# sourceMappingURL=createPod.js.map