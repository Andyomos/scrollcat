Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$imgDir = Join-Path (Split-Path -Parent $root) "img"

function New-RectF($x, $y, $w, $h) {
    return New-Object System.Drawing.RectangleF([single]$x, [single]$y, [single]$w, [single]$h)
}

function Fill-RoundRect($g, $brush, $rect, $radius) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
    $path.AddArc($rect.Right - $d, $rect.Y, $d, $d, 270, 90)
    $path.AddArc($rect.Right - $d, $rect.Bottom - $d, $d, $d, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    $g.FillPath($brush, $path)
    $path.Dispose()
}

function Stroke-RoundRect($g, $pen, $rect, $radius) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
    $path.AddArc($rect.Right - $d, $rect.Y, $d, $d, 270, 90)
    $path.AddArc($rect.Right - $d, $rect.Bottom - $d, $d, $d, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    $g.DrawPath($pen, $path)
    $path.Dispose()
}

function Draw-Centered($g, $text, $font, $brush, $rect) {
    $fmt = New-Object System.Drawing.StringFormat
    $fmt.Alignment = [System.Drawing.StringAlignment]::Center
    $fmt.LineAlignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString($text, $font, $brush, $rect, $fmt)
    $fmt.Dispose()
}

function Wrap-Text($g, $text, $font, $maxWidth) {
    $words = $text -split ' '
    $lines = New-Object System.Collections.Generic.List[string]
    $line = ""
    foreach ($word in $words) {
        $candidate = if ($line.Length -eq 0) { $word } else { "$line $word" }
        if ($g.MeasureString($candidate, $font).Width -le $maxWidth -or $line.Length -eq 0) {
            $line = $candidate
        } else {
            $lines.Add($line)
            $line = $word
        }
    }
    if ($line.Length -gt 0) { $lines.Add($line) }
    return $lines
}

function Draw-Wrapped($g, $text, $font, $brush, $rect, $lineHeight) {
    $lines = Wrap-Text $g $text $font $rect.Width
    $fmt = New-Object System.Drawing.StringFormat
    $fmt.Alignment = [System.Drawing.StringAlignment]::Near
    $fmt.LineAlignment = [System.Drawing.StringAlignment]::Near
    $y = $rect.Y
    foreach ($line in $lines) {
        $g.DrawString($line, $font, $brush, (New-RectF $rect.X $y $rect.Width $lineHeight), $fmt)
        $y += $lineHeight
    }
    $fmt.Dispose()
}

function Draw-CoverImage($g, $imagePath, $dest) {
    $img = [System.Drawing.Image]::FromFile($imagePath)
    $srcRatio = $img.Width / $img.Height
    $dstRatio = $dest.Width / $dest.Height
    if ($srcRatio -gt $dstRatio) {
        $srcH = $img.Height
        $srcW = [int]($srcH * $dstRatio)
        $srcX = [int](($img.Width - $srcW) / 2)
        $srcY = 0
    } else {
        $srcW = $img.Width
        $srcH = [int]($srcW / $dstRatio)
        $srcX = 0
        $srcY = [int](($img.Height - $srcH) / 2)
    }
    $src = New-Object System.Drawing.Rectangle $srcX, $srcY, $srcW, $srcH
    $g.DrawImage($img, $dest, $src, [System.Drawing.GraphicsUnit]::Pixel)
    $img.Dispose()
}

