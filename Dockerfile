# Stage 1
FROM alpine/git as clone
WORKDIR /clone
RUN git clone https://github.com/GraphLinq/GraphLinq-Chain.git
RUN git clone https://github.com/GraphLinq/GraphLinq-Internal-Docker-Chain-Manager.git
# Stage 2
FROM golang:1.23.3-bullseye AS build
WORKDIR /GraphLinq-Chain
COPY --from=clone /clone/GraphLinq-Chain/ .
RUN go run ./build/ci.go install ./cmd/geth
RUN go run ./build/ci.go install ./cmd/bootnode
# Stage 3
FROM node:18.16.0 AS final
WORKDIR /app
COPY --from=build /GraphLinq-Chain/build/ .
COPY --from=clone /clone/GraphLinq-Internal-Docker-Chain-Manager/ .
RUN npm install
ENTRYPOINT ["npm", "run", "prod"]
