push-web:
	doctl registry login
	docker build -t cl-web:latest --platform linux/amd64 .
	docker tag cl-web:latest registry.digitalocean.com/codelaunch/cl-web:latest
	docker push registry.digitalocean.com/codelaunch/cl-web:latest