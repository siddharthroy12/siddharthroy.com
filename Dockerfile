# Multi-stage build for Pure Go application with CGO support

# Stage 1: Build stage
FROM golang:1.24.5-alpine

# Install necessary packages for CGO and C compiler
ARG MIGRATE_VERSION=v4.16.2
RUN apk add --no-cache \
    git \
    make \
    curl \
    tar \
    gcc \
    musl-dev \
    libc-dev

# Install golang-migrate
RUN curl -L "https://github.com/golang-migrate/migrate/releases/download/${MIGRATE_VERSION}/migrate.linux-amd64.tar.gz" | tar -C /tmp -xz && \
    mv /tmp/migrate /usr/local/bin/migrate && \
    chmod +x /usr/local/bin/migrate

WORKDIR /app

# Enable CGO for png encoder support
ENV CGO_ENABLED=1
ENV GOOS=linux

# Copy all source files
COPY . .

# Build using Makefile (this will build the Go app)
RUN make build

# Expose port
EXPOSE 4000

# Command to run the application
CMD ./bin/web -env production -dsn ${DB_DSN} -gclientid ${GOOGLE_CLIENT_ID} -admin ${ADMIN_EMAIL} -mediadir ./media