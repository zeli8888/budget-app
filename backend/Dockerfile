# Build stage: Use a Go image with Alpine for a lightweight build environment
FROM golang:1.21-alpine AS builder

# Install C compiler and SQLite development headers required for CGO
RUN apk add --no-cache gcc musl-dev sqlite-dev

# Set the working directory inside the container for all subsequent commands
WORKDIR /app

# Copy only dependency files first to leverage Docker layer caching
COPY go.mod go.sum ./
# Download all Go modules defined in the go.mod file
RUN go mod download

# Copy the rest of the application source code into the container
COPY . .

# Build the Go app with CGO enabled and static linking to ensure it runs on any Linux distro
RUN CGO_ENABLED=1 GOOS=linux go build -a -ldflags '-linkmode external -extldflags "-static"' -o main ./cmd/api

# Runtime stage: Use a fresh, tiny Alpine image for the final production environment
FROM alpine:3.19

# Install CA certificates for HTTPS requests and wget for health checks
RUN apk add --no-cache ca-certificates wget

# Set the working directory for the running application
WORKDIR /app

# Copy only the compiled binary from the builder stage to keep the image small
COPY --from=builder /app/main .
# Copy database migration files needed for schema updates at runtime
COPY --from=builder /app/migrations ./migrations

# Create a data directory to store the SQLite database file (.db)
RUN mkdir -p /app/data

# Define the command to execute the application when the container starts
CMD ["./main"]