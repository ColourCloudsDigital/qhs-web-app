# Hostinger Deployment Script (PowerShell)
# This script helps deploy the Next.js application to Hostinger

param(
    [string]$HostingerIP = "89.117.229.102",
    [string]$HostingerPort = "65002", 
    [string]$HostingerUser = "u121926825",
    [string]$HostingerPath = "public_html"
)

Write-Host "🚀 Starting Hostinger Deployment Process..." -ForegroundColor Green

# Step 1: Create deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow

# Create exclusion list for tar
$e