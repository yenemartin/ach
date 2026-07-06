$ErrorActionPreference = "Stop"

function Invoke-External {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Command
  )

  Invoke-Expression $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed: $Command"
  }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$environmentName = "prod-readiness"
$stackName = "afh-cares-$environmentName"
$templatePath = Join-Path $repoRoot "infra\cloudformation\prod-readiness.yml"
$apiPath = Join-Path $repoRoot "apps\api"
$webPath = Join-Path $repoRoot "apps\web"
$tmpPath = Join-Path $repoRoot "tmp"
$apiWebDistPath = Join-Path $apiPath "web-dist"
$apiZipPath = Join-Path $tmpPath "afh-cares-api-$environmentName.zip"
$artifactBucket = if ($env:AFH_CARES_ARTIFACT_BUCKET) {
  $env:AFH_CARES_ARTIFACT_BUCKET
} else {
  "stackset-restaurant-order-pipelinebuiltartifactbuc-jzfkclmotkld"
}
$apiKey = "afh-cares/$environmentName/api.zip"

if (-not (Test-Path $tmpPath)) {
  New-Item -ItemType Directory -Path $tmpPath | Out-Null
}

Push-Location $webPath
Invoke-External "npm install"
Invoke-External "npm run build"
Pop-Location

if (Test-Path $apiZipPath) {
  Remove-Item -LiteralPath $apiZipPath -Force
}

if (Test-Path $apiWebDistPath) {
  Remove-Item -LiteralPath $apiWebDistPath -Recurse -Force
}

Copy-Item -Path (Join-Path $webPath "dist") -Destination $apiWebDistPath -Recurse

Push-Location $apiPath
Invoke-External "npm install"
Compress-Archive -Path package.json,package-lock.json,src,node_modules,web-dist -DestinationPath $apiZipPath
Pop-Location

Invoke-External "aws s3 cp `"$apiZipPath`" `"s3://$artifactBucket/$apiKey`""

$stackExists = $true
try {
  $stack = aws cloudformation describe-stacks --stack-name $stackName | ConvertFrom-Json
} catch {
  $stackExists = $false
}

if ($stackExists -and $stack.Stacks[0].StackStatus -eq "ROLLBACK_COMPLETE") {
  Invoke-External "aws cloudformation delete-stack --stack-name $stackName"
  Invoke-External "aws cloudformation wait stack-delete-complete --stack-name $stackName"
}

Invoke-External @"
aws cloudformation deploy --stack-name $stackName --template-file `"$templatePath`" --capabilities CAPABILITY_NAMED_IAM --parameter-overrides EnvironmentName=$environmentName ApiCodeBucketName=$artifactBucket ApiCodeObjectKey=$apiKey
"@

$stack = aws cloudformation describe-stacks --stack-name $stackName | ConvertFrom-Json
$outputs = @{}
foreach ($output in $stack.Stacks[0].Outputs) {
  $outputs[$output.OutputKey] = $output.OutputValue
}

$distributionId = $outputs["FrontendDistributionId"]
$distributionDomain = $outputs["FrontendDistributionDomainName"]

Invoke-External "aws cloudfront create-invalidation --distribution-id $distributionId --paths `"/*`""

Write-Host ""
Write-Host "Deployment complete."
Write-Host "Environment: $environmentName"
Write-Host "CloudFront: https://$distributionDomain"
