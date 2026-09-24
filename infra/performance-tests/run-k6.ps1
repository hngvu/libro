<#
.SYNOPSIS
    Script tự động thực thi k6 Performance Test cho hệ thống Libro.
.DESCRIPTION
    Script tự động phát hiện k6 CLI nội bộ hoặc sử dụng Docker container grafana/k6.
.PARAMETER Scenario
    Kịch bản test: smoke, load, stress, spike, realistic (mặc định: smoke)
.PARAMETER TargetUrl
    URL backend (mặc định: http://localhost:8080/api)
#>

param (
    [ValidateSet("smoke", "load", "stress", "spike", "realistic", "network-io")]
    [string]$Scenario = "smoke",

    [string]$TargetUrl = "http://host.docker.internal:8080/api"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$scenarioMap = @{
    "smoke"      = "k6/scenarios/smoke-test.js"
    "load"       = "k6/scenarios/load-test.js"
    "stress"     = "k6/scenarios/stress-test.js"
    "spike"      = "k6/scenarios/spike-test.js"
    "realistic"  = "k6/main.js"
    "network-io" = "k6/scenarios/network-io-test.js"
}

$targetFile = $scenarioMap[$Scenario]
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " [LIBRO] Chạy Performance Test: $Scenario ($targetFile)" -ForegroundColor Green
Write-Host " Target URL: $TargetUrl" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# Kiểm tra nếu k6 đã được cài đặt cục bộ
if (Get-Command k6 -ErrorAction SilentlyContinue) {
    Write-Host "[INFO] Phát hiện k6 CLI cục bộ. Bắt đầu chạy..." -ForegroundColor Cyan
    $localUrl = $TargetUrl.Replace("host.docker.internal", "localhost")
    k6 run -e BASE_URL="$localUrl" "$scriptDir/$targetFile"
}
# Nếu chưa có k6, sử dụng Docker image grafana/k6
elseif (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "[INFO] Không tìm thấy k6 CLI cục bộ. Sử dụng Docker (grafana/k6)..." -ForegroundColor Cyan
    docker run --rm -i `
        --add-host=host.docker.internal:host-gateway `
        -v "${scriptDir}:/tests" `
        -e BASE_URL="$TargetUrl" `
        grafana/k6 run "/tests/$targetFile"
}
else {
    Write-Error "[ERROR] Không tìm thấy k6 CLI lẫn Docker trên hệ thống! Vui lòng cài đặt k6 (winget install k6) hoặc bật Docker Desktop."
}
