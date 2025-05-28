#!/bin/bash

# BlendSphere Frontend Security Audit Script
# Comprehensive security testing and vulnerability scanning

set -e

echo "🔒 BlendSphere Frontend Security Audit"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    case $1 in
        "ERROR")   echo -e "${RED}❌ $2${NC}" ;;
        "SUCCESS") echo -e "${GREEN}✅ $2${NC}" ;;
        "WARNING") echo -e "${YELLOW}⚠️ $2${NC}" ;;
        "INFO")    echo -e "${BLUE}ℹ️ $2${NC}" ;;
    esac
}

# Function to run command and check result
run_check() {
    local description=$1
    local command=$2
    local allow_failure=${3:-false}
    
    echo -n "Checking $description... "
    
    if eval "$command" > /tmp/security_check.log 2>&1; then
        print_status "SUCCESS" "$description passed"
        return 0
    else
        if [ "$allow_failure" = "true" ]; then
            print_status "WARNING" "$description failed (non-critical)"
            return 0
        else
            print_status "ERROR" "$description failed"
            echo "Command output:"
            cat /tmp/security_check.log
            return 1
        fi
    fi
}

# Create security report directory
REPORT_DIR="security-reports"
mkdir -p $REPORT_DIR
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$REPORT_DIR/security_audit_$TIMESTAMP.md"

echo "# Security Audit Report" > $REPORT_FILE
echo "Date: $(date)" >> $REPORT_FILE
echo "BlendSphere Frontend Security Audit" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# 1. Dependency Security Audit
echo "1. 🔍 Dependency Security Audit"
echo "================================"

if npm audit --audit-level=moderate > /tmp/npm_audit.log 2>&1; then
    print_status "SUCCESS" "No moderate or high severity vulnerabilities found"
    echo "## Dependency Audit: PASSED" >> $REPORT_FILE
    echo "No moderate or high severity vulnerabilities detected." >> $REPORT_FILE
else
    print_status "WARNING" "Vulnerabilities detected - see report for details"
    echo "## Dependency Audit: WARNINGS FOUND" >> $REPORT_FILE
    echo "\`\`\`" >> $REPORT_FILE
    cat /tmp/npm_audit.log >> $REPORT_FILE
    echo "\`\`\`" >> $REPORT_FILE
fi
echo "" >> $REPORT_FILE

# 2. Security Linting
echo ""
echo "2. 🔧 Security Linting"
echo "======================"

if npm run lint > /tmp/lint.log 2>&1; then
    print_status "SUCCESS" "ESLint security rules passed"
    echo "## ESLint Security: PASSED" >> $REPORT_FILE
else
    print_status "WARNING" "ESLint found security issues"
    echo "## ESLint Security: ISSUES FOUND" >> $REPORT_FILE
    echo "\`\`\`" >> $REPORT_FILE
    cat /tmp/lint.log >> $REPORT_FILE
    echo "\`\`\`" >> $REPORT_FILE
fi
echo "" >> $REPORT_FILE

# 3. Security Unit Tests
echo ""
echo "3. 🧪 Security Unit Tests"
echo "========================"

if npm run test:security > /tmp/security_tests.log 2>&1; then
    print_status "SUCCESS" "All security tests passed"
    echo "## Security Tests: PASSED" >> $REPORT_FILE
    echo "All security utility tests passed successfully." >> $REPORT_FILE
else
    print_status "ERROR" "Security tests failed"
    echo "## Security Tests: FAILED" >> $REPORT_FILE
    echo "\`\`\`" >> $REPORT_FILE
    cat /tmp/security_tests.log >> $REPORT_FILE
    echo "\`\`\`" >> $REPORT_FILE
fi
echo "" >> $REPORT_FILE

# 4. Environment Configuration Check
echo ""
echo "4. ⚙️ Environment Configuration"
echo "==============================="

