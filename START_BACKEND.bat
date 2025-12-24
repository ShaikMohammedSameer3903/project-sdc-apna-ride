@echo off
echo ========================================
echo Starting ApnaRide Backend Server
echo ========================================
cd "Back End"
call mvnw.cmd spring-boot:run
pause
