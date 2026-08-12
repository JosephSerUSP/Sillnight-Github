param(
    [string]$Godot = ""
)

$ErrorActionPreference = "Stop"
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$repoRoot = [IO.Path]::GetFullPath((Join-Path $projectRoot "..\..\.."))

if ([string]::IsNullOrWhiteSpace($Godot)) {
    $command = Get-Command godot -ErrorAction SilentlyContinue
    if ($command) {
        $Godot = $command.Source
    } else {
        $Godot = Join-Path $repoRoot ".tools\godot\4.7.1\Godot_v4.7.1-stable_win64.exe"
    }
}

if (-not (Test-Path -LiteralPath $Godot)) {
    throw "Godot 4.7.1 was not found. Run .\tools\setup_godot.ps1 or pass -Godot <path>."
}

Write-Output "[1/3] GDScript parse checks"
$scripts = @(
    "domain/fixture_battle.gd",
    "presentation/main.gd",
    "presentation/main_ui.gd",
    "presentation/room.gd",
    "tools/verify.gd"
)
foreach ($script in $scripts) {
    & $Godot --headless --display-driver windows --rendering-method gl_compatibility --rendering-driver opengl3 --path $projectRoot --script "res://$script" --check-only
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Output "[2/3] Godot import/load check"
& $Godot --headless --display-driver windows --rendering-method gl_compatibility --rendering-driver opengl3 --path $projectRoot --editor --quit
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Output "[3/3] Fixture assertions and representative scene smoke test"
& $Godot --headless --display-driver windows --rendering-method gl_compatibility --rendering-driver opengl3 --path $projectRoot --script res://tools/verify.gd
exit $LASTEXITCODE
