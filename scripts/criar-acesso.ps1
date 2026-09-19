param(
  [Parameter(Mandatory = $true)]
  [string]$Nome,

  [Parameter(Mandatory = $true)]
  [string]$Usuario,

  [Parameter(Mandatory = $true)]
  [string]$Senha,

  [Parameter(Mandatory = $true)]
  [ValidateSet("OWNER", "ADMIN_COMERCIAL", "ADMIN_MARKETING", "ADMIN_DESENVOLVIMENTO")]
  [string]$Perfil,

  [string]$Database = "bern-mkt-web",

  [switch]$Local
)

$ErrorActionPreference = "Stop"

function Escape-SqlString([string]$Value) {
  return $Value.Replace("'", "''")
}

$hash = node -e "const bcrypt=require('bcryptjs'); bcrypt.hash(process.argv[1],12).then(console.log)" $Senha

if (-not $hash) {
  throw "Nao foi possivel gerar o hash da senha. Rode npm install antes de executar este script."
}

$nomeSql = Escape-SqlString $Nome
$usuarioSql = Escape-SqlString $Usuario
$hashSql = Escape-SqlString $hash.Trim()
$perfilSql = Escape-SqlString $Perfil

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

$scope = if ($Local) { "--local" } else { "--remote" }

Write-Host "Criando/atualizando acesso '$Usuario' como $Perfil no D1 '$Database'..."
npx wrangler d1 execute $Database $scope --command $sql
Write-Host "Acesso pronto. No primeiro login, o usuario sera obrigado a trocar a senha."
