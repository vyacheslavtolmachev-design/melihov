#Requires -Version 5.1
$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$OutDir = $PSScriptRoot

$Chunk01 = @(
  'AGENTS.md','README.md','docker-compose.yml','.env.example',
  'wordpress/bootstrap.sh','wordpress/import-catalog.sh','wordpress/import-catalog.php','wordpress/catalog/README.md','wordpress/uploads.ini',
  'wordpress/wp-content/mu-plugins/heritage-content.php',
  'wordpress/wp-content/mu-plugins/heritage-fields.php'
)
$Chunk02 = @(
  'frontend/package.json','frontend/next.config.ts','frontend/tsconfig.json',
  'frontend/Dockerfile.dev','frontend/postcss.config.mjs',
  'frontend/app/globals.css','frontend/app/layout.tsx','frontend/app/page.tsx',
  'frontend/app/about/page.tsx','frontend/app/services/page.tsx','frontend/app/info/page.tsx',
  'frontend/app/catalog/page.tsx','frontend/app/catalog/[slug]/page.tsx',
  'frontend/app/api/revalidate/route.ts','frontend/lib/site.ts'
)
$Chunk03 = @(
  'frontend/lib/catalog.ts','frontend/lib/services.ts',
  'frontend/lib/wp/client.ts','frontend/lib/wp/media.ts','frontend/lib/wp/varieties.ts',
  'frontend/components/brand/GoldDefs.tsx','frontend/components/brand/Emblem.tsx',
  'frontend/components/brand/Wordmark.tsx'
)
$Chunk04 = @(
  'frontend/components/layout/Header.tsx','frontend/components/layout/Footer.tsx',
  'frontend/components/layout/PageHeader.tsx','frontend/components/layout/PagePlaceholder.tsx',
  'frontend/components/home/Hero.tsx','frontend/components/home/ValueProps.tsx',
  'frontend/components/home/Directions.tsx','frontend/components/home/CategoryGrid.tsx',
  'frontend/components/home/CtaRibbon.tsx','frontend/components/home/OrchardCanvas.tsx',
  'frontend/components/catalog/Filters.tsx','frontend/components/catalog/PriceSwitch.tsx',
  'frontend/components/catalog/VarietyCard.tsx','frontend/components/catalog/filter-url.ts',
  'frontend/components/ui/Reveal.tsx','frontend/components/providers/MotionProvider.tsx',
  'docs/GRAPHICS.md'
)
$AllFiles = $Chunk01 + $Chunk02 + $Chunk03 + $Chunk04

$GeminiPromptSection = @'

## Стартовый промпт для Gemini

```
Ты — senior frontend-разработчик. Перед тобой проект сайта питомника «Сады Наследия» (headless WordPress + Next.js).

Правила:
- Стиль «Тёмный престиж»: тёмно-зелёный фон, металлическое золото только градиентом (.gold-text, stroke="url(#goldStroke)")
- Шрифты: Playfair Display (заголовки) + Manrope (текст)
- Не выдумывай телефоны, адреса, цены — только то, что есть в коде
- Коммерция через заявку, без корзины и WooCommerce
- Tailwind v4: токены в globals.css через @theme, без tailwind.config.js
- Dev-сервер: next dev --webpack (не turbopack)

Следующая задача: [опишите здесь]
```
'@

function Get-LanguageTag {
  param([string]$RelativePath)
  switch -Regex ($RelativePath) {
    '\.tsx$' { return 'tsx' }
    '\.ts$'  { return 'typescript' }
    '\.jsx$' { return 'jsx' }
    '\.js$'  { return 'javascript' }
    '\.json$' { return 'json' }
    '\.ya?ml$' { return 'yaml' }
    '\.md$'  { return 'md' }
    '\.php$' { return 'php' }
    '\.sh$'  { return 'bash' }
    '\.css$' { return 'css' }
    '\.mjs$' { return 'javascript' }
    '\.ini$' { return 'ini' }
    default  { return '' }
  }
}

