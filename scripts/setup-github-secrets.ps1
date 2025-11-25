# GitHub Setup Script for Azure Deployment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GitHub Secrets Setup Helper" -ForegroundColor Cyan
Write-Host "Ansible Template Downloader" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if Azure CLI is installed
if (!(Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Azure CLI is not installed!" -ForegroundColor Red
    Write-Host "Install from: https://docs.microsoft.com/cli/azure/install-azure-cli" -ForegroundColor Yellow
    exit 1
}

# Variables
$subscriptionId = "6a205d28-34bf-4d6c-931a-dd4709183421"
$tenantId = "7dfe41e1-4343-4613-8d2a-3624ea7b067e"
$spName = "github-actions-ansible-template"

Write-Host "Step 1: Azure Login" -ForegroundColor Green
Write-Host "Logging into Azure...`n"
az login --tenant $tenantId

Write-Host "`nStep 2: Set Active Subscription" -ForegroundColor Green
az account set --subscription $subscriptionId
$currentSub = az account show --query name -o tsv
Write-Host "Active subscription: $currentSub`n" -ForegroundColor Yellow

Write-Host "Step 3: Create Service Principal" -ForegroundColor Green
Write-Host "Creating service principal for GitHub Actions...`n"

$spOutput = az ad sp create-for-rbac `
    --name $spName `
    --role contributor `
    --scopes "/subscriptions/$subscriptionId" `
    --sdk-auth `
    2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Service Principal created successfully!`n" -ForegroundColor Green
    
    # Parse the JSON output
    $spJson = $spOutput | ConvertFrom-Json
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "GitHub Secrets Configuration" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    Write-Host "Go to: https://github.com/gunampallir-cpu/ansible-template-sqlite/settings/secrets/actions" -ForegroundColor Yellow
    Write-Host "`nAdd the following secrets:`n" -ForegroundColor Yellow
    
    Write-Host "1. AZURE_CREDENTIALS" -ForegroundColor Cyan
    Write-Host "   Copy the entire JSON below:" -ForegroundColor White
    Write-Host "   ----------------------------------------"
    Write-Host $spOutput -ForegroundColor Gray
    Write-Host "   ----------------------------------------`n"
    
    Write-Host "2. ARM_CLIENT_ID" -ForegroundColor Cyan
    Write-Host "   Value: $($spJson.clientId)`n" -ForegroundColor White
    
    Write-Host "3. ARM_CLIENT_SECRET" -ForegroundColor Cyan
    Write-Host "   Value: $($spJson.clientSecret)`n" -ForegroundColor White
    
    Write-Host "4. AZURE_SUBSCRIPTION_ID" -ForegroundColor Cyan
    Write-Host "   Value: $subscriptionId`n" -ForegroundColor White
    
    Write-Host "5. AZURE_TENANT_ID" -ForegroundColor Cyan
    Write-Host "   Value: $tenantId`n" -ForegroundColor White
    
    Write-Host "6. SONAR_TOKEN (Optional)" -ForegroundColor Cyan
    Write-Host "   Get from: https://sonarcloud.io/account/security" -ForegroundColor White
    Write-Host "   Leave empty if not using SonarCloud`n"
    
    # Save to file
    $secretsFile = "github-secrets.txt"
    $spOutput | Out-File -FilePath $secretsFile -Encoding UTF8
    Write-Host "✓ Secrets saved to: $secretsFile" -ForegroundColor Green
    Write-Host "  (Keep this file secure and delete after setup!)`n" -ForegroundColor Yellow
    
} else {
    Write-Host "✗ Failed to create service principal" -ForegroundColor Red
    Write-Host "Error: $spOutput" -ForegroundColor Red
    exit 1
}

Write-Host "Step 4: Create Terraform Backend Storage" -ForegroundColor Green
Write-Host "Creating storage account for Terraform state...`n"

# Check if resource group exists
$rgExists = az group exists --name "terraform-state-rg"
if ($rgExists -eq "false") {
    Write-Host "Creating resource group..." -ForegroundColor Yellow
    az group create `
        --name "terraform-state-rg" `
        --location "eastus" `
        --output none
    Write-Host "✓ Resource group created" -ForegroundColor Green
} else {
    Write-Host "✓ Resource group already exists" -ForegroundColor Green
}

# Check if storage account exists
$saExists = az storage account check-name --name "tfstateansible001" --query "nameAvailable" -o tsv
if ($saExists -eq "true") {
    Write-Host "Creating storage account..." -ForegroundColor Yellow
    az storage account create `
        --name "tfstateansible001" `
        --resource-group "terraform-state-rg" `
        --location "eastus" `
        --sku "Standard_LRS" `
        --encryption-services blob `
        --output none
    Write-Host "✓ Storage account created" -ForegroundColor Green
} else {
    Write-Host "✓ Storage account already exists" -ForegroundColor Green
}

# Create container
Write-Host "Creating blob container..." -ForegroundColor Yellow
az storage container create `
    --name "tfstate" `
    --account-name "tfstateansible001" `
    --auth-mode login `
    --output none
Write-Host "✓ Blob container created`n" -ForegroundColor Green

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure GitHub secrets using the values above"
Write-Host "2. Review terraform/terraform.tfvars configuration"
Write-Host "3. Update helm chart values if needed"
Write-Host "4. Commit and push code to GitHub"
Write-Host "5. GitHub Actions will automatically deploy`n"

Write-Host "Useful Commands:" -ForegroundColor Yellow
Write-Host "  - View resources: az resource list --resource-group ansible-template-rg --output table"
Write-Host "  - Delete service principal: az ad sp delete --id `$spClientId"
Write-Host "  - View GitHub Actions: https://github.com/gunampallir-cpu/ansible-template-sqlite/actions`n"

Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  - Full guide: AZURE_DEPLOYMENT.md"
Write-Host "  - Terraform: terraform/README.md"
Write-Host "  - Helm charts: helm/README.md`n" -NoNewline
Write-Host ""

Write-Host "WARNING: Keep github-secrets.txt secure and delete after use!" -ForegroundColor Red

Read-Host "`nPress Enter to exit"
