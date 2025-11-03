@echo off
echo Iniciando servidor otimizado...
set NODE_OPTIONS=--max-old-space-size=4096
set EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
npx expo start --clear --no-dev --minify --max-workers 2
pause
