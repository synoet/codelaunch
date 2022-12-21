build:
	docker build --no-cache -t mc-ide .

list:
	docker images | grep mc-ide 

run:
	rm -rf test/ && mkdir test/
	docker run --rm -it -e PASSWORD="coder" --name mc-ide -p 8080:8080 -v $$(pwd)/test:/files mc-ide 


push-ide:
	doctl registry login
	docker build -t cl-ide:latest --platform linux/amd64 .
	docker tag cl-ide:latest registry.digitalocean.com/codelaunch/cl-ide:latest
	docker push registry.digitalocean.com/codelaunch/cl-ide:latest
