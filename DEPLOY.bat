@echo off
REM ApnaRide - Quick Deployment Script for Windows
REM This script helps you deploy the application using Docker

echo ========================================
echo   ApnaRide - Deployment Script
echo ========================================
echo.

:menu
echo Please select an option:
echo.
echo 1. Start Application (Development)
echo 2. Start Application (Production)
echo 3. Stop Application
echo 4. View Logs
echo 5. Rebuild and Restart
echo 6. Clean and Reset (WARNING: Deletes all data)
echo 7. Check Health Status
echo 8. Backup Database
echo 9. Exit
echo.
set /p choice="Enter your choice (1-9): "

if "%choice%"=="1" goto dev
if "%choice%"=="2" goto prod
if "%choice%"=="3" goto stop
if "%choice%"=="4" goto logs
if "%choice%"=="5" goto rebuild
if "%choice%"=="6" goto clean
if "%choice%"=="7" goto health
if "%choice%"=="8" goto backup
if "%choice%"=="9" goto end

echo Invalid choice. Please try again.
goto menu

:dev
echo.
echo Starting ApnaRide in Development mode...
docker-compose up -d
echo.
echo Application started!
echo Frontend: http://localhost:80
echo Backend: http://localhost:9031
echo Health: http://localhost:9031/actuator/health
echo.
pause
goto menu

:prod
echo.
echo Starting ApnaRide in Production mode...
docker-compose -f docker-compose.prod.yml up -d
echo.
echo Application started in production mode!
echo.
pause
goto menu

:stop
echo.
echo Stopping ApnaRide...
docker-compose down
echo.
echo Application stopped!
echo.
pause
goto menu

:logs
echo.
echo Viewing logs (Press Ctrl+C to exit)...
docker-compose logs -f
goto menu

:rebuild
echo.
echo Rebuilding and restarting ApnaRide...
docker-compose down
docker-compose build --no-cache
docker-compose up -d
echo.
echo Application rebuilt and restarted!
echo.
pause
goto menu

:clean
echo.
echo WARNING: This will delete all data including database!
set /p confirm="Are you sure? (yes/no): "
if /i "%confirm%"=="yes" (
    echo Cleaning up...
    docker-compose down -v
    docker system prune -f
    echo.
    echo Cleanup complete!
) else (
    echo Cleanup cancelled.
)
echo.
pause
goto menu

:health
echo.
echo Checking application health...
echo.
echo Backend Health:
curl -s http://localhost:9031/actuator/health
echo.
echo.
echo Frontend Health:
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:80
echo.
echo Container Status:
docker-compose ps
echo.
pause
goto menu

:backup
echo.
echo Creating database backup...
set timestamp=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set timestamp=%timestamp: =0%
docker exec apnaride-mysql mysqldump -u root -pshaik apnaride > backup_%timestamp%.sql
echo.
echo Backup created: backup_%timestamp%.sql
echo.
pause
goto menu

:end
echo.
echo Thank you for using ApnaRide!
echo.
exit
