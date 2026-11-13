param([string]$PgBin = 'C:\Program Files\PostgreSQL\12\bin')
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$demoRoot = (Get-Location).Path
$cluster = Join-Path $demoRoot '.tmp\pg-swagger-demo'
$configPath = Join-Path $demoRoot '.tmp\demo-config.json'
function Assert-Exit([string]$Step) {
    if ($LASTEXITCODE -ne 0) { throw "$Step failed (exit $LASTEXITCODE)" }
}
if (!(Test-Path (Join-Path $PgBin 'pg_ctl.exe'))) { throw "PostgreSQL binaries missing: $PgBin" }
New-Item -ItemType Directory -Force .tmp | Out-Null
if (!(Test-Path $configPath)) {
    if (Test-Path $cluster) { throw 'Existing cluster without demo-config.json; refusing to modify it.' }
    $config = [ordered]@{ host='127.0.0.1'; port=55439; user='foodbridge_demo'; password=[guid]::NewGuid().ToString('N'); database='foodbridge_swagger_demo' }
    $config | ConvertTo-Json | Set-Content -LiteralPath $configPath -Encoding UTF8
} else {
    $config = Get-Content -Raw -LiteralPath $configPath | ConvertFrom-Json
}
if ($config.host -ne '127.0.0.1' -or $config.port -ne 55439 -or $config.user -ne 'foodbridge_demo' -or $config.database -ne 'foodbridge_swagger_demo') {
    throw 'Refusing configuration outside the dedicated demo database.'
}
$newCluster = !(Test-Path (Join-Path $cluster 'PG_VERSION'))
if ($newCluster) {
    $passwordFile = Join-Path $demoRoot '.tmp\demo-pg-password'
    try {
        Set-Content -LiteralPath $passwordFile -Value $config.password -Encoding ascii
        & "$PgBin\initdb.exe" -D $cluster -U $config.user -A scram-sha-256 --encoding=UTF8 --pwfile=$passwordFile
        Assert-Exit 'initdb'
    } finally { Remove-Item -LiteralPath $passwordFile -ErrorAction SilentlyContinue }
}
& "$PgBin\pg_ctl.exe" -D $cluster status
if ($LASTEXITCODE -ne 0) {
    & "$PgBin\pg_ctl.exe" -D $cluster -l "$demoRoot\.tmp\pg-swagger-demo.log" -o '-h 127.0.0.1 -p 55439' -w start
    Assert-Exit 'pg_ctl start'
}
$previousPgPassword = $env:PGPASSWORD
try {
    $env:PGPASSWORD = $config.password
    & "$PgBin\pg_isready.exe" -h $config.host -p $config.port -U $config.user
    Assert-Exit 'pg_isready'
    $directory = & "$PgBin\psql.exe" -X -h $config.host -p $config.port -U $config.user -d postgres -Atc 'SHOW data_directory'
    Assert-Exit 'Verify cluster'
    if ([IO.Path]::GetFullPath($directory.Trim()) -ne [IO.Path]::GetFullPath($cluster)) { throw 'Unexpected PostgreSQL cluster; refusing changes.' }
    $exists = & "$PgBin\psql.exe" -X -h $config.host -p $config.port -U $config.user -d postgres -Atc "SELECT 1 FROM pg_database WHERE datname='foodbridge_swagger_demo'"
    Assert-Exit 'Check database'
    if ($exists -ne '1') {
        & "$PgBin\createdb.exe" -h $config.host -p $config.port -U $config.user $config.database
        Assert-Exit 'createdb'
    }
} finally { $env:PGPASSWORD = $previousPgPassword }
$env:POSTGRES_HOST = $config.host
$env:POSTGRES_PORT = [string]$config.port
$env:POSTGRES_USER = $config.user
$env:POSTGRES_PASSWORD = $config.password
$env:POSTGRES_DB = $config.database
$env:NODE_ENV = 'development'
$env:SWAGGER_ENABLED = 'true'
$env:PORT = '3000'
Write-Host 'Demo: http://localhost:3000/docs ; OpenAPI: http://localhost:3000/docs-json'
node dist/main.js
Assert-Exit 'NestJS'
