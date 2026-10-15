# Render every slide of every think-cell library .potx to PNG (one folder per file).
# Usage: powershell -ExecutionPolicy Bypass -File render_library.ps1 -Out <dir> [-Root "C:\Program Files (x86)\think-cell\templates"] [-Width 900]
param([Parameter(Mandatory=$true)][string]$Out,
      [string]$Root = "C:\Program Files (x86)\think-cell\templates",
      [int]$Width = 900)
New-Item -ItemType Directory -Force $Out | Out-Null
$app = New-Object -ComObject PowerPoint.Application
Get-ChildItem $Root -Recurse -Filter *.potx | ForEach-Object {
    $rel = $_.FullName.Substring($Root.Length + 1)
    $key = ($rel -replace '\.potx$', '') -replace '[\\,]', '_' -replace '\s+', ''
    $dir = Join-Path $Out $key
    New-Item -ItemType Directory -Force $dir | Out-Null
    try {
        $p = $app.Presentations.Open($_.FullName, $true, $false, $false)
        $h = [int]($Width * $p.PageSetup.SlideHeight / $p.PageSetup.SlideWidth)
        $i = 0
        foreach ($s in $p.Slides) { $i++; $s.Export((Join-Path $dir ("slide_{0:D2}.png" -f $i)), "PNG", $Width, $h) }
        Write-Output "$i`t$key"
        try { $p.Close() } catch { }
    } catch { Write-Output "FAIL`t$key`t$($_.Exception.Message)" }
}
