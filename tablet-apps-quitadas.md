# Apps quitadas de la tablet (25/10/2026)

Lenovo TB-X505F, Android 10. Se quitaron solo para el usuario 0 con
`adb shell pm uninstall -k --user 0 <paquete>`; siguen en el sistema.

| App | Paquete |
|---|---|
| YouTube Music | com.google.android.apps.youtube.music |
| Play Películas | com.google.android.videos |
| Duo / Meet | com.google.android.apps.tachyon |
| Bienestar digital | com.google.android.apps.wellbeing |
| Skype | com.skype.raider |
| Bing Wallpapers | com.microsoft.bing.wallpapers |
| Lenovo Tips | com.tblenovo.lenovotips |
| Novedades de Lenovo | com.tblenovo.whatsnewclient |
| Smart IoT | com.tblenovo.smartiot |
| Modo demo | com.motorola.demo |
| Radio FM | com.caf.fmradio |
| Huevo de pascua | com.android.egg |
| Protector "Marco de fotos" | com.android.dreams.phototable |
| Modo niños | com.android.wantjoin.childmode.ctrl |
| Google (búsqueda / Asistente) | com.google.android.googlequicksearchbox |
| Modo niños (ícono del menú) | com.android.wantjoin.settings |
| Lenovo Tab M10 (guía del equipo) | com.lenovo.tab_m10_hd |
| Dolby Atmos (app de ajustes; el servicio de audio sigue) | com.dolby.daxappui |
| Google Calendar | com.google.android.calendar |
| Contactos | com.android.contacts |

## Recuperar una app

Con la tablet conectada y la depuración USB activa:

```bash
C:\Users\yamil\android-tools\platform-tools\adb.exe shell cmd package install-existing <paquete>
```

Un restablecimiento de fábrica también las devuelve todas.
