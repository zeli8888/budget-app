# Build stage
FROM golang:1.21-alpine AS builder

RUN apk add --no-cache gcc musl-dev sqlite-dev

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=1 GOOS=linux go build -a -ldflags '-linkmode external -extldflags "-static"' -o main ./cmd/api

# Runtime stage
FROM alpine:3.19

RUN apk add --no-cache ca-certificates wget

WORKDIR /app

COPY --from=builder /app/main .
COPY --from=builder /app/migrations ./migrations

RUN mkdir -p /app/data

EXPOSE 8080

CMD ["./main"]
