Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceDir = Join-Path $root "source-images"
$outPng = Join-Path $root "scrollcat-giveaway-nft.png"
$outJson = Join-Path $root "scrollcat-giveaway-metadata.json"

$width = 2048
$height = 2048
$bitmap = New-Object System.Drawing.Bitmap $width, $height
$g = [System.Drawing.Graphics]::FromImage($bitmap)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

function New-RectF($x, $y, $w, $h) {
    return New-Object System.Drawing.RectangleF([single]$x, [single]$y, [single]$w, [single]$h)
}

function Draw-CenteredText($graphics, $text, $font, $brush, $rect) {
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $graphics.DrawString($text, $font, $brush, $rect, $format)
    $format.Dispose()
}

function Fill-RoundRect($graphics, $brush, $rect, $radius) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
    $path.AddArc($rect.Right - $d, $rect.Y, $d, $d, 270, 90)
    $path.AddArc($rect.Right - $d, $rect.Bottom - $d, $d, $d, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    $graphics.FillPath($brush, $path)
    $path.Dispose()
}

function Stroke-RoundRect($graphics, $pen, $rect, $radius) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
    $path.AddArc($rect.Right - $d, $rect.Y, $d, $d, 270, 90)
    $path.AddArc($rect.Right - $d, $rect.Bottom - $d, $d, $d, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    $graphics.DrawPath($pen, $path)
    $path.Dispose()
}

function Draw-Chip($graphics, $text, $x, $y, $w, $h) {
    $chipRect = New-RectF $x $y $w $h
    $bg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(190, 12, 10, 28))
    $outline = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(230, 255, 205, 73)), 4
    $font = New-Object System.Drawing.Font("Arial", 32, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 233, 148))
    Fill-RoundRect $graphics $bg $chipRect 28
    Stroke-RoundRect $graphics $outline $chipRect 28
    Draw-CenteredText $graphics $text $font $textBrush $chipRect
    $textBrush.Dispose(); $font.Dispose(); $outline.Dispose(); $bg.Dispose()
}

$bgRect = New-Object System.Drawing.Rectangle 0, 0, $width, $height
$bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush $bgRect, ([System.Drawing.Color]::FromArgb(255, 9, 5, 24)), ([System.Drawing.Color]::FromArgb(255, 36, 8, 55)), 55
$g.FillRectangle($bg, $bgRect)
$bg.Dispose()

$center = New-Object System.Drawing.Point 1024, 890
$radial = New-Object System.Drawing.Drawing2D.GraphicsPath
$radial.AddEllipse(126, 48, 1796, 1590)
$pathBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush $radial
$pathBrush.CenterPoint = $center
$pathBrush.CenterColor = [System.Drawing.Color]::FromArgb(210, 243, 74, 255)
$pathBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 4, 3, 18))
$g.FillPath($pathBrush, $radial)
$pathBrush.Dispose()
$radial.Dispose()

$rng = New-Object System.Random 1337
for ($i = 0; $i -lt 170; $i++) {
    $x = $rng.Next(80, 1968)
    $y = $rng.Next(80, 1800)
    $size = $rng.Next(3, 11)
    $alpha = $rng.Next(80, 220)
    $starBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($alpha, 79, 232, 255))
    $g.FillEllipse($starBrush, $x, $y, $size, $size)
    $starBrush.Dispose()
}

$goldPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(245, 255, 200, 66)), 14
$magentaPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(160, 255, 58, 223)), 7
$cyanPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(120, 62, 232, 255)), 6
for ($i = 0; $i -lt 9; $i++) {
    $pen = $(if ($i % 3 -eq 0) { $goldPen } elseif ($i % 3 -eq 1) { $magentaPen } else { $cyanPen })
    $offset = $i * 31
    $g.DrawBezier(
        $pen,
        [single](360 + $offset), [single](560 + ($i * 12)),
        [single](700 + $offset), [single](300 + ($i * 4)),
        [single](1260 + $offset), [single](330 + ($i * 15)),
        [single](1685 - ($i * 18)), [single](650 + ($i * 22))
    )
}
$goldPen.Dispose(); $magentaPen.Dispose(); $cyanPen.Dispose()

$catPath = Join-Path $sourceDir "infinitescroller.png"
$cat = [System.Drawing.Image]::FromFile($catPath)
$shadowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(150, 0, 0, 0))
$g.FillEllipse($shadowBrush, 438, 1498, 1172, 170)
$shadowBrush.Dispose()

