# PowerShell script to add dynamic export to all API routes

$apiPath = "app\api"
$routeFiles = Get-ChildItem -Path $apiPath -Filter "route.ts" -Recurse

$fixed = 0
$skipped = 0

Write-Host "Adding dynamic export to API routes" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

foreach ($file in $routeFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Check if already has dynamic export
    if ($content -match "export const dynamic = ") {
        Write-Host "Already configured: $($file.Directory.Name)\$($file.Name)" -ForegroundColor Gray
        $skipped++
        continue
    }
    
    # Find the position after imports
    $lines = Get-Content -Path $file.FullName
    $insertIndex = 0
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i].Trim()
        if ($line -match "^import ") {
            $insertIndex = $i + 1
        }
        # Stop at first non-import, non-comment, non-empty line
        if ($line -and 
            $line -notmatch "^import " -and 
            $line -notmatch "^//" -and 
            $line -notmatch "^/\*" -and 
            $line -notmatch "^\*") {
            break
        }
    }
    
    # Insert the dynamic export
    $newLines = @()
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $newLines += $lines[$i]
        if ($i -eq $insertIndex - 1) {
            $newLines += ""
            $newLines += "export const dynamic = 'force-dynamic';"
            $newLines += ""
        }
    }
    
    # Write back to file
    $newLines | Set-Content -Path $file.FullName -Encoding UTF8
    Write-Host "Fixed: $($file.Directory.Name)\$($file.Name)" -ForegroundColor Green
    $fixed++
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete!" -ForegroundColor Green
Write-Host "   - Fixed: $fixed files" -ForegroundColor White
Write-Host "   - Skipped: $skipped files" -ForegroundColor White
$total = $routeFiles.Count
Write-Host "   - Total: $total files" -ForegroundColor White
