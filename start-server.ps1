# Запуск локального прототипа ОБРАЗ
# Использование:  .\start-server.ps1            (порт 8123)
#                 .\start-server.ps1 -Port 9000

param([int]$Port = 8123)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$site = Join-Path $root 'site'

if (-not (Test-Path (Join-Path $site 'index.html'))) {
    Write-Error "Не найден site\index.html рядом со скриптом"
    exit 1
}

Write-Host "Сервер: http://127.0.0.1:$Port/" -ForegroundColor Green
Write-Host "Остановить: Ctrl+C" -ForegroundColor DarkGray

Start-Process "http://127.0.0.1:$Port/"
python -m http.server $Port --bind 127.0.0.1 --directory $site
