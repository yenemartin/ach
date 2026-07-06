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
$region = if ($env:AWS_REGION) { $env:AWS_REGION } else { "us-west-2" }
$artifactBucket = if ($env:AFH_CARES_ARTIFACT_BUCKET) {
  $env:AFH_CARES_ARTIFACT_BUCKET
} else {
  "stackset-restaurant-order-pipelinebuiltartifactbuc-jzfkclmotkld"
}

$apiPath = Join-Path $repoRoot "apps\api"
$webPath = Join-Path $repoRoot "apps\web"
$tmpPath = Join-Path $repoRoot "tmp"
$apiWebDistPath = Join-Path $apiPath "web-dist"
$apiZipPath = Join-Path $tmpPath "afh-cares-api-$environmentName.zip"
$apiKey = "afh-cares/$environmentName/api.zip"
$roleName = "afh-cares-$environmentName-api-role"
$functionName = "afh-cares-$environmentName-api"
$homesTable = "afh-cares-$environmentName-homes"
$inquiriesTable = "afh-cares-$environmentName-inquiries"
$assumePolicyPath = Join-Path $repoRoot "scripts\aws\lambda-assume-role-policy.json"
$inlinePolicyPath = Join-Path $tmpPath "afh-cares-prod-readiness-api-policy.json"

if (-not (Test-Path $tmpPath)) {
  New-Item -ItemType Directory -Path $tmpPath | Out-Null
}

$inlinePolicy = @{
  Version = "2012-10-17"
  Statement = @(
    @{
      Effect = "Allow"
      Action = @(
        "dynamodb:BatchWriteItem",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Scan",
        "dynamodb:UpdateItem"
      )
      Resource = @(
        "arn:aws:dynamodb:${region}:*:table/$homesTable",
        "arn:aws:dynamodb:${region}:*:table/$inquiriesTable"
      )
    }
  )
} | ConvertTo-Json -Depth 6

Set-Content -LiteralPath $inlinePolicyPath -Value $inlinePolicy

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

aws iam get-role --role-name $roleName | Out-Null
if ($LASTEXITCODE -ne 0) {
  Invoke-External "aws iam create-role --role-name $roleName --assume-role-policy-document file://`"$assumePolicyPath`""
}

Invoke-External "aws iam attach-role-policy --role-name $roleName --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
Invoke-External "aws iam put-role-policy --role-name $roleName --policy-name afh-cares-prod-readiness-ddb --policy-document file://`"$inlinePolicyPath`""
Invoke-External "aws iam wait role-exists --role-name $roleName"

$caller = aws sts get-caller-identity | ConvertFrom-Json
$roleArn = "arn:aws:iam::$($caller.Account):role/$roleName"

aws dynamodb describe-table --table-name $homesTable | Out-Null
if ($LASTEXITCODE -ne 0) {
  Invoke-External "aws dynamodb create-table --table-name $homesTable --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --billing-mode PAY_PER_REQUEST"
}
Invoke-External "aws dynamodb wait table-exists --table-name $homesTable"

aws dynamodb describe-table --table-name $inquiriesTable | Out-Null
if ($LASTEXITCODE -ne 0) {
  Invoke-External "aws dynamodb create-table --table-name $inquiriesTable --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --billing-mode PAY_PER_REQUEST"
}
Invoke-External "aws dynamodb wait table-exists --table-name $inquiriesTable"

$createResult = aws lambda create-function `
  --function-name $functionName `
  --runtime nodejs20.x `
  --handler src/router.handler `
  --role $roleArn `
  --timeout 10 `
  --memory-size 256 `
  --code "S3Bucket=$artifactBucket,S3Key=$apiKey" `
  --environment "Variables={HOMES_TABLE=$homesTable,INQUIRIES_TABLE=$inquiriesTable}" 2>&1

if ($LASTEXITCODE -ne 0) {
  if ($createResult -match "ResourceConflictException") {
    Invoke-External "aws lambda update-function-code --function-name $functionName --s3-bucket $artifactBucket --s3-key $apiKey"
    Invoke-External "aws lambda update-function-configuration --function-name $functionName --runtime nodejs20.x --handler src/router.handler --role $roleArn --timeout 10 --memory-size 256 --environment `"Variables={HOMES_TABLE=$homesTable,INQUIRIES_TABLE=$inquiriesTable}`""
  } else {
    throw $createResult
  }
}

$urlCheck = aws lambda get-function-url-config --function-name $functionName 2>&1
if ($LASTEXITCODE -ne 0) {
  $createUrl = aws lambda create-function-url-config --function-name $functionName --auth-type NONE 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Manual prod-readiness backend resources were created, but a public Function URL could not be created."
    Write-Host "Function name: $functionName"
    Write-Host "Homes table: $homesTable"
    Write-Host "Inquiries table: $inquiriesTable"
    Write-Host ""
    Write-Host "Missing AWS permission:"
    Write-Host "  lambda:CreateFunctionUrlConfig"
    Write-Host ""
    Write-Host "AWS error:"
    Write-Host $createUrl
    exit 0
  }
}

$url = aws lambda get-function-url-config --function-name $functionName --query FunctionUrl --output text
Write-Host ""
Write-Host "Manual prod-readiness deployment complete."
Write-Host "Lambda URL: $url"
