# Solución para el error de Status Bar en iOS

## Error:
```
If you want to change appearance of status bar, you have to change UIViewControllerBasedStatusBarAppearance key in the Info.plist to Yes
```

## Solución aplicada:

Ya se agregó la configuración en `app.json`:
```json
"ios": {
  "infoPlist": {
    "UIViewControllerBasedStatusBarAppearance": true
  }
}
```

## Pasos para aplicar el fix:

### Opción 1: Rebuild completo (Recomendado para iOS físico)

1. **Detén Expo completamente:**
   ```bash
   # Presiona Ctrl+C en todas las terminales donde corre Expo
   ```

2. **Limpia la caché de Expo:**
   ```bash
   cd AAC/frontend
   npx expo start --clear
   ```

3. **Si usas Expo Go:**
   - Cierra completamente la app Expo Go en tu iPhone
   - Vuelve a abrirla y escanea el QR de nuevo

### Opción 2: Si el problema persiste

Si después de limpiar la caché sigue apareciendo el error, necesitas hacer un rebuild completo:

```bash
cd AAC/frontend

# Limpia node_modules y reinstala
rm -rf node_modules
npm install

# Limpia caché de Expo
npx expo start --clear
```

### Opción 3: Si usas desarrollo nativo (expo run:ios)

Si estás usando `expo run:ios` o desarrollo nativo, necesitas:

```bash
cd AAC/frontend
npx expo prebuild --clean
npx expo run:ios
```

## ¿Por qué aparece en iPhone pero no en emulador?

- El emulador de iOS puede tener configuraciones más permisivas
- iOS físico es más estricto con las configuraciones del Info.plist
- El Info.plist se genera durante el build, y puede que el emulador tenga una versión diferente

## Verificación:

Después de aplicar el fix, el error debería desaparecer. Si persiste, verifica que:

1. El `app.json` tenga la configuración correcta (ya está agregada)
2. Hayas hecho un rebuild completo
3. Hayas cerrado y vuelto a abrir Expo Go en tu iPhone
