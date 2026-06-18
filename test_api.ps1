try {
    $apiKey = "AQ.Ab8RN6KFH8axdvRQQ0D9RSYAHu-f_EFbJrpWVXXb4ncEEDx5EA"
    $body = '{"contents":[{"parts":[{"text":"Hello"}]}]}'
    $headers = @{
        "Content-Type" = "application/json"
    }
    $r = Invoke-RestMethod -Uri "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$apiKey" -Method POST -Headers $headers -Body $body
    Write-Host "SUCCESS:" $r.candidates[0].content.parts[0].text
} catch {
    Write-Host "ERROR:" $_.Exception.Message
    $response = $_.Exception.Response
    if ($response) {
        $stream = $response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "RESPONSE BODY:" $reader.ReadToEnd()
    }
}



