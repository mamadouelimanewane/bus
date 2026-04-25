#!/bin/bash
echo "=== SunuBus v5.0 APK Builder ==="
npm install
npm run build
npx cap sync android
cd android
chmod +x gradlew
./gradlew assembleDebug --no-daemon
APK="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK" ]; then
    cp "$APK" ../sunubus-v5.0.apk
    echo "✅ APK généré: sunubus-v5.0.apk ($(du -sh ../sunubus-v5.0.apk | cut -f1))"
else
    echo "❌ Build échoué. Installez Android Studio."
fi
cd ..
