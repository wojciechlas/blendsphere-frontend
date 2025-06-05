---
title: PocketBase Setup and Configuration
description: Complete setup guide for PocketBase backend in BlendSphere development and production environments
version: 1.0.0
last_updated: 2024-12-19
component: PocketBaseSetup
dependencies:
  - PocketBase
  - Linux/macOS/WSL
  - Bash
context_tags:
  - '#setup'
  - '#pocketbase'
  - '#backend'
  - '#deployment'
  - '#configuration'
related_docs:
  - 'docs/api/pocketbase-integration.md'
  - 'docs/api/pocketbase-collections.md'
  - 'docs/architecture/data-structure.md'
ai_context:
  intent: 'Provide comprehensive PocketBase setup instructions for AI to understand deployment patterns'
  patterns: ['installation scripts', 'configuration management', 'environment setup']
  considerations: ['security', 'performance', 'development workflow']
---

# PocketBase Setup and Configuration

## Overview

This guide provides comprehensive instructions for setting up, configuring, and deploying PocketBase as the backend for BlendSphere. It covers development environment setup, production deployment, security configuration, and troubleshooting.

## Prerequisites

### System Requirements

- **Operating System**: Linux, macOS, or Windows with WSL2
- **Memory**: Minimum 512MB RAM (2GB+ recommended for production)
- **Storage**: 1GB+ available disk space
- **Network**: Internet access for initial download and updates

### Required Tools

```bash
# Check if required tools are available
which curl || which wget  # For downloading PocketBase
which unzip                # For extracting archives
which bash                 # For running scripts
```

### Environment Verification

```bash
# Verify system compatibility
uname -m  # Should show: x86_64, arm64, or armv7l
ulimit -n  # Should show: 1024 or higher for file descriptors
```

---

## Installation

### SETUP-PB-001: Automated Installation

The BlendSphere project includes automated installation scripts for easy setup:

```bash
# Navigate to PocketBase directory
cd /home/wlas/BlendSphere/pocketbase

# Make scripts executable
chmod +x *.sh

# Run installation
./install_pocketbase.sh
```

#### Installation Script Details

```bash
#!/bin/bash
# install_pocketbase.sh - Automated PocketBase installation

set -e  # Exit on any error

POCKETBASE_VERSION="0.28.2"
PLATFORM="linux_amd64"  # Adjust for your platform

# Detect platform automatically
detect_platform() {
    local arch=$(uname -m)
    local os=$(uname -s | tr '[:upper:]' '[:lower:]')

    case "$arch" in
        x86_64)   arch="amd64" ;;
        aarch64)  arch="arm64" ;;
        arm*)     arch="armv7" ;;
        *)        echo "Unsupported architecture: $arch"; exit 1 ;;
    esac

    case "$os" in
        linux)   os="linux" ;;
        darwin)  os="darwin" ;;
        *)       echo "Unsupported OS: $os"; exit 1 ;;
    esac

    echo "${os}_${arch}"
}

PLATFORM=$(detect_platform)
DOWNLOAD_URL="https://github.com/pocketbase/pocketbase/releases/download/v${POCKETBASE_VERSION}/pocketbase_${POCKETBASE_VERSION}_${PLATFORM}.zip"

echo "🚀 Installing PocketBase v${POCKETBASE_VERSION} for ${PLATFORM}..."

# Create backup if existing installation
if [ -f "pocketbase" ]; then
    echo "📦 Backing up existing installation..."
    mv pocketbase "pocketbase.backup.$(date +%s)"
fi

# Download with retry logic
download_with_retry() {
    local url="$1"
    local output="$2"
    local max_attempts=3
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        echo "📥 Download attempt $attempt/$max_attempts..."

        if command -v curl >/dev/null 2>&1; then
            curl -L "$url" -o "$output" && break
        elif command -v wget >/dev/null 2>&1; then
            wget "$url" -O "$output" && break
        else
            echo "❌ Neither curl nor wget found"
            exit 1
        fi

        echo "⚠️ Download failed, retrying..."
        attempt=$((attempt + 1))
        sleep 2
    done

    if [ $attempt -gt $max_attempts ]; then
        echo "❌ Download failed after $max_attempts attempts"
        exit 1
    fi
}

# Download PocketBase
download_with_retry "$DOWNLOAD_URL" "pocketbase.zip"

# Extract and setup
echo "📦 Extracting PocketBase..."
unzip -q pocketbase.zip

# Make executable
chmod +x pocketbase

# Verify installation
if ./pocketbase --version; then
    echo "✅ PocketBase installed successfully!"
    echo "📁 Installation location: $(pwd)/pocketbase"
    echo "🏃 Run './run_pocketbase.sh' to start the server"
else
    echo "❌ Installation verification failed"
    exit 1
fi

# Clean up
rm -f pocketbase.zip
echo "🧹 Cleaned up temporary files"

# Setup data directory
mkdir -p pb_data
echo "📂 Created data directory: pb_data/"

echo ""
echo "🎉 Installation complete!"
echo "Next steps:"
echo "  1. Run: ./run_pocketbase.sh"
echo "  2. Open: http://localhost:8090/_/"
echo "  3. Create your admin account"
```

