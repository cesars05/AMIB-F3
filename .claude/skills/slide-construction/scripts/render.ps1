# Render every slide of a .pptx to PNG with PowerPoint (Windows).
# Usage: powershell -ExecutionPolicy Bypass -File render.ps1 -Src deck.pptx -Out out_dir [-Width 1600]
param([Parameter(Mandatory=$true)][string]$Src, [Parameter(Mandatory=$true)][string]$Out, [int]$Width = 1600)
$Src = (Resolve-Path $Src).Path
New-Item -ItemType Directory -Force $Out | Out-Null
$Out = (Resolve-Path $Out).Path
$app = New-Object -ComObject PowerPoint.Application
$p = $app.Presentations.Open($Src, $true, $false, $false)
$h = [int]($Width * $p.PageSetup.SlideHeight / $p.PageSetup.SlideWidth)
$i = 0
foreach ($s in $p.Slides) { $i++; $s.Export((Join-Path $Out ("slide_{0:D2}.png" -f $i)), "PNG", $Width, $h) }
$p.Close()
Write-Output "$i slides -> $Out"
