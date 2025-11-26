# Azure Configuration
subscription_id = "76f23ab9-a09e-4fd8-a9ee-a42a64a347e4"
tenant_id       = "d23a4a26-74d7-4061-b5b7-a4bb30c01501"
resource_group_name = "ansible-template-rg"
location            = "eastus"

# ACR Configuration
acr_name = "ansibletemplateacr001"
acr_sku  = "Standard"

# AKS Configuration
aks_cluster_name            = "ansible-template-aks"
aks_dns_prefix              = "ansibletemplate"
kubernetes_version          = "1.28.3"
default_node_pool_name      = "systempool"
default_node_pool_vm_size   = "Standard_D2s_v3"
default_node_pool_count     = 2
default_node_pool_min_count = 1
default_node_pool_max_count = 3
enable_auto_scaling         = true

# Network Configuration
network_plugin = "azure"
network_policy = "azure"

# Monitoring
log_analytics_workspace_name = "ansible-template-logs"

# Service Mesh
enable_istio = true

# Tags
tags = {
  Environment = "Development"
  Project     = "AnsibleTemplateDownloader"
  ManagedBy   = "Terraform"
  Owner       = "gunampalli"
  CostCenter  = "Engineering"
}
