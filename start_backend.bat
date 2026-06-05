@echo off
title Afterglow Register Backend
cd /d %~dp0
npm install
npm run seed
npm run dev
pause
