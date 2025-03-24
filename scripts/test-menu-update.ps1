# Test configuration
$baseUrl = "http://localhost:3000"
$menuId = 26

# Test data
$updateData = @{
    parent_menu_id = $null
    menu_name = "Test Menu Item"
    menu_url = "/menu"
    order_index = 1
} | ConvertTo-Json

function Test-MenuUpdate {
    param (
        [string]$menuId,
        [string]$body,
        [bool]$expectSuccess = $true
    )
    
    Write-Host "`n=== Testing Menu Update ===" -ForegroundColor Cyan
    Write-Host "URL: $baseUrl/menus?menu_id=eq.$menuId" -ForegroundColor Yellow
    Write-Host "Payload:" -ForegroundColor Yellow
    Write-Host $body -ForegroundColor Gray
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
            "Accept" = "application/json"
            "Prefer" = "return=representation" # Request the updated record in response
        }

        $response = Invoke-RestMethod `
            -Uri "$baseUrl/menus?menu_id=eq.$menuId" `
            -Method PATCH `
            -Headers $headers `
            -Body $body `
            -ErrorVariable restError

        if ($expectSuccess) {
            Write-Host "`nSuccess!" -ForegroundColor Green
            Write-Host "Response:" -ForegroundColor Yellow
            $response | ConvertTo-Json | Write-Host -ForegroundColor Gray
            return $true
        } else {
            Write-Host "`nWarning: Expected failure but got success" -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        if (-not $expectSuccess) {
            Write-Host "`nExpected failure occurred (This is good!)" -ForegroundColor Green
        } else {
            Write-Host "`nError occurred!" -ForegroundColor Red
        }
        
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        Write-Host "Status Description: $($_.Exception.Response.StatusDescription)" -ForegroundColor Red
        
        if ($restError) {
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $errorBody = $reader.ReadToEnd()
                Write-Host "Error Details: $errorBody" -ForegroundColor Red
            }
            catch {
                Write-Host "Could not read error details" -ForegroundColor Red
            }
        }
        
        return (-not $expectSuccess)
    }
}

function Test-MenuUpdateResult {
    param (
        [string]$menuId,
        [hashtable]$expectedData
    )
    
    Write-Host "`n=== Verifying Update ===" -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod `
            -Uri "$baseUrl/menus?menu_id=eq.$menuId" `
            -Method GET `
            -Headers @{"Accept" = "application/json"}

        Write-Host "`nVerification Success!" -ForegroundColor Green
        Write-Host "Current Menu Item State:" -ForegroundColor Yellow
        $response | ConvertTo-Json | Write-Host -ForegroundColor Gray

        # Verify each expected field
        $verified = $true
        foreach ($key in $expectedData.Keys) {
            if ($response.$key -ne $expectedData.$key) {
                Write-Host "Verification Failed: $key expected '$($expectedData.$key)' but got '$($response.$key)'" -ForegroundColor Red
                $verified = $false
            }
        }
        
        return $verified
    }
    catch {
        Write-Host "`nVerification Failed!" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        return $false
    }
}

# Run the tests
Write-Host "Starting Menu Update Tests..." -ForegroundColor Cyan

# Test 1: Valid Update
Write-Host "`nTest 1: Valid Update" -ForegroundColor Magenta
$expectedData = @{
    menu_name = "Test Menu Item"
    menu_url = "/test-menu"
    order_index = 1
    parent_menu_id = $null
}
$success = Test-MenuUpdate -menuId $menuId -body $updateData -expectSuccess $true
if ($success) {
    Test-MenuUpdateResult -menuId $menuId -expectedData $expectedData
}

# Test 2: Invalid Menu ID
Write-Host "`nTest 2: Invalid Menu ID" -ForegroundColor Magenta
$invalidMenuId = 999999
Test-MenuUpdate -menuId $invalidMenuId -body $updateData -expectSuccess $false

# Test 3: Invalid Data Format
Write-Host "`nTest 3: Invalid Data Format" -ForegroundColor Magenta
$invalidData = "{ invalid json }"
Test-MenuUpdate -menuId $menuId -body $invalidData -expectSuccess $false

# Test 4: Missing Required Fields
Write-Host "`nTest 4: Missing Required Fields" -ForegroundColor Magenta
$invalidData = @{
    menu_name = $null
} | ConvertTo-Json
Test-MenuUpdate -menuId $menuId -body $invalidData -expectSuccess $false

Write-Host "`nTests Completed!" -ForegroundColor Cyan



