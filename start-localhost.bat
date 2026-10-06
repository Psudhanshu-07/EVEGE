@echo off
echo ========================================================
echo       Starting EVEGE College Event Manager
echo ========================================================

echo [1/3] Starting Dedicated PostgreSQL 18 on Port 5433...
start "" "C:\Program Files\PostgreSQL\18\bin\postgres.exe" -D "D:\Java\pgdata"
timeout /t 3 /nobreak >nul

echo [2/3] Starting Spring Boot Backend (Port 8082)...
start "EVEGE Backend (8082)" cmd /k "set JAVA_HOME=d:\Java\.verify\jdk-17.0.20.1+1&& d:\Java\.verify\apache-maven-3.9.6\bin\mvn.cmd -f d:\Java\backend\pom.xml spring-boot:run"
timeout /t 5 /nobreak >nul

echo [3/3] Starting Vite React Frontend (Port 5173)...
start "EVEGE Frontend (5173)" cmd /k "cd /d d:\Java\frontend && npm run dev"

echo.
echo Application started!
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:8082/api/events
echo PostgreSQL DB: localhost:5433 (Database: evege_db, User: postgres, Password: postgres)
echo.
echo Admin Login: demoadmin@gmail.com / 123321
echo Student Login: student@email.com / 123321
echo ========================================================
pause