### SETUP-PB-002: Manual Installation

For custom installations or troubleshooting:

```bash
# Manual installation steps
POCKETBASE_VERSION="0.28.2"
PLATFORM="linux_amd64"  # Adjust as needed

# Download
curl -L "https://github.com/pocketbase/pocketbase/releases/download/v${POCKETBASE_VERSION}/pocketbase_${POCKETBASE_VERSION}_${PLATFORM}.zip" -o pocketbase.zip

# Extract
unzip pocketbase.zip

# Set permissions
chmod +x pocketbase

# Verify
./pocketbase --version

# Cleanup
rm pocketbase.zip
```

---

## Configuration

### SETUP-PB-003: Development Configuration

Create a comprehensive run script for development:

```bash
#!/bin/bash
# run_pocketbase.sh - Development server launcher

set -e

POCKETBASE_HOST="${POCKETBASE_HOST:-127.0.0.1}"
POCKETBASE_PORT="${POCKETBASE_PORT:-8090}"
POCKETBASE_DATA_DIR="${POCKETBASE_DATA_DIR:-./pb_data}"

echo "🚀 Starting PocketBase development server..."
echo "📡 Host: $POCKETBASE_HOST"
echo "🔌 Port: $POCKETBASE_PORT"
echo "📂 Data: $POCKETBASE_DATA_DIR"

# Create data directory if it doesn't exist
mkdir -p "$POCKETBASE_DATA_DIR"

# Check if port is available
if command -v lsof >/dev/null 2>&1; then
    if lsof -Pi :$POCKETBASE_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️ Port $POCKETBASE_PORT is already in use"
        echo "Run: lsof -ti:$POCKETBASE_PORT | xargs kill -9"
        exit 1
    fi
fi

# Apply migrations if they exist
if [ -d "./pb_migrations" ] && [ -n "$(ls -A ./pb_migrations 2>/dev/null)" ]; then
    echo "🔄 Applying migrations..."
    ./pocketbase migrate
fi

# Start server
echo "🌐 Server will be available at: http://$POCKETBASE_HOST:$POCKETBASE_PORT"
echo "🔧 Admin UI: http://$POCKETBASE_HOST:$POCKETBASE_PORT/_/"
echo "📊 Health check: http://$POCKETBASE_HOST:$POCKETBASE_PORT/api/health"
echo ""
echo "Press Ctrl+C to stop the server"

exec ./pocketbase serve \
    --http="$POCKETBASE_HOST:$POCKETBASE_PORT" \
    --dir="$POCKETBASE_DATA_DIR"
```

### SETUP-PB-004: Environment Variables

