; ============================================================
;  ParkPro - Script de instalador (Inno Setup 6)
;  Empaqueta Node, MySQL y la aplicacion en un solo .exe.
;  El cliente solo hace doble clic para instalar.
;
;  Antes de compilar este script:
;   1. Copia el contenido preparado dentro de la carpeta "staging\"
;      (ver guia: deploy\COMO-CREAR-INSTALADOR.txt)
;   2. Abre este archivo con Inno Setup y presiona "Compile".
;   3. El instalador final queda en  deploy\salida\ParkPro-Setup.exe
; ============================================================

#define MyAppName "ParkPro"
#define MyAppVersion "1.0"
#define MyAppPublisher "ParkPro"
#define MyAppExeName "iniciar.vbs"

[Setup]
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
; Se instala en C:\ParkPro (raiz) para que MySQL pueda escribir su data sin lios de permisos
DefaultDirName={sd}\ParkPro
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=salida
OutputBaseFilename=ParkPro-Setup
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Files]
; Copia TODO el contenido de staging\ (app + node + mysql + scripts) a C:\ParkPro
Source: "staging\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs ignoreversion

[Icons]
; Accesos directos en el escritorio (lo que el cliente usa a diario)
Name: "{commondesktop}\Iniciar ParkPro"; Filename: "{sys}\wscript.exe"; Parameters: """{app}\iniciar.vbs"""; WorkingDir: "{app}"; IconFilename: "{app}\parkpro.ico"; Comment: "Iniciar el sistema ParkPro"
Name: "{commondesktop}\Detener ParkPro"; Filename: "{sys}\wscript.exe"; Parameters: """{app}\detener.vbs"""; WorkingDir: "{app}"; IconFilename: "{app}\parkpro.ico"; Comment: "Detener el sistema ParkPro"
Name: "{commondesktop}\Abrir ParkPro"; Filename: "https://localhost:3001"; Comment: "Abrir ParkPro en el navegador"
; Tambien en el menu inicio
Name: "{group}\Iniciar ParkPro"; Filename: "{sys}\wscript.exe"; Parameters: """{app}\iniciar.vbs"""; WorkingDir: "{app}"
Name: "{group}\Detener ParkPro"; Filename: "{sys}\wscript.exe"; Parameters: """{app}\detener.vbs"""; WorkingDir: "{app}"

[Run]
; Abrir el puerto 3001 en el Firewall de Windows para acceso desde la red
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall add rule name=""ParkPro 3001"" dir=in action=allow protocol=TCP localport=3001"; Flags: runhidden runascurrentuser
; Iniciar ParkPro al terminar de instalar (opcional, el usuario marca la casilla)
Filename: "{sys}\wscript.exe"; Parameters: """{app}\iniciar.vbs"""; Description: "Iniciar ParkPro ahora"; Flags: postinstall nowait skipifsilent

[UninstallRun]
; Al desinstalar, asegurar que todo este apagado y quitar la regla de firewall
Filename: "{sys}\wscript.exe"; Parameters: """{app}\detener.vbs"""; Flags: runhidden; RunOnceId: "DetenerParkPro"
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall delete rule name=""ParkPro 3001"""; Flags: runhidden; RunOnceId: "QuitarFirewall"
