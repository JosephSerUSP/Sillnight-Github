param(
    [string]$Godot = ""
)

$ErrorActionPreference = "Stop"
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
if ([string]::IsNullOrWhiteSpace($Godot)) {
    $command = Get-Command godot -ErrorAction SilentlyContinue
    if ($command) {
        $Godot = $command.Source
    } else {
        $repoRoot = [IO.Path]::GetFullPath((Join-Path $projectRoot "..\..\.."))
        $Godot = Join-Path $repoRoot ".tools\godot\4.7.1\Godot_v4.7.1-stable_win64.exe"
    }
}
if (-not (Test-Path -LiteralPath $Godot)) {
    throw "Godot 4.7.1 was not found. Run .\tools\setup_godot.ps1 or pass -Godot <path>."
}

foreach ($stage in @("initial", "formation", "summoner", "resolved")) {
    Write-Output "Capturing $stage"
    & $Godot --headless --display-driver windows --rendering-method gl_compatibility --rendering-driver opengl3 --path $projectRoot --quit-after 120 -- --stage=$stage --snapshot=$stage
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Output "Capturing room"
& $Godot --headless --display-driver windows --rendering-method gl_compatibility --rendering-driver opengl3 --path $projectRoot --quit-after 120 -- --stage=initial --snapshot=room --hide_ui=true
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
