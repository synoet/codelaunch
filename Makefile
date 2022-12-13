mk-registry-socket:
	docker run --rm -it --network=host alpine ash -c "apk add socat && socat TCP-LISTEN:5000,reuseaddr,fork TCP:host.docker.internal:5000"

mk-proxy-registry:
	kubectl port-forward --namespace kube-system service/registry 5000:80