function Format-FileSection {
  param([string]$RelativePath)
  $fullPath = Join-Path $RepoRoot ($RelativePath -replace '/', [IO.Path]::DirectorySeparatorChar)
  $lang = Get-LanguageTag $RelativePath
  $sb = New-Object System.Text.StringBuilder
  [void]$sb.AppendLine('## ' + '`' + $RelativePath + '`')
  [void]$sb.AppendLine('```' + $lang)
  if (Test-Path -LiteralPath $fullPath) {
    $content = Get-Content -LiteralPath $fullPath -Raw -Encoding UTF8
    if ($null -eq $content) { $content = '' }
    $content = $content.TrimEnd([char]13, [char]10)
    [void]$sb.AppendLine($content)
  } else {
    [void]$sb.AppendLine("<!-- missing: $RelativePath -->")
  }
  [void]$sb.AppendLine('```')
  [void]$sb.AppendLine()
  [void]$sb.AppendLine('---')
  [void]$sb.AppendLine()
  return $sb.ToString()
}

function Build-ChunkMarkdown {
  param([string]$Title, [string[]]$Files)
  $sb = New-Object System.Text.StringBuilder
  [void]$sb.AppendLine("# $Title")
  [void]$sb.AppendLine()
  [void]$sb.AppendLine('---')
  [void]$sb.AppendLine()
  foreach ($rel in $Files) {
    [void]$sb.Append((Format-FileSection $rel))
  }
  return $sb.ToString().TrimEnd() + [Environment]::NewLine
}

function Build-OverviewMarkdown {
  param([string[]]$Files)
  $overviewPath = Join-Path $OutDir '00-OVERVIEW.md'
  if (-not (Test-Path -LiteralPath $overviewPath)) {
    throw 'Missing 00-OVERVIEW.md'
  }
  $existing = Get-Content -LiteralPath $overviewPath -Raw -Encoding UTF8
  if ($existing -notmatch ('(?s)^(.*?## .+?\r?\n' + '```' + '\r?\n)(.*?)(\r?\n' + '```' + ')')) {
    throw 'Cannot parse 00-OVERVIEW.md file list block'
  }
  $list = ($Files -join [Environment]::NewLine)
  return $Matches[1] + $list + [Environment]::NewLine + '```' + $GeminiPromptSection + [Environment]::NewLine
}

$utf8 = New-Object System.Text.UTF8Encoding $true
$overview = Build-OverviewMarkdown $AllFiles
[System.IO.File]::WriteAllText((Join-Path $OutDir '00-OVERVIEW.md'), $overview, $utf8)

$chunk01Md = Build-ChunkMarkdown '01-infra-wordpress.md' $Chunk01
$chunk02Md = Build-ChunkMarkdown '02-frontend-config-lib.md' $Chunk02
$chunk03Md = Build-ChunkMarkdown '03-frontend-pages.md' $Chunk03
$chunk04Md = Build-ChunkMarkdown '04-frontend-components.md' $Chunk04

[System.IO.File]::WriteAllText((Join-Path $OutDir '01-infra-wordpress.md'), $chunk01Md, $utf8)
[System.IO.File]::WriteAllText((Join-Path $OutDir '02-frontend-config-lib.md'), $chunk02Md, $utf8)
[System.IO.File]::WriteAllText((Join-Path $OutDir '03-frontend-pages.md'), $chunk03Md, $utf8)
[System.IO.File]::WriteAllText((Join-Path $OutDir '04-frontend-components.md'), $chunk04Md, $utf8)

$full = $overview.TrimEnd() + [Environment]::NewLine + [Environment]::NewLine
$full += $chunk01Md.TrimEnd() + [Environment]::NewLine + [Environment]::NewLine
$full += $chunk02Md.TrimEnd() + [Environment]::NewLine + [Environment]::NewLine
$full += $chunk03Md.TrimEnd() + [Environment]::NewLine + [Environment]::NewLine
$full += $chunk04Md.TrimEnd() + [Environment]::NewLine
[System.IO.File]::WriteAllText((Join-Path $OutDir 'FULL_EXPORT.md'), $full, $utf8)

Write-Host 'Gemini export written to' $OutDir
