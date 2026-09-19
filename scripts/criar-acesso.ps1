param(
  [Parameter(Mandatory = $true)]
  [string]$Nome,

  [Parameter(Mandatory = $true)]
  [string]$Usuario,

  [Parameter(Mandatory = $true)]
  [string]$Senha,

  [Parameter(Mandatory = $true)]
  [ValidateSet("OWNER", "ADMIN_COMERCIAL", "ADMIN_MARKETING", "ADMIN_DESENVOLVIMENTO")]
  [string[]]$Perfil,

  [string]$Database = "bern-mkt-web",

  [switch]$Local
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $projectRoot
try {

function Escape-SqlString([string]$Value) {
  return $Value.Replace("'", "''")
}

$hash = node -e "const bcrypt=require('bcryptjs'); bcrypt.hash(process.argv[1],12).then(console.log)" $Senha

if ($LASTEXITCODE -ne 0 -or -not $hash) {
  throw "Nao foi possivel gerar o hash da senha. Rode npm install antes de executar este script."
}

$nomeSql = Escape-SqlString $Nome
$usuarioSql = Escape-SqlString $Usuario
$hashSql = Escape-SqlString $hash.Trim()
$Perfil = @($Perfil | Select-Object -Unique)
if ($Perfil -contains "OWNER") { $Perfil = @("OWNER") }
$perfilSql = Escape-SqlString $Perfil[0]

$sql = @"
INSERT INTO users (
  name,
  username,
  password_hash,
  role,
  status,
  must_change_password
) VALUES (
  '$nomeSql',
  '$usuarioSql',
  '$hashSql',
  '$perfilSql',
  'ATIVO',
  1
)
ON CONFLICT(username) DO UPDATE SET
  name = excluded.name,
  password_hash = excluded.password_hash,
  role = excluded.role,
  status = 'ATIVO',
  must_change_password = 1,
  updated_at = CURRENT_TIMESTAMP;
"@

$sql += "`nDELETE FROM user_roles WHERE user_id = (SELECT id FROM users WHERE username = '$usuarioSql');"
foreach ($role in $Perfil) {
    $roleSql = Escape-SqlString $role
    $sql += "`nINSERT INTO user_roles (user_id, role) SELECT id, '$roleSql' FROM users WHERE username = '$usuarioSql';"
}
$sql += "`nDELETE FROM sessions WHERE user_id = (SELECT id FROM users WHERE username = '$usuarioSql');"
$scope = if ($Local) { "--local" } else { "--remote" }
$sqlFile = Join-Path ([System.IO.Path]::GetTempPath()) ("bern-acesso-" + [guid]::NewGuid().ToString() + ".sql")
try {
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($sqlFile, $sql, $utf8)
    Write-Host "Criando/atualizando acesso '$Usuario'..."
    & node (Join-Path $projectRoot "node_modules/wrangler/bin/wrangler.js") d1 execute $Database $scope --file $sqlFile
    if ($LASTEXITCODE -ne 0) { throw "Falha ao salvar o acesso. Confira o erro acima." }
    Write-Host "Acesso salvo. No primeiro login, sera necessario trocar a senha."
}
finally {
    Remove-Item -LiteralPath $sqlFile -Force -ErrorAction SilentlyContinue
}
}
finally { Pop-Location }
