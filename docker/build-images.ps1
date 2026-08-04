Write-Host "Building Docker Sandbox Images for CodeProctor..." -ForegroundColor Cyan

$images = @(
    @{ Name = "runner-c"; Path = "c" },
    @{ Name = "runner-cpp"; Path = "cpp" },
    @{ Name = "runner-java"; Path = "java" },
    @{ Name = "runner-python"; Path = "python" },
    @{ Name = "runner-node"; Path = "javascript" }
)

foreach ($img in $images) {
    Write-Host "`nBuilding $($img.Name)..." -ForegroundColor Yellow
    docker build -t $img.Name "./$($img.Path)"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully built $($img.Name)" -ForegroundColor Green
    } else {
        Write-Host "Failed to build $($img.Name)" -ForegroundColor Red
    }
}

Write-Host "`nAll builds completed!" -ForegroundColor Cyan
