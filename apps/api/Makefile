push-api:
	doctl registry login
	docker build -t cl-api-prod:latest --platform linux/amd64 .
	docker tag cl-api-prod:latest registry.digitalocean.com/codelaunch/cl-api:latest
	docker push registry.digitalocean.com/codelaunch/cl-api:latest

push-proxy:
	doctl registry login
	docker build -t cl-proxy:latest --platform linux/amd64 -f ./Dockerfile.proxy .
	docker tag cl-proxy:latest registry.digitalocean.com/codelaunch/cl-proxy:latest
	docker push registry.digitalocean.com/codelaunch/cl-proxy:latest


