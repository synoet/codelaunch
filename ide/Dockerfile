FROM codercom/code-server

USER root

RUN apt-get update \
    && apt-get install -y git curl wget

ENTRYPOINT ["bash", "/docker-entrypoint.sh"]

COPY docker-entrypoint.sh /
COPY donkeypilot.vsix /tmp/donkeypilot.vsix