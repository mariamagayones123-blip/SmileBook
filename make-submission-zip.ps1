# Makes a clean zip you can safely send or submit (no passwords, no keys, no local data).
# How to use: open PowerShell in the project folder and run:   .\make-submission-zip.ps1
# Result: SmileBook_clean.zip (saved next to the project folder)

$root  = $PSScriptRoot
$stage = Join-Path $env:TEMP 'smilebook_zip_stage'
$out   = Join-Path (Split-Path $root -Parent) 'SmileBook_clean.zip'

if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
if (Test-Path $out)   { Remove-Item $out -Force }

# Copy everything except secrets, local data, and folders that can be re-installed
robocopy $root "$stage\SmileBook" /E `
  /XD node_modules vendor .git dist `
  /XF .env .env.backup .env.local .env.production *.sqlite *.sqlite3 .phpunit.result.cache *.log `
  /NFL /NDL /NJH /NJS /NP | Out-Null

# Safety check: stop if a secret file is still inside
$left = Get-ChildItem $stage -Recurse -Force -File | Where-Object { $_.Name -in '.env', '.env.backup', '.env.local', '.env.production' }
if ($left) {
  Write-Host 'STOP: secret files are still in the copy:' -ForegroundColor Red
  $left | ForEach-Object { Write-Host $_.FullName }
  exit 1
}

tar -a -c -f $out -C $stage SmileBook
Remove-Item $stage -Recurse -Force
Write-Host "Done. Clean zip saved to: $out" -ForegroundColor Green
