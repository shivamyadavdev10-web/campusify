# Windows-safe terminal commands to clean up existing React Native CLI files
# and initialize the new Expo packages

Write-Host "Cleaning up old React Native CLI files..." -ForegroundColor Cyan

# Remove old directories if they exist
$dirsToRemove = @("node_modules", "android", "ios")
foreach ($dir in $dirsToRemove) {
    if (Test-Path $dir) {
        Remove-Item -Recurse -Force $dir
        Write-Host "Removed $dir" -ForegroundColor Green
    }
}

# Remove package-lock.json or yarn.lock if exists
$filesToRemove = @("package-lock.json", "yarn.lock")
foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        Remove-Item -Force $file
        Write-Host "Removed $file" -ForegroundColor Green
    }
}

Write-Host "Installing fresh dependencies for Expo..." -ForegroundColor Cyan
npm install

Write-Host "Setup complete. You can now run 'npm run start' to start the Expo dev server." -ForegroundColor Green