```bash
# .env.development
POCKETBASE_HOST=127.0.0.1
POCKETBASE_PORT=8090
POCKETBASE_DATA_DIR=./pb_data
POCKETBASE_LOG_LEVEL=debug
POCKETBASE_ENCRYPTION_ENV=development

# .env.production
POCKETBASE_HOST=0.0.0.0
POCKETBASE_PORT=8090
POCKETBASE_DATA_DIR=/var/lib/pocketbase
POCKETBASE_LOG_LEVEL=info
POCKETBASE_ENCRYPTION_ENV=production
POCKETBASE_SETTINGS_S3_ENABLED=true
POCKETBASE_SETTINGS_SMTP_ENABLED=true
```

### SETUP-PB-005: Advanced Configuration

```javascript
// pb_hooks/main.pb.js - Custom PocketBase hooks
onRecordBeforeCreateRequest(
	(e) => {
		// Add automatic timestamps
		if (e.collection.name === 'flashcards') {
			e.record.set('created', new Date().toISOString());
			e.record.set('updated', new Date().toISOString());
		}
	},
	'flashcards',
	'templates',
	'decks'
);

onRecordBeforeUpdateRequest(
	(e) => {
		// Update timestamps
		e.record.set('updated', new Date().toISOString());
	},
	'flashcards',
	'templates',
	'decks'
);

onRecordAfterCreateRequest((e) => {
	// Send welcome email for new users
	if (e.collection.name === 'users') {
		const mailClient = new MailClient({
			smtp: {
				host: $app.settings().smtp.host,
				port: $app.settings().smtp.port,
				username: $app.settings().smtp.username,
				password: $app.settings().smtp.password
			}
		});

		mailClient.send({
			from: 'noreply@blendsphere.com',
			to: e.record.email(),
			subject: 'Welcome to BlendSphere!',
			html: `
                <h1>Welcome to BlendSphere!</h1>
                <p>Your language learning journey starts here.</p>
            `
		});
	}
}, 'users');
```

---

## Security Configuration

### SETUP-PB-006: Authentication Setup

```bash
# test_connection.sh - Connection and security testing
#!/bin/bash

POCKETBASE_URL="${POCKETBASE_URL:-http://localhost:8090}"

echo "🔍 Testing PocketBase connection..."

# Test basic connectivity
if curl -s "$POCKETBASE_URL/api/health" >/dev/null; then
    echo "✅ PocketBase is accessible"
else
    echo "❌ Cannot connect to PocketBase"
    exit 1
fi

# Test API endpoints
echo "🔍 Testing API endpoints..."

endpoints=(
    "/api/health"
    "/api/collections"
    "/_/"
)

for endpoint in "${endpoints[@]}"; do
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$POCKETBASE_URL$endpoint")

    if [ "$status_code" -eq 200 ] || [ "$status_code" -eq 401 ]; then
        echo "✅ $endpoint - Status: $status_code"
    else
        echo "❌ $endpoint - Status: $status_code"
    fi
done

echo "🔍 Testing CORS headers..."
curl -s -I "$POCKETBASE_URL/api/health" | grep -i "access-control"

echo ""
echo "🔍 Connection test complete!"
```

### SETUP-PB-007: Production Security

```bash
# production_setup.sh - Production security configuration
#!/bin/bash

echo "🔒 Configuring production security..."

# Set secure file permissions
chmod 700 pb_data/
chmod 600 pb_data/data.db*
chmod 600 pb_data/logs.db*

# Generate secure encryption key
openssl rand -hex 32 > pb_data/encryption.key
chmod 600 pb_data/encryption.key

# Configure firewall (if using ufw)
if command -v ufw >/dev/null 2>&1; then
    echo "🔥 Configuring firewall..."
    ufw allow 8090/tcp comment "PocketBase"
    ufw reload
fi

# Set up reverse proxy configuration (nginx example)
cat > /etc/nginx/sites-available/pocketbase << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support for real-time features
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

echo "✅ Production security configured"
echo "Next steps:"
echo "  1. Enable nginx site: ln -s /etc/nginx/sites-available/pocketbase /etc/nginx/sites-enabled/"
echo "  2. Get SSL certificate: certbot --nginx -d your-domain.com"
echo "  3. Configure SMTP settings in PocketBase admin"
echo "  4. Set up regular backups"
```