function Draw-Poster($width, $height, $imageName, $title, $subtitle, $badge, $outfile) {
    $bmp = New-Object System.Drawing.Bitmap $width, $height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    $bg = New-Object System.Drawing.Rectangle 0, 0, $width, $height
    Draw-CoverImage $g (Join-Path $imgDir $imageName) $bg

    $overlay = New-Object System.Drawing.Drawing2D.LinearGradientBrush $bg, ([System.Drawing.Color]::FromArgb(210, 8, 5, 20)), ([System.Drawing.Color]::FromArgb(95, 160, 25, 255)), 35
    $g.FillRectangle($overlay, $bg)
    $overlay.Dispose()

    $bottom = New-Object System.Drawing.Drawing2D.LinearGradientBrush $bg, ([System.Drawing.Color]::FromArgb(0, 0, 0, 0)), ([System.Drawing.Color]::FromArgb(235, 5, 4, 14)), 90
    $g.FillRectangle($bottom, $bg)
    $bottom.Dispose()

    $cyan = [System.Drawing.Color]::FromArgb(255, 48, 242, 255)
    $pink = [System.Drawing.Color]::FromArgb(255, 255, 56, 224)
    $gold = [System.Drawing.Color]::FromArgb(255, 255, 203, 54)
    $white = [System.Drawing.Color]::White
    $dark = [System.Drawing.Color]::FromArgb(255, 8, 6, 22)

    $linePen = New-Object System.Drawing.Pen $cyan, ([single]($height * 0.008))
    $linePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $linePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($linePen, [int]($width * 0.08), [int]($height * 0.10), [int]($width * 0.58), [int]($height * 0.10))
    $linePen.Color = $pink
    $g.DrawLine($linePen, [int]($width * 0.42), [int]($height * 0.14), [int]($width * 0.92), [int]($height * 0.14))
    $linePen.Dispose()

    $badgeFont = New-Object System.Drawing.Font("Arial", [single]($height * 0.030), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $badgeRect = New-RectF ([int]($width * 0.08)) ([int]($height * 0.19)) ([int]($width * 0.42)) ([int]($height * 0.075))
    $badgeBrush = New-Object System.Drawing.SolidBrush $gold
    Fill-RoundRect $g $badgeBrush $badgeRect ([int]($height * 0.020))
    Draw-Centered $g $badge $badgeFont (New-Object System.Drawing.SolidBrush $dark) $badgeRect
    $badgeBrush.Dispose()

    $panelRect = New-RectF ([int]($width * 0.06)) ([int]($height * 0.58)) ([int]($width * 0.88)) ([int]($height * 0.33))
    $panelBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(218, 8, 6, 23))
    Fill-RoundRect $g $panelBrush $panelRect ([int]($height * 0.030))
    $panelBrush.Dispose()
    $panelPen = New-Object System.Drawing.Pen $cyan, ([single]($height * 0.004))
    Stroke-RoundRect $g $panelPen $panelRect ([int]($height * 0.030))
    $panelPen.Dispose()

    $titleSize = if ($height -gt $width) { 84 } elseif ($width -gt 1300) { 78 } else { 62 }
    $subSize = if ($height -gt $width) { 37 } elseif ($width -gt 1300) { 32 } else { 27 }
    $titleFont = New-Object System.Drawing.Font("Arial", [single]$titleSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $subFont = New-Object System.Drawing.Font("Arial", [single]$subSize, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
    $urlFont = New-Object System.Drawing.Font("Arial", [single]($height * 0.031), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $brandFont = New-Object System.Drawing.Font("Arial", [single]($height * 0.027), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

    $whiteBrush = New-Object System.Drawing.SolidBrush $white
    $cyanBrush = New-Object System.Drawing.SolidBrush $cyan
    $goldBrush = New-Object System.Drawing.SolidBrush $gold

    Draw-Wrapped $g $title $titleFont $whiteBrush (New-RectF ([int]($width * 0.10)) ([int]($height * 0.615)) ([int]($width * 0.80)) ([int]($height * 0.16))) ([int]($titleSize * 1.05))
    Draw-Wrapped $g $subtitle $subFont $cyanBrush (New-RectF ([int]($width * 0.10)) ([int]($height * 0.775)) ([int]($width * 0.76)) ([int]($height * 0.09))) ([int]($subSize * 1.20))

    Draw-Centered $g 'SCROLLCAT  |  $SCAT' $brandFont $goldBrush (New-RectF ([int]($width * 0.57)) ([int]($height * 0.19)) ([int]($width * 0.35)) ([int]($height * 0.06)))
    Draw-Centered $g "scrollcat.org" $urlFont $whiteBrush (New-RectF ([int]($width * 0.58)) ([int]($height * 0.865)) ([int]($width * 0.30)) ([int]($height * 0.05)))

    $whiteBrush.Dispose(); $cyanBrush.Dispose(); $goldBrush.Dispose()
    $badgeFont.Dispose(); $titleFont.Dispose(); $subFont.Dispose(); $urlFont.Dispose(); $brandFont.Dispose()

    $bmp.Save($outfile, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

$items = @(
    @{ platform="x"; size=@(1600,900); file="x-week01-day01.png"; img="image.jpg"; badge="MULTI-CHAIN SWAP"; title="The cat checks the route."; subtitle="0.05% fee. LI.FI-powered. Built for degens." },
    @{ platform="x"; size=@(1600,900); file="x-week01-day02.png"; img="image (1).jpg"; badge="LOW FEE"; title="Stop overpaying to move tokens."; subtitle="Use ScrollCat before the next chain hop." },
    @{ platform="x"; size=@(1600,900); file="x-week01-day05.png"; img="image (2).jpg"; badge="CULTURE + UTILITY"; title="NFTs for culture. Swap for utility."; subtitle="The Meme Protector of the Feed has a job." },
    @{ platform="x"; size=@(1600,900); file="x-week02-day01.png"; img="image (3).jpg"; badge="ROUTES MATTER"; title="A swap is more than a button."; subtitle="DEXes, bridges, output, fee. Check the route." },
    @{ platform="x"; size=@(1600,900); file="x-week02-day03.png"; img="image (4).jpg"; badge="LI.FI POWERED"; title="One cat. Many chains."; subtitle="Route finding across 30+ DEXes and bridges." },
    @{ platform="x"; size=@(1600,900); file="x-week03-day01.png"; img="image (5).jpg"; badge="SCROLLKEEPERS"; title="Use it. Share it. Build the den."; subtitle="Real usage grows the community." },
    @{ platform="x"; size=@(1600,900); file="x-week03-day02.png"; img="image (6).jpg"; badge="SUPRA BORN"; title="Culture plus utility."; subtitle='$SCAT, NFTs, and multi-chain swap energy.' },
    @{ platform="x"; size=@(1600,900); file="x-week03-day05.png"; img="image (7).jpg"; badge="TRY THE SWAP"; title="If you can swap through ScrollCat, do it."; subtitle="That is how the den grows." },
    @{ platform="x"; size=@(1600,900); file="x-week04-day01.png"; img="image.jpg"; badge="WHY SCROLLCAT"; title="Low fee. Clean routes. Real community."; subtitle="Utility gets the visit. Culture gets the return." },
    @{ platform="x"; size=@(1600,900); file="x-week04-day03.png"; img="image (1).jpg"; badge="ACTION"; title="Do one useful thing today."; subtitle="Open ScrollCat and check a route." },

    @{ platform="instagram"; size=@(1080,1350); file="ig-week01-post01.png"; img="image.jpg"; badge="LAUNCH"; title="The cat is live."; subtitle='NFT culture. $SCAT den. Multi-chain swap.' },
    @{ platform="instagram"; size=@(1080,1350); file="ig-week01-post02.png"; img="image (1).jpg"; badge="SWAP"; title="The feed is endless. Your swap flow should not be."; subtitle="0.05% fee. LI.FI-powered routes." },
    @{ platform="instagram"; size=@(1080,1350); file="ig-week01-post03.png"; img="image (2).jpg"; badge="RARITY"; title="Which rarity are you hunting?"; subtitle="Common to Mythic. The den is watching." },
    @{ platform="instagram"; size=@(1080,1350); file="ig-week02-post01.png"; img="image (3).jpg"; badge="LOW FEE"; title="Fees are quiet until they are not."; subtitle="ScrollCat keeps it simple: 0.05%." },
    @{ platform="instagram"; size=@(1080,1350); file="ig-week02-post02.png"; img="image (4).jpg"; badge="ROUTE"; title="A swap route is more than a button."; subtitle="Check the path before the chain hop." },
    @{ platform="instagram"; size=@(1080,1350); file="ig-week02-post03.png"; img="image (5).jpg"; badge="DEN"; title="Join the ScrollKeepers."; subtitle="Read the fee. Respect the meme." },
    @{ platform="instagram"; size=@(1080,1350); file="ig-week03-post01.png"; img="image (6).jpg"; badge="UTILITY"; title="Memes get attention. Utility earns return visits."; subtitle="ScrollCat is building both." },
    @{ platform="instagram"; size=@(1080,1350); file="ig-week03-post02.png"; img="image (7).jpg"; badge="CHAIN PAIR"; title="What is your most common chain move?"; subtitle="Drop the route. Let the cat check it." },
    @{ platform="instagram"; size=@(1080,1350); file="ig-week03-post03.png"; img="image.jpg"; badge="NFT + SWAP"; title="Cats for collectors. Swap for users."; subtitle="Discover, join, use, return." },
    @{ platform="instagram"; size=@(1080,1350); file="ig-week04-post01.png"; img="image (1).jpg"; badge="CTA"; title="Open ScrollCat. Check a route."; subtitle="Do one useful thing today." },
    @{ platform="instagram"; size=@(1080,1350); file="ig-week04-post02.png"; img="image (2).jpg"; badge="FEEDBACK"; title="The best growth is usage."; subtitle="Use it. Test it. Tell us what to improve." },
    @{ platform="instagram"; size=@(1080,1350); file="ig-week04-post03.png"; img="image (3).jpg"; badge="MISSION"; title="Turn attention into action."; subtitle="NFTs bring eyes. Swap brings return visits." },

    @{ platform="telegram"; size=@(1080,1080); file="tg-week01-post01.png"; img="image (4).jpg"; badge="DEN CALL"; title="Use ScrollCat, not just the feed."; subtitle="Drop the chain you swap from most." },
    @{ platform="telegram"; size=@(1080,1080); file="tg-week02-post01.png"; img="image (5).jpg"; badge="ROUTE REMINDER"; title="A swap is not just token A to B."; subtitle="DEX choice, bridge path, fee, output." },
    @{ platform="telegram"; size=@(1080,1080); file="tg-week03-post01.png"; img="image (6).jpg"; badge="CULTURE + UTILITY"; title="NFTs bring culture. Swap brings use."; subtitle="The strongest community uses both." },
    @{ platform="telegram"; size=@(1080,1080); file="tg-week04-post01.png"; img="image (7).jpg"; badge="USAGE WEEK"; title="Use it. Report back."; subtitle="The den helps steer the cat." }
)

foreach ($item in $items) {
    $outDir = Join-Path $root "$($item.platform)\posters"
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
    $outfile = Join-Path $outDir $item.file
    Draw-Poster $item.size[0] $item.size[1] $item.img $item.title $item.subtitle $item.badge $outfile
}

Write-Output "Generated ScrollCat social posters in $root"