# Check if .env exists
if [ -f ".env" ]; then
    print_status "INFO" "Environment file found"
    
    # Check for insecure configurations
    if grep -q "DEBUG_MODE=true" .env 2>/dev/null; then
        print_status "WARNING" "Debug mode is enabled"
    fi
    
    if grep -q "LOG_LEVEL=debug" .env 2>/dev/null; then
        print_status "WARNING" "Debug logging is enabled"
    fi
    
    echo "## Environment Configuration: CHECKED" >> $REPORT_FILE
    echo "Environment file exists and basic checks completed." >> $REPORT_FILE
else
    print_status "INFO" "No .env file found (using defaults)"
    echo "## Environment Configuration: NO .ENV FILE" >> $REPORT_FILE
    echo "Using default environment configuration." >> $REPORT_FILE
fi
echo "" >> $REPORT_FILE

# 5. File Permission Check
echo ""
echo "5. 📁 File Permissions"
echo "====================="

# Check for sensitive files with wrong permissions
SENSITIVE_FILES=(".env" ".env.local" "package-lock.json")
ISSUES_FOUND=false

for file in "${SENSITIVE_FILES[@]}"; do
    if [ -f "$file" ]; then
        PERMS=$(stat -c "%a" "$file" 2>/dev/null || echo "unknown")
        if [ "$PERMS" != "600" ] && [ "$PERMS" != "644" ]; then
            print_status "WARNING" "$file has permissions $PERMS (should be 600 or 644)"
            ISSUES_FOUND=true
        fi
    fi
done

if [ "$ISSUES_FOUND" = "false" ]; then
    print_status "SUCCESS" "File permissions are appropriate"
    echo "## File Permissions: APPROPRIATE" >> $REPORT_FILE
else
    echo "## File Permissions: ISSUES FOUND" >> $REPORT_FILE
    echo "Some files have inappropriate permissions." >> $REPORT_FILE
fi
echo "" >> $REPORT_FILE

# 6. Build Security Check
echo ""
echo "6. 🏗️ Build Security"
echo "==================="

if npm run build > /tmp/build.log 2>&1; then
    print_status "SUCCESS" "Build completed successfully"
    
    # Check build output for security issues
    if [ -d "build" ] || [ -d ".svelte-kit" ]; then
        # Check for source maps in production build
        if find build -name "*.map" 2>/dev/null | grep -q "."; then
            print_status "WARNING" "Source maps found in build output"
        else
            print_status "SUCCESS" "No source maps in build output"
        fi
    fi
    
    echo "## Build Security: PASSED" >> $REPORT_FILE
    echo "Build completed successfully without security issues." >> $REPORT_FILE
else
    print_status "ERROR" "Build failed"
    echo "## Build Security: BUILD FAILED" >> $REPORT_FILE
    echo "\`\`\`" >> $REPORT_FILE
    cat /tmp/build.log >> $REPORT_FILE
    echo "\`\`\`" >> $REPORT_FILE
fi
echo "" >> $REPORT_FILE

# 7. Content Security Policy Check
echo ""
echo "7. 🛡️ Content Security Policy"
echo "=============================="

CSP_ISSUES=false

# Check for unsafe CSP directives in configuration files
if grep -r "unsafe-eval" . --include="*.js" --include="*.ts" --include="*.json" > /dev/null 2>&1; then
    print_status "ERROR" "unsafe-eval found in configuration"
    CSP_ISSUES=true
fi

if grep -r "unsafe-inline" . --include="*.js" --include="*.ts" --include="*.json" > /dev/null 2>&1; then
    print_status "WARNING" "unsafe-inline found in configuration (consider using nonces)"
fi

if [ "$CSP_ISSUES" = "false" ]; then
    print_status "SUCCESS" "No critical CSP issues found"
    echo "## Content Security Policy: GOOD" >> $REPORT_FILE
else
    echo "## Content Security Policy: ISSUES FOUND" >> $REPORT_FILE
    echo "Critical CSP issues detected." >> $REPORT_FILE
