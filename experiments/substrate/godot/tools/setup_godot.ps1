param(
    [string]$Version = "4.7.1",
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$repoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\..\..\.."))
$toolRoot = Join-Path $repoRoot ".tools\godot\$Version"
$archivePath = Join-Path $toolRoot "godot-$Version-win64.zip"
$godotPath = Join-Path $toolRoot "Godot_v$Version-stable_win64.exe"
$downloadUrl = "https://github.com/godotengine/godot-builds/releases/download/$Version-stable/Godot_v$Version-stable_win64.exe.zip"

if ((Test-Path -LiteralPath $godotPath) -and -not $Force) {
    Write-Output "Godot already set up: $godotPath"
    exit 0
}

New-Item -ItemType Directory -Force -Path $toolRoot | Out-Null
Write-Output "Downloading official Godot $Version stable build..."
Invoke-WebRequest -Uri $downloadUrl -OutFile $archivePath
Expand-Archive -LiteralPath $archivePath -DestinationPath $toolRoot -Force
Remove-Item -LiteralPath $archivePath -Force

if (-not (Test-Path -LiteralPath $godotPath)) {
    throw "Godot download did not contain the expected executable: $godotPath"
}
Write-Output "Godot ready: $godotPath"
