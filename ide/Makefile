build:
	docker build --no-cache -t mc-ide .

list:
	docker images | grep mc-ide 

run:
	rm -rf test/ && mkdir test/
	docker run --rm -it -e PASSWORD="coder" --name mc-ide -p 8080:8080 -v $$(pwd)/test:/files mc-ide 