---

## Database Management

### SETUP-PB-008: Migration Management

```bash
# run_migrations.sh - Database migration runner
#!/bin/bash

set -e

MIGRATIONS_DIR="./pb_migrations"
BACKUP_DIR="./pb_backups"

echo "🔄 Running PocketBase migrations..."

# Create backup before migrations
if [ -f "./pb_data/data.db" ]; then
    echo "💾 Creating backup before migration..."
    mkdir -p "$BACKUP_DIR"
    cp "./pb_data/data.db" "$BACKUP_DIR/data.db.$(date +%Y%m%d_%H%M%S)"
    echo "✅ Backup created"
fi

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo "⚠️ No migrations directory found"
    exit 0
fi

# Run migrations
if [ -n "$(ls -A $MIGRATIONS_DIR 2>/dev/null)" ]; then
    echo "📦 Found migrations:"
    ls -la "$MIGRATIONS_DIR"

    ./pocketbase migrate
    echo "✅ Migrations completed successfully"
else
    echo "ℹ️ No migrations to run"
fi
```

### SETUP-PB-009: Backup and Restore

```bash
# backup_pocketbase.sh - Automated backup system
#!/bin/bash

BACKUP_DIR="${BACKUP_DIR:-./pb_backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "💾 Creating PocketBase backup..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Stop PocketBase if running
if pgrep -f pocketbase >/dev/null; then
    echo "⏸️ Stopping PocketBase for backup..."
    pkill -f pocketbase
    RESTART_AFTER_BACKUP=true
fi

# Create backup
if [ -f "./pb_data/data.db" ]; then
    cp "./pb_data/data.db" "$BACKUP_DIR/data.db.$TIMESTAMP"

    # Compress backup
    gzip "$BACKUP_DIR/data.db.$TIMESTAMP"

    echo "✅ Backup created: $BACKUP_DIR/data.db.$TIMESTAMP.gz"
else
    echo "❌ Database file not found"
    exit 1
fi

# Clean old backups
echo "🧹 Cleaning old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "data.db.*.gz" -mtime +$RETENTION_DAYS -delete

# Restart PocketBase if it was running
if [ "$RESTART_AFTER_BACKUP" = true ]; then
    echo "▶️ Restarting PocketBase..."
    ./run_pocketbase.sh &
fi

echo "✅ Backup process completed"
```

---

## Monitoring and Health Checks

### SETUP-PB-010: Health Monitoring

```bash
# monitor_pocketbase.sh - Health monitoring script
#!/bin/bash

POCKETBASE_URL="${POCKETBASE_URL:-http://localhost:8090}"
LOG_FILE="${LOG_FILE:-./pb_monitor.log}"

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

check_health() {
    local response
    local status_code

    response=$(curl -s -w "%{http_code}" "$POCKETBASE_URL/api/health")
    status_code="${response: -3}"

    if [ "$status_code" -eq 200 ]; then
        log_message "✅ PocketBase is healthy"
        return 0
    else
        log_message "❌ PocketBase health check failed (HTTP $status_code)"
        return 1
    fi
}

check_database() {
    if [ -f "./pb_data/data.db" ]; then
        local db_size=$(du -h "./pb_data/data.db" | cut -f1)
        log_message "📊 Database size: $db_size"
    else
        log_message "⚠️ Database file not found"
    fi
}

check_disk_space() {
    local available=$(df -h . | tail -1 | awk '{print $4}')
    log_message "💾 Available disk space: $available"
}

# Main monitoring loop
log_message "🔍 Starting PocketBase monitoring..."

while true; do
    if check_health; then
        check_database
        check_disk_space
    else
        log_message "🚨 PocketBase appears to be down!"

        # Optional: Restart PocketBase automatically
        if [ "$AUTO_RESTART" = "true" ]; then
            log_message "🔄 Attempting to restart PocketBase..."
            ./run_pocketbase.sh &
        fi
    fi

    sleep 60  # Check every minute
done
```

---

## Troubleshooting

### SETUP-PB-011: Common Issues and Solutions

```bash
# troubleshoot_pocketbase.sh - Diagnostic and troubleshooting tool
#!/bin/bash

echo "🔧 PocketBase Troubleshooting Tool"
echo "=================================="

# Check if PocketBase binary exists
if [ ! -f "./pocketbase" ]; then
    echo "❌ PocketBase binary not found"
    echo "Solution: Run ./install_pocketbase.sh"
    exit 1
fi

# Check binary permissions
if [ ! -x "./pocketbase" ]; then
    echo "❌ PocketBase binary is not executable"
    echo "Solution: chmod +x pocketbase"
    exit 1
fi

# Check version
echo "📋 PocketBase version:"
./pocketbase --version

# Check port availability
if command -v lsof >/dev/null 2>&1; then
    if lsof -Pi :8090 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️ Port 8090 is in use:"
        lsof -Pi :8090 -sTCP:LISTEN
        echo "Solution: Kill process or use different port"
    else
        echo "✅ Port 8090 is available"
    fi
fi

# Check data directory
if [ -d "./pb_data" ]; then
    echo "✅ Data directory exists"
    echo "📊 Contents:"
    ls -la ./pb_data/
else
    echo "⚠️ Data directory not found"
    echo "Solution: mkdir pb_data"
fi

# Check database file
if [ -f "./pb_data/data.db" ]; then
    echo "✅ Database file exists"
    local db_size=$(du -h "./pb_data/data.db" | cut -f1)
    echo "📏 Database size: $db_size"
else
    echo "ℹ️ Database file not found (normal for first run)"
fi

# Check migrations
if [ -d "./pb_migrations" ]; then
    echo "📦 Migrations directory:"
    ls -la ./pb_migrations/
else
    echo "ℹ️ No migrations directory found"
fi

# Test network connectivity
echo "🌐 Testing network connectivity..."
if curl -s --max-time 5 http://github.com >/dev/null; then
    echo "✅ Internet connection available"
else
    echo "⚠️ Internet connection issues"
fi

# Memory check
if command -v free >/dev/null 2>&1; then
    echo "💾 Memory usage:"
    free -h
fi

# Disk space check
echo "💿 Disk space:"
df -h .

echo ""
echo "🔧 Troubleshooting complete!"
echo "If issues persist, check the logs in pb_data/logs.db"
```

### SETUP-PB-012: Log Analysis

```bash
# analyze_logs.sh - Log analysis tool
#!/bin/bash

LOGS_DB="./pb_data/logs.db"

if [ ! -f "$LOGS_DB" ]; then
    echo "❌ Logs database not found"
    exit 1
fi

echo "📊 PocketBase Log Analysis"
echo "=========================="

# Recent errors
echo "🚨 Recent errors (last 24 hours):"
sqlite3 "$LOGS_DB" "
    SELECT datetime(created, 'unixepoch'), level, message
    FROM _logs
    WHERE level = 'ERROR'
    AND created > strftime('%s', 'now', '-1 day')
    ORDER BY created DESC
    LIMIT 10;
"

# Request statistics
echo ""
echo "📈 Request statistics (last hour):"
sqlite3 "$LOGS_DB" "
    SELECT COUNT(*) as total_requests,
           AVG(CAST(substr(data, instr(data, 'duration') + 10, 10) AS REAL)) as avg_duration_ms
    FROM _logs
    WHERE level = 'INFO'
    AND message LIKE '%HTTP%'
    AND created > strftime('%s', 'now', '-1 hour');
"

# Most frequent endpoints
echo ""
echo "🔥 Most active endpoints (last hour):"
sqlite3 "$LOGS_DB" "
    SELECT substr(message, instr(message, ' ') + 1, instr(substr(message, instr(message, ' ') + 1), ' ') - 1) as endpoint,
           COUNT(*) as requests
    FROM _logs
    WHERE level = 'INFO'
    AND message LIKE '%HTTP%'
    AND created > strftime('%s', 'now', '-1 hour')
    GROUP BY endpoint
    ORDER BY requests DESC
    LIMIT 10;
"
```

