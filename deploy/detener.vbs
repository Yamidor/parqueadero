' Ejecuta detener-parkpro.bat sin mostrar ventana de consola (modo oculto).
' Este es el archivo al que apunta el acceso directo "Detener ParkPro".
Set sh = CreateObject("WScript.Shell")
carpeta = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))
sh.CurrentDirectory = carpeta
sh.Run """" & carpeta & "detener-parkpro.bat""", 0, True
MsgBox "ParkPro se detuvo correctamente.", 64, "ParkPro"
