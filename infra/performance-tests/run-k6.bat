@echo off
set SCENARIO=%1
if "%SCENARIO%"=="" set SCENARIO=smoke

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-k6.ps1" -Scenario %SCENARIO%
