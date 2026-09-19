@echo off
setlocal
cd /d "%~dp0"
echo BERN CRM - Atualizacao v0.2.2
where node >nul 2>nul
if errorlevel 1 goto erro
call npm.cmd ci
if errorlevel 1 goto erro
call npm.cmd run build
if errorlevel 1 goto erro
node node_modules\wrangler\bin\wrangler.js login
if errorlevel 1 goto erro
node scripts\atualizar-banco.mjs
if errorlevel 1 goto erro
echo Banco pronto. Deseja publicar esta versao do CRM?
choice /C SN /N /M "S para publicar / N para sair: "
if errorlevel 2 goto fim
call npm.cmd run deploy
if errorlevel 1 goto erro
echo Atualizacao publicada. Abra o portal e entre novamente.
goto fim
:erro
echo.
echo A ATUALIZACAO PAROU COM ERRO. Envie o texto acima para suporte.
echo Nao apague o banco nem recrie seus usuarios.
:fim
pause
endlocal
