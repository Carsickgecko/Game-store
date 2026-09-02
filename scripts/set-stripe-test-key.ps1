$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path $PSScriptRoot -Parent
$envPath = Join-Path $projectRoot 'server/.env'
$statusPath = Join-Path $projectRoot 'artifacts/stripe/key-entry-status.json'
$logPath = Join-Path $projectRoot 'artifacts/stripe/key-entry-error.log'
$node = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
if (!$node) { $node = Join-Path $env:ProgramFiles 'nodejs/node.exe' }
function Save-SetupStatus($status, $detail = '') {
  @{status=$status;detail=$detail;updatedAt=(Get-Date).ToUniversalTime().ToString('o')} | ConvertTo-Json | Set-Content -LiteralPath $statusPath -Encoding utf8
}
Save-SetupStatus 'waiting'
$form = New-Object System.Windows.Forms.Form
$form.Text = 'NeonPlay - Cau hinh Stripe TEST'
$form.ClientSize = New-Object System.Drawing.Size(680, 285)
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.TopMost = $true
$form.Font = New-Object System.Drawing.Font('Segoe UI', 10)
$label = New-Object System.Windows.Forms.Label
$label.Text = 'Dan khoa TEST (sk_test_ hoac rk_test_) tu Stripe Dashboard vao o ben duoi.'
$label.SetBounds(20,20,640,45)
$form.Controls.Add($label)
$link = New-Object System.Windows.Forms.LinkLabel
$link.Text = 'Mo Stripe Dashboard - Test API keys'
$link.SetBounds(20,65,620,25)
$link.Add_LinkClicked({ Start-Process 'https://dashboard.stripe.com/test/apikeys' })
$form.Controls.Add($link)
$inputBox = New-Object System.Windows.Forms.TextBox
$inputBox.UseSystemPasswordChar = $true
$inputBox.SetBounds(20,105,640,30)
$form.Controls.Add($inputBox)
$notice = New-Object System.Windows.Forms.Label
$notice.Text = 'Khoa chi luu trong server/.env tren may nay. Chi cau hinh thanh toan thu nghiem.'
$notice.SetBounds(20,145,640,55)
$form.Controls.Add($notice)
$saveButton = New-Object System.Windows.Forms.Button
$saveButton.Text = 'Luu va cau hinh'
$saveButton.SetBounds(350,220,165,38)
$form.Controls.Add($saveButton)
$cancelButton = New-Object System.Windows.Forms.Button
$cancelButton.Text = 'Huy'
$cancelButton.SetBounds(535,220,125,38)
$form.Controls.Add($cancelButton)
$cancelButton.Add_Click({ Save-SetupStatus 'canceled'; $form.Close() })
$saveButton.Add_Click({
  $secretKey = $inputBox.Text.Trim()
  if ($secretKey -cnotmatch '^(sk|rk)_test_[A-Za-z0-9]+$') {
    $notice.Text = 'Can khoa TEST hop le, bat dau bang sk_test_ hoac rk_test_.'
    $notice.ForeColor = [System.Drawing.Color]::Firebrick
    return
  }
  $saveButton.Enabled = $false
  $cancelButton.Enabled = $false
  $notice.Text = 'Dang luu khoa va tao webhook Stripe...'
  $notice.ForeColor = [System.Drawing.Color]::Black
  $form.Refresh()
  try {
    $content = [IO.File]::ReadAllText($envPath)
    if ($content -match '(?m)^STRIPE_SECRET_KEY=') {
      $content = [regex]::Replace($content, '(?m)^STRIPE_SECRET_KEY=[^\r\n]*', ('STRIPE_SECRET_KEY=' + $secretKey))
    } else { $content = $content.TrimEnd() + "`nSTRIPE_SECRET_KEY=$secretKey`n" }
    [IO.File]::WriteAllText($envPath, $content, (New-Object System.Text.UTF8Encoding $false))
    $secretKey = $null
    $inputBox.Clear()
    Save-SetupStatus 'configuring'
    $result = & $node (Join-Path $projectRoot 'server/scripts/configure-stripe-webhook.mjs') 2> $logPath
    if ($LASTEXITCODE -ne 0) { throw 'Stripe rejected the test key or webhook permissions.' }
    $configured = $result | ConvertFrom-Json
    if ($configured.status -ne 'configured') { throw 'Stripe configuration is incomplete.' }
    & (Join-Path $PSScriptRoot 'restart-hosting-backend.ps1')
    Save-SetupStatus 'configured' $configured.webhookId
    [System.Windows.Forms.MessageBox]::Show('Da cau hinh Stripe TEST va nap lai backend. Tro lai Codex de kiem tra thanh toan.', 'NeonPlay', 'OK', 'Information') | Out-Null
    $form.Close()
  } catch {
    Save-SetupStatus 'error' 'Stripe configuration failed; see the private setup log.'
    $notice.Text = 'Chua cau hinh duoc. Kiem tra khoa TEST va quyen webhook; Codex se kiem tra log.'
    $notice.ForeColor = [System.Drawing.Color]::Firebrick
    $saveButton.Enabled = $true
    $cancelButton.Enabled = $true
  }
})
$form.AcceptButton = $saveButton
$form.CancelButton = $cancelButton
[void]$form.ShowDialog()
$form.Dispose()
