@echo off
cd /d "%~dp0"
where py >nul 2>nul
if not errorlevel 1 (
  py -3 server.py
) else (
  where python >nul 2>nul
  if not errorlevel 1 (
    python server.py
  ) else (
    if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" (
      "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" server.py
    ) else (
      echo Python 3.10 or later is required. Install your organization-approved Python runtime.
    )
  )
)
pause
