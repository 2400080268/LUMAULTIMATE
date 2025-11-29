$apiKey = "rnd_LmSvQEWxK7HqOiRfzGkQTq9cYAT4"
$uri = "https://api.render.com/v1/services"

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

$bodyObj = @{
    "name" = "luma-gallery"
    "type" = "web_service"
    "environmentId" = "oregon"
    "serviceDetails" = @{
        "repo" = "https://github.com/2400080268/LUMAULTIMATE"
        "branch" = "main"
        "buildCommand" = "npm install && npm run build"
        "startCommand" = "npm start"
    }
    "plan" = "free"
}

$body = $bodyObj | ConvertTo-Json -Depth 10

Write-Host "Creating Render Web Service..."
Write-Host "API Endpoint: $uri"
Write-Host "Repo: https://github.com/2400080268/LUMAULTIMATE"
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body $body
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "✅ Service created successfully!"
    Write-Host "Service ID: $($data.id)"
    Write-Host "Service Name: $($data.name)"
    Write-Host "Status: $($data.status)"
    Write-Host ""
    Write-Host "Your app will be live at: https://$($data.slug).onrender.com"
    Write-Host ""
    Write-Host "Build may take 2-5 minutes. Check progress at:"
    Write-Host "https://dashboard.render.com/services/$($data.id)"
} catch {
    Write-Host "❌ Error creating service"
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)"
    Write-Host "Error: $($_.Exception.Message)"
    
    if ($_.Exception.Response.StatusCode -eq "Unauthorized") {
        Write-Host ""
        Write-Host "API Key may be invalid or expired. Check your Render account."
    }
}
