FROM codercom/code-server

USER root

RUN apt-get update \
    && apt-get install -y git curl wget

ENTRYPOINT ["bash", "/docker-entrypoint.sh"]

EXPOSE 8080

COPY docker-entrypoint.sh /
COPY donkeypilot.vsix /tmp/donkeypilot.vsix
