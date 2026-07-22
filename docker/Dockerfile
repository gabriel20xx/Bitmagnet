# build web ui
FROM --platform=$BUILDPLATFORM node:24-alpine AS webui-builder
WORKDIR /src/webui

# Cache npm dependencies
COPY webui/package.json webui/package-lock.json ./
RUN npm ci

COPY webui/ ./
RUN npm run build

# build app
FROM --platform=$BUILDPLATFORM golang:1.26.5-alpine3.23 AS app-builder
RUN apk add --no-cache git tzdata

WORKDIR /src

# Cache Go modules
COPY go.mod go.sum ./
RUN go mod download

COPY . ./

# Overwrite the committed webui/dist (kept in git only so a plain `go build` works
# without Node) with a fresh build from current source, so editing webui/src alone
# is enough for changes to ship in this image.
COPY --from=webui-builder /src/webui/dist ./webui/dist

ARG TARGETOS TARGETARCH TARGETVARIANT

RUN --network=none \
export GOOS=$TARGETOS; \
export GOARCH=$TARGETARCH; \
[[ "$GOARCH" == "amd64" ]] && export GOAMD64=$TARGETVARIANT; \
[[ "$GOARCH" == "arm" ]] && [[ "$TARGETVARIANT" == "v6" ]] && export GOARM=6; \
[[ "$GOARCH" == "arm" ]] && [[ "$TARGETVARIANT" == "v7" ]] && export GOARM=7; \
go build -ldflags "-s -w" -o /build/bitmagnet main.go

# build runner
FROM alpine:latest AS runner

RUN apk --no-cache add ca-certificates curl tzdata jq iproute2-ss

ARG POSTGRESQL_URL
ENV POSTGRESQL_URL=${POSTGRESQL_URL}

# API and Web UI port
EXPOSE 3333
# BitTorrent ports
EXPOSE 3334/tcp
EXPOSE 3334/udp

COPY --link --from=app-builder /build/bitmagnet /usr/local/bin/bitmagnet

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -sf -X POST -H 'Content-Type: application/json' \
        -d '{"query":"{health{status}}"}' http://localhost:3333/graphql \
        | jq -e '.data.health.status == "UP"' > /dev/null

ENTRYPOINT ["/usr/local/bin/bitmagnet"]
CMD ["worker", "run", "--all"]
