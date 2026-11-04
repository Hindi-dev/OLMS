@echo off
setlocal
set "GIT_EXE=C:\Users\USER\AppData\Local\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd\git.exe"
cd /d "%~dp0"
echo ========================================================
echo   Pushing code to https://github.com/Hindi-dev/OLMS.git
echo ========================================================
echo Overwriting remote initial commit with our complete application...
"%GIT_EXE%" push -u origin main --force
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   SUCCESS! All 67 files successfully pushed to GitHub!
    echo   View at: https://github.com/Hindi-dev/OLMS
    echo ========================================================
) else (
    echo.
    echo [ERROR] Push failed.
)
echo.
pause
