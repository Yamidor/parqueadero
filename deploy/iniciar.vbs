' Ejecuta iniciar-parkpro.bat sin mostrar ventana de consola (modo oculto).
' Este es el archivo al que apunta el acceso directo "Iniciar ParkPro".
Set sh = CreateObject("WScript.Shell")
carpeta = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))
sh.CurrentDirectory = carpeta
sh.Run """" & carpeta & "iniciar-parkpro.bat""", 0, False
