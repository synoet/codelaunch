"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createPod", {
    enumerable: true,
    get: ()=>createPod
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
const createPod = async ()=>{
    k8sApi.createNamespacedPod("default", pod).then((res)=>{
        return k8sApi.createNamespacedService("default", service);
    }).then((res)=>{
        console.log(res);
    });
};

//# sourceMappingURL=createPod.js.map