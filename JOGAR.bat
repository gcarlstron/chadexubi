@echo off
rem Abre o jogo em tela cheia (modo kiosk). Para sair: Alt+F4
set "JOGO=%~dp0index.html"
set "PERFIL=%TEMP%\duas-torres-perfil"
set "FLAGS=--kiosk --autoplay-policy=no-user-gesture-required --user-data-dir="%PERFIL%" --no-first-run"

set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" (
  start "" "%CHROME%" %FLAGS% "file:///%JOGO%"
  exit /b
)

set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
start "" "%EDGE%" %FLAGS% "file:///%JOGO%"
