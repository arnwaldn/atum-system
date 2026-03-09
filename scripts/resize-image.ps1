# resize-image.ps1 — Resize image to max dimension, preserving aspect ratio
# Usage: powershell -NoProfile -File resize-image.ps1 -Path "image.png" -MaxDim 1800
# Returns: "RESIZED:WxH" if resized, "OK:WxH" if already fine, "SKIP:reason" if skipped

param(
    [Parameter(Mandatory=$true)][string]$Path,
    [int]$MaxDim = 1800
)

try {
    if (-not (Test-Path $Path)) {
        Write-Output "SKIP:not_found"
        exit 0
    }

    Add-Type -AssemblyName System.Drawing

    # Retry if file is locked (ADB might still be writing)
    $img = $null
    for ($i = 0; $i -lt 3; $i++) {
        try {
            $img = [System.Drawing.Image]::FromFile((Resolve-Path $Path).Path)
            break
        } catch {
            if ($i -lt 2) { Start-Sleep -Milliseconds 500 }
        }
    }

    if (-not $img) {
        Write-Output "SKIP:locked"
        exit 0
    }

    $w = $img.Width
    $h = $img.Height

    if ($w -le $MaxDim -and $h -le $MaxDim) {
        $img.Dispose()
        Write-Output "OK:${w}x${h}"
        exit 0
    }

    # Calculate new dimensions
    $ratio = [Math]::Min($MaxDim / $w, $MaxDim / $h)
    $newW = [int]($w * $ratio)
    $newH = [int]($h * $ratio)

    # Resize with high quality
    $bmp = New-Object System.Drawing.Bitmap($newW, $newH)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.DrawImage($img, 0, 0, $newW, $newH)
    $g.Dispose()
    $img.Dispose()

    # Save (determine format from extension)
    $ext = [System.IO.Path]::GetExtension($Path).ToLower()
    switch ($ext) {
        ".jpg"  { $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Jpeg) }
        ".jpeg" { $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Jpeg) }
        ".gif"  { $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Gif) }
        ".bmp"  { $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Bmp) }
        default { $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png) }
    }
    $bmp.Dispose()

    Write-Output "RESIZED:${w}x${h}->${newW}x${newH}"
} catch {
    Write-Output "SKIP:error_$($_.Exception.Message.Substring(0, [Math]::Min(50, $_.Exception.Message.Length)))"
    exit 0
}
