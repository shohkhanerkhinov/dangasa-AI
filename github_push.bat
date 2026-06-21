@echo off
echo ===================================================
echo   DangasaAI - GitHubga yuklash yordamchisi (Helper)
echo ===================================================
echo.
echo Iltimos, GitHub da yangi repository yarating.
echo Keyin, yaralgan repository havolasini (linkini) kiriting.
echo Masalan: https://github.com/username/dangasa-ai.git
echo.
set /p repo_url="GitHub Repository URL: "

if "%repo_url%"=="" (
    echo Xatolik: Havola kiritilmadi!
    pause
    exit /b
)

echo.
echo GitHub repository bog'lanmoqda...
git remote remove origin >nul 2>&1
git remote add origin %repo_url%
git branch -M main

echo.
echo Kodlar GitHub'ga yuklanmoqda...
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo Yuklashda xatolik yuz berdi! Iltimos, quyidagilarni tekshiring:
    echo 1. Kiritilgan havola to'g'riligi.
    echo 2. GitHub tizimiga terminal orqali kirganligingiz (git login).
    echo.
) else (
    echo.
    echo Muvaffaqiyatli yuklandi!
    echo.
)

pause
