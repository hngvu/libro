<#
.SYNOPSIS
    Script nạp dữ liệu lớn (Mass Data Seeder) vào PostgreSQL cho hệ thống Libro.
.DESCRIPTION
    Tự động import seed-mass-data.sql vào container Docker libro-postgres hoặc PostgreSQL local.
#>

param (
    [string]$ContainerName = "libro-postgres",
    [string]$DbUser = "postgres",
    [string]$DbName = "libro"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sqlFile = Join-Path $scriptDir "seed-mass-data.sql"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " [LIBRO] BẮT ĐẦU SEED DỮ LIỆU LỚN VÀO POSTGRESQL" -ForegroundColor Green
Write-Host " Target Container: $ContainerName | DB: $DbName | User: $DbUser" -ForegroundColor Yellow
Write-Host " SQL File: $sqlFile" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Kiểm tra nếu container docker đang chạy
$containerRunning = docker ps --filter "name=$ContainerName" --format "{{.Names}}" 2>$null

if ($containerRunning -contains $ContainerName) {
    Write-Host "[INFO] Tìm thấy container $ContainerName đang chạy. Đang nạp dữ liệu..." -ForegroundColor Cyan
    Get-Content $sqlFile | docker exec -i $ContainerName psql -U $DbUser -d $DbName
    Write-Host "[SUCCESS] Nạp dữ liệu hoàn tất vào Docker container!" -ForegroundColor Green
}
elseif (Get-Command psql -ErrorAction SilentlyContinue) {
    Write-Host "[INFO] Sử dụng psql CLI cục bộ..." -ForegroundColor Cyan
    Get-Content $sqlFile | psql -U $DbUser -d $DbName -h localhost -p 5432
    Write-Host "[SUCCESS] Nạp dữ liệu hoàn tất qua psql!" -ForegroundColor Green
}
else {
    Write-Error "[ERROR] Không tìm thấy container '$ContainerName' hoặc công cụ psql cục bộ. Vui lòng đảm bảo docker-compose đã khởi động ('docker compose up -d')."
}