---

## Performance Optimization

### SETUP-PB-013: Performance Tuning

```bash
# optimize_pocketbase.sh - Performance optimization script
#!/bin/bash

echo "⚡ Optimizing PocketBase performance..."

# Database optimization
if [ -f "./pb_data/data.db" ]; then
    echo "🔧 Optimizing database..."

    # Run VACUUM to reclaim space
    sqlite3 "./pb_data/data.db" "VACUUM;"

    # Update statistics
    sqlite3 "./pb_data/data.db" "ANALYZE;"

    echo "✅ Database optimized"
fi

# Configure SQLite pragmas for better performance
cat > ./pb_hooks/optimize.pb.js << 'EOF'
// Performance optimization hooks
onSettingsListRequest((e) => {
    // Set optimal SQLite pragmas
    $app.dao().db().exec(`
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA cache_size = 10000;
        PRAGMA temp_store = memory;
        PRAGMA mmap_size = 268435456;
    `);
});
EOF

echo "⚡ Performance optimizations applied"
echo "Recommended settings:"
echo "  - Use SSD storage for better I/O"
echo "  - Increase available RAM"
echo "  - Configure reverse proxy caching"
echo "  - Enable gzip compression"
```

---

## Production Deployment

### SETUP-PB-014: Docker Deployment

```dockerfile
# Dockerfile for PocketBase
FROM alpine:latest

# Install dependencies
RUN apk add --no-cache \
    ca-certificates \
    unzip \
    curl

# Create app directory
WORKDIR /app

# Download and install PocketBase
ARG POCKETBASE_VERSION=0.28.2
RUN curl -L "https://github.com/pocketbase/pocketbase/releases/download/v${POCKETBASE_VERSION}/pocketbase_${POCKETBASE_VERSION}_linux_amd64.zip" -o pocketbase.zip \
    && unzip pocketbase.zip \
    && chmod +x pocketbase \
    && rm pocketbase.zip

# Create data directory
RUN mkdir -p /app/pb_data

# Expose port
EXPOSE 8090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8090/api/health || exit 1

# Run PocketBase
CMD ["./pocketbase", "serve", "--http=0.0.0.0:8090"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  pocketbase:
    build: .
    ports:
      - '8090:8090'
    volumes:
      - pocketbase_data:/app/pb_data
      - ./pb_migrations:/app/pb_migrations:ro
      - ./pb_hooks:/app/pb_hooks:ro
    environment:
      - POCKETBASE_LOG_LEVEL=info
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8090/api/health']
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  pocketbase_data:
```

---

## Cross-References

- **Integration**: [PocketBase Integration API](pocketbase-integration.md)
- **Collections**: [PocketBase Collections Schema](pocketbase-collections.md)
- **Architecture**: [Data Structure Architecture](../architecture/data-structure.md)
- **Frontend**: [Frontend Architecture](../architecture/frontend-architecture.md)

---

## Validation Checklist

### Installation Validation

- [ ] PocketBase binary downloads and runs correctly
- [ ] Scripts execute without errors
- [ ] Version verification passes
- [ ] Port availability check works
- [ ] Admin UI is accessible

### Configuration Validation

- [ ] Environment variables load correctly
- [ ] Security settings are applied
- [ ] Database migrations run successfully
- [ ] Authentication providers work
- [ ] API endpoints respond correctly

### Production Readiness

- [ ] SSL/TLS certificates configured
- [ ] Firewall rules implemented
- [ ] Backup system operational
- [ ] Monitoring alerts configured
- [ ] Performance optimizations applied

### Security Validation

- [ ] File permissions properly set
- [ ] Admin accounts secured
- [ ] API access controls working
- [ ] Data encryption enabled
- [ ] Network security configured
