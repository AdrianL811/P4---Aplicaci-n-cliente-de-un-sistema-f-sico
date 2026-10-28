#!/usr/bin/env bash
# Instala la app en el emulador, la abre y guarda capturas y el log del sistema.
set +e
mkdir -p diag-out
adb shell getprop ro.product.cpu.abilist > diag-out/abis.txt 2>&1
adb logcat -c
adb install -r "${1:-android/app/build/outputs/apk/release/app-release.apk}" > diag-out/install.txt 2>&1
adb shell am start -W -n mx.ciberpunks.umbral/.MainActivity > diag-out/start.txt 2>&1
sleep 20
adb exec-out screencap -p > diag-out/pantalla-20s.png
sleep 25
adb exec-out screencap -p > diag-out/pantalla-45s.png
adb shell pidof mx.ciberpunks.umbral > diag-out/pid.txt 2>&1
adb shell dumpsys activity top | head -60 > diag-out/actividad.txt 2>&1
adb logcat -d -v time > diag-out/logcat-completo.txt 2>&1
grep -E "\[Umbral\]|ReactNativeJS|AndroidRuntime|FATAL|ReactNative|Hermes|CredencialHCE|SplashScreen|Expo|expo|umbral|SoLoader|libc" diag-out/logcat-completo.txt > diag-out/logcat-filtrado.txt
exit 0