$catDest = New-Object System.Drawing.Rectangle 350, 354, 1348, 1348
$g.DrawImage($cat, $catDest)
$cat.Dispose()

$frameOuter = New-RectF 92 92 1864 1864
$frameInner = New-RectF 136 136 1776 1776
$framePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(245, 255, 203, 62)), 18
$innerPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(170, 255, 64, 221)), 7
Stroke-RoundRect $g $framePen $frameOuter 72
Stroke-RoundRect $g $innerPen $frameInner 54
$framePen.Dispose(); $innerPen.Dispose()

$titleBg = New-Object System.Drawing.Drawing2D.LinearGradientBrush (New-Object System.Drawing.Rectangle 196, 1606, 1656, 244), ([System.Drawing.Color]::FromArgb(232, 10, 8, 26)), ([System.Drawing.Color]::FromArgb(222, 70, 17, 86)), 0
Fill-RoundRect $g $titleBg (New-RectF 196 1606 1656 244) 44
$titleBg.Dispose()
$titleStroke = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(240, 255, 206, 62)), 6
Stroke-RoundRect $g $titleStroke (New-RectF 196 1606 1656 244) 44
$titleStroke.Dispose()

$smallFont = New-Object System.Drawing.Font("Arial", 38, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleFont = New-Object System.Drawing.Font("Arial", 116, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$subFont = New-Object System.Drawing.Font("Arial", 34, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$goldBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 218, 83))
$whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 250, 247, 255))
$cyanBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 96, 243, 255))
$darkBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 18, 10, 31))

Draw-CenteredText $g "SCROLLCAT" $smallFont $cyanBrush (New-RectF 350 214 1348 56)
Draw-CenteredText $g "GIVEAWAY" $titleFont $goldBrush (New-RectF 250 1636 1548 122)
Draw-CenteredText $g "SCROLLKEEPER AIRDROP PASS" $subFont $whiteBrush (New-RectF 348 1764 1352 52)

Draw-Chip $g "MYTHIC-INSPIRED" 176 176 430 86
Draw-Chip $g "SUPRA" 1460 176 310 86
Draw-Chip $g "1/1 PROMO" 176 1842 330 78
Draw-Chip $g "THE SCROLL NEVER ENDS" 1226 1842 646 78

$badgeRect = New-RectF 788 118 472 86
$badgeFill = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(240, 255, 207, 58))
Fill-RoundRect $g $badgeFill $badgeRect 36
Draw-CenteredText $g "FREE MINT PRIZE" $smallFont $darkBrush $badgeRect
$badgeFill.Dispose()

$sparkPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(160, 255, 255, 220)), 8
$g.DrawLine($sparkPen, 472, 314, 472, 390)
$g.DrawLine($sparkPen, 434, 352, 510, 352)
$g.DrawLine($sparkPen, 1574, 358, 1574, 430)
$g.DrawLine($sparkPen, 1538, 394, 1610, 394)
$sparkPen.Dispose()

$bitmap.Save($outPng, [System.Drawing.Imaging.ImageFormat]::Png)

$metadata = [ordered]@{
    name = "ScrollCat Giveaway - ScrollKeeper Airdrop Pass"
    description = "A promotional ScrollCat NFT giveaway artwork inspired by The Infinite Scroller, built for the Supra community and the endless feed protectors."
    image = "scrollcat-giveaway-nft.png"
    external_url = "https://scrollcat.org"
    collection = "ScrollCat"
    token = '$SCAT'
    chain = "Supra Blockchain"
    attributes = @(
        [ordered]@{ trait_type = "Edition"; value = "Giveaway" },
        [ordered]@{ trait_type = "Rarity"; value = "Promo Mythic" },
        [ordered]@{ trait_type = "Base Inspiration"; value = "The Infinite Scroller" },
        [ordered]@{ trait_type = "Aura"; value = "Gold Cyber Halo" },
        [ordered]@{ trait_type = "Community Role"; value = "ScrollKeeper" },
        [ordered]@{ trait_type = "Utility"; value = "Airdrop Pass" }
    )
}

$metadata | ConvertTo-Json -Depth 6 | Set-Content -Path $outJson -Encoding UTF8

$g.Dispose()
$bitmap.Dispose()