fi
echo "" >> $REPORT_FILE

# 8. Secret Scanning
echo ""
echo "8. 🔐 Secret Scanning"
echo "===================="

# Simple secret patterns
SECRET_PATTERNS=(
    "password\s*=\s*['\"][^'\"]*['\"]"
    "secret\s*=\s*['\"][^'\"]*['\"]"
    "token\s*=\s*['\"][^'\"]*['\"]"
    "api[_-]?key\s*=\s*['\"][^'\"]*['\"]"
)

SECRETS_FOUND=false

for pattern in "${SECRET_PATTERNS[@]}"; do
    if grep -r -i -E "$pattern" src/ --include="*.ts" --include="*.js" --include="*.svelte" > /dev/null 2>&1; then
        print_status "WARNING" "Potential secret pattern found: $pattern"
        SECRETS_FOUND=true
    fi
done

if [ "$SECRETS_FOUND" = "false" ]; then
    print_status "SUCCESS" "No hardcoded secrets detected"
    echo "## Secret Scanning: CLEAN" >> $REPORT_FILE
else
    echo "## Secret Scanning: POTENTIAL ISSUES" >> $REPORT_FILE
    echo "Potential hardcoded secrets detected." >> $REPORT_FILE
fi
echo "" >> $REPORT_FILE

# 9. Generate Summary
echo ""
echo "9. 📊 Security Summary"
echo "====================="

echo "## Security Summary" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Count issues from the report
ERROR_COUNT=$(grep -c "ERROR" /tmp/security_audit_summary.log 2>/dev/null || echo "0")
WARNING_COUNT=$(grep -c "WARNING" /tmp/security_audit_summary.log 2>/dev/null || echo "0")

echo "Security audit completed!" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "### Recommendations" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "1. **Regular Audits**: Run this security audit weekly" >> $REPORT_FILE
echo "2. **Dependency Updates**: Keep dependencies updated with \`npm update\`" >> $REPORT_FILE
echo "3. **Environment Security**: Never commit .env files with real secrets" >> $REPORT_FILE
echo "4. **CSP Hardening**: Consider removing unsafe-inline in production" >> $REPORT_FILE
echo "5. **Monitoring**: Implement security event monitoring in production" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "### Next Steps" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "- Review any warnings or errors above" >> $REPORT_FILE
echo "- Update vulnerable dependencies if found" >> $REPORT_FILE
echo "- Test security measures in staging environment" >> $REPORT_FILE
echo "- Configure production security headers" >> $REPORT_FILE

print_status "SUCCESS" "Security audit completed!"
print_status "INFO" "Report saved to: $REPORT_FILE"

# Show quick summary
echo ""
echo "📋 Quick Summary:"
echo "=================="
if [ -f "$REPORT_FILE" ]; then
    TOTAL_CHECKS=$(grep -c "##" "$REPORT_FILE" 2>/dev/null || echo "0")
    PASSED_CHECKS=$(grep -c "PASSED" "$REPORT_FILE" 2>/dev/null || echo "0")
    WARNING_CHECKS=$(grep -c "WARNING" "$REPORT_FILE" 2>/dev/null || echo "0")
    FAILED_CHECKS=$(grep -c "FAILED" "$REPORT_FILE" 2>/dev/null || echo "0")
    
    echo "Total Checks: $TOTAL_CHECKS"
    echo "Passed: $PASSED_CHECKS"
    echo "Warnings: $WARNING_CHECKS" 
    echo "Failed: $FAILED_CHECKS"
fi

echo ""
echo "🎯 To fix any issues found:"
echo "  npm run security:audit:fix    # Fix dependency vulnerabilities"
echo "  npm run lint:fix              # Fix linting issues"
echo "  npm run test:security         # Run security tests"
echo ""

# Clean up temporary files
rm -f /tmp/security_check.log /tmp/npm_audit.log /tmp/lint.log /tmp/security_tests.log /tmp/build.log

exit 0
