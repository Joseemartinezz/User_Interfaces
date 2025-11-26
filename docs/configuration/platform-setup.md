# Platform Setup Guide

This guide covers platform-specific setup and configuration for running the AAC app on different platforms.

## Prerequisites

Before setting up for a specific platform, ensure you have:

1. ✅ Installed all dependencies: `npm run install:all`
2. ✅ Configured environment variables (see [env-config.md](./env-config.md))
3. ✅ Backend server is running: `npm run server`

## Web Platform

### Setup

1. **Configure Environment:**
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:3000
   ```

2. **Start Development Server:**
   ```bash
   npm run frontend:web
   # or
   cd frontend && npm run web
   ```

3. **Access:**
   - App will open automatically in your default browser
   - Usually at `http://localhost:8081` or similar

### Notes

- ✅ Easiest platform for development
- ✅ Fast refresh and hot reload
- ✅ No emulator/simulator needed
- ⚠️ Some native features may not work (camera, file system, etc.)

### Troubleshooting

**Port conflict:**
- Change port: `expo start --web --port 8082`

**CORS issues:**
- Ensure backend CORS is configured correctly
- Check backend is running on correct port

## iOS Simulator (macOS only)

### Prerequisites

- macOS with Xcode installed
- Xcode Command Line Tools
- iOS Simulator (comes with Xcode)

### Setup

1. **Configure Environment:**
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:3000
   ```

2. **Start Development Server:**
   ```bash
   npm start
   # Then press 'i' to open iOS simulator
   ```

   Or directly:
   ```bash
   npm run frontend:ios
   ```

3. **Access:**
   - Simulator will open automatically
   - App will load in the simulator

### Notes

- ✅ Best for testing iOS-specific features
- ✅ Native iOS behavior
- ⚠️ Requires macOS and Xcode
- ⚠️ Simulator may be slower than physical device

### Troubleshooting

**Simulator not opening:**
- Install Xcode from App Store
- Run: `xcode-select --install`
- Check Xcode is properly configured

**Build errors:**
- Clean build: `cd ios && xcodebuild clean`
- Reinstall pods: `cd ios && pod install`

## Android Emulator

### Prerequisites

- Android Studio installed
- Android SDK configured
- Android Virtual Device (AVD) created

### Setup

1. **Configure Environment:**
   ```env
   EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
   ```

   **Important:** Android emulator uses `10.0.2.2` instead of `localhost`!

2. **Start Android Emulator:**
   - Open Android Studio
   - Open AVD Manager
   - Start an emulator

3. **Start Development Server:**
   ```bash
   npm start
   # Then press 'a' to open Android emulator
   ```

   Or directly:
   ```bash
   npm run frontend:android
   ```

4. **Access:**
   - Emulator will open automatically
   - App will load in the emulator

### Notes

- ✅ Best for testing Android-specific features
- ✅ Native Android behavior
- ⚠️ Requires Android Studio and SDK
- ⚠️ Emulator can be resource-intensive

### Troubleshooting

**Emulator not connecting:**
- Verify emulator is running
- Check `EXPO_PUBLIC_API_URL` is set to `http://10.0.2.2:3000`
- Restart emulator and development server

**ADB errors:**
- Check Android SDK path is correct
- Verify `adb` is in PATH: `adb devices`

**Slow performance:**
- Increase emulator RAM allocation
- Use x86/x86_64 system images
- Enable hardware acceleration

## Physical Device (iOS)

### Prerequisites

- iOS device (iPhone/iPad)
- macOS with Xcode (for building)
- Apple Developer account (for device testing)

### Setup

1. **Find Your Computer's IP:**
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "
   
   # Windows
   ipconfig
   ```
   Look for IP like `192.168.1.100`

2. **Configure Environment:**
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
   ```
   Replace with your actual IP address.

3. **Ensure Same Network:**
   - Device and computer must be on same Wi-Fi network
   - Check firewall allows connections on port 3000

4. **Start Development Server:**
   ```bash
   npm start
   ```

5. **Connect Device:**
   - Scan QR code with Camera app (iOS 11+)
   - Or use Expo Go app to scan QR code
   - App will load on device

### Notes

- ✅ Real device testing
- ✅ Best performance
- ✅ Test actual touch interactions
- ⚠️ Requires same network
- ⚠️ IP address may change

### Troubleshooting

**Cannot connect:**
- Verify both devices on same network
- Check firewall settings
- Try disabling VPN
- Verify IP address is correct

**QR code not working:**
- Use Expo Go app instead
- Check network connectivity
- Try tunnel mode: `expo start --tunnel`

**Build errors:**
- Check Xcode is properly configured
- Verify Apple Developer account
- Check device is trusted

## Physical Device (Android)

### Prerequisites

- Android device
- USB debugging enabled
- Developer options enabled

### Setup

1. **Enable Developer Options:**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Developer options will appear

2. **Enable USB Debugging:**
   - Go to Settings → Developer Options
   - Enable "USB Debugging"

3. **Find Your Computer's IP:**
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "
   
   # Windows
   ipconfig
   ```
   Look for IP like `192.168.1.100`

4. **Configure Environment:**
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
   ```
   Replace with your actual IP address.

5. **Connect Device:**
   - Connect via USB
   - Or ensure same Wi-Fi network

6. **Start Development Server:**
   ```bash
   npm start
   ```

7. **Load App:**
   - Scan QR code with Expo Go app
   - Or use `adb` to forward port

### Notes

- ✅ Real device testing
- ✅ Best performance
- ✅ Test actual touch interactions
- ⚠️ Requires USB or same network
- ⚠️ IP address may change

### Troubleshooting

**USB not recognized:**
- Install device drivers
- Check USB cable
- Verify USB debugging is enabled

**Cannot connect via Wi-Fi:**
- Verify same network
- Check firewall settings
- Try USB connection instead

## Quick Reference

### Environment URLs by Platform

| Platform | EXPO_PUBLIC_API_URL |
|----------|---------------------|
| Web | `http://localhost:3000` |
| iOS Simulator | `http://localhost:3000` |
| Android Emulator | `http://10.0.2.2:3000` |
| Physical Device | `http://YOUR_IP:3000` |

### Commands by Platform

| Platform | Command |
|----------|---------|
| Web | `npm run frontend:web` |
| iOS | `npm run frontend:ios` |
| Android | `npm run frontend:android` |
| All | `npm start` (then choose) |

## Network Configuration

### Firewall Settings

**Windows:**
- Allow Node.js through firewall
- Allow port 3000 for incoming connections

**macOS:**
- System Preferences → Security → Firewall
- Allow Node.js connections

**Linux:**
- Configure iptables/ufw
- Allow port 3000: `sudo ufw allow 3000`

### Port Forwarding (Android USB)

If using USB connection on Android:

```bash
adb reverse tcp:3000 tcp:3000
```

Then use `http://localhost:3000` in your `.env`.

## Development Tips

1. **Use Web for Quick Testing:**
   - Fastest development cycle
   - Easy debugging
   - No emulator overhead

2. **Test on Real Devices:**
   - Before important demos
   - For performance testing
   - For native feature testing

3. **Keep Backend Running:**
   - Always have backend server running
   - Use `npm run server:dev` for auto-reload

4. **Monitor Network:**
   - Check backend logs
   - Use browser DevTools
   - Monitor API calls

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Platform-Specific Code](https://reactnative.dev/docs/platform-specific-code)
- [Android Studio Setup](https://developer.android.com/studio)
- [Xcode Setup](https://developer.apple.com/xcode/)

