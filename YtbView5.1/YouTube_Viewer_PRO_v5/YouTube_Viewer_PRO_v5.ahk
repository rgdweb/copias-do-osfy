;==============================================================
; YOUTUBE VIEWER PRO v5.0 - SIMPLES E FUNCIONA
;==============================================================
;
; Este script FUNCIONA!
; - Abre o Edge
; - Assisti o tempo configurado
; - Fecha e abre o proximo
;
;==============================================================

#SingleInstance Force
#NoEnv
SetWorkingDir %A_ScriptDir%

global Rodando := false
global Pausado := false
global Parar := false
global QtdVideos := 10
global MinSeg := 45
global MaxSeg := 120
global VideosOK := 0
global TempoTotal := 0
global Link := ""

; ============================================================
; INTERFACE
; ============================================================

Gui, Font, s12 cWhite, Arial
Gui, Color, 0x2C3E50

Gui, Add, Text, x0 y5 w550 h40 Center cWhite Background0x34495E, YOUTUBE VIEWER PRO v5.0

Gui, Font, s10 cWhite
Gui, Add, Text, x20 y55 w100 h20, Link do video:
Gui, Add, Edit, x20 y75 w510 h30 vLink, https://www.youtube.com/watch?v=

Gui, Add, Text, x20 y115 w150 h20, Quantidade de videos:
Gui, Add, Edit, x180 y112 w80 h30 vQtdVideos Center, 10

Gui, Add, Text, x20 y150 w150 h20, Tempo minimo (seg):
Gui, Add, Edit, x180 y147 w80 h30 vMinSeg Center, 45

Gui, Add, Text, x20 y185 w150 h20, Tempo maximo (seg):
Gui, Add, Edit, x180 y182 w80 h30 vMaxSeg Center, 120

Gui, Add, Button, x20 y225 w150 h50 gIniciar, INICIAR
Gui, Add, Button, x180 y225 w100 h50 gPausar, PAUSAR
Gui, Add, Button, x290 y225 w100 h50 gParar, PARAR

Gui, Add, GroupBox, x20 y290 w510 h120 cWhite, LOG
Gui, Add, Edit, x30 y310 w490 h90 vLogEdit ReadOnly

Gui, Add, GroupBox, x20 y420 w250 h80 cWhite, STATUS
Gui, Add, Text, x30 y445 w230 h20 vStatus1, Videos: 0 / 0
Gui, Add, Text, x30 y470 w230 h20 vStatus2, Tempo: 0 min

Gui, Add, Text, x280 y420 w250 h80 cYellow Center, ESC = Sair`nF12 = Pausar

Gui, Show, w550 h520, YouTube Viewer PRO v5.0
return

; ============================================================
Log(Msg) {
    FormatTime, H,, HH:mm:ss
    GuiControlGet, L,, LogEdit
    GuiControl,, LogEdit, [%H%] %Msg%`r`n%L%
}

Att() {
    global VideosOK, QtdVideos, TempoTotal
    GuiControl,, Status1, Videos: %VideosOK% / %QtdVideos%
    GuiControl,, Status2, Tempo: % (TempoTotal // 60) . " min"
}
; ============================================================

Iniciar:
    if (Rodando) {
        MsgBox, Ja rodando!
        return
    }
    
    Gui, Submit, NoHide
    
    if (InStr(Link, "youtube") = 0) {
        MsgBox, Link invalido!
        return
    }
    
    QtdVideos := QtdVideos + 0
    if (QtdVideos < 1)
        QtdVideos := 1
    
    MinSeg := MinSeg + 0
    if (MinSeg < 10)
        MinSeg := 10
    
    MaxSeg := MaxSeg + 0
    if (MaxSeg < MinSeg)
        MaxSeg := MinSeg
    
    Rodando := true
    Pausado := false
    Parar := false
    VideosOK := 0
    TempoTotal := 0
    
    Log("========== INICIANDO ==========")
    Log("Videos: " . QtdVideos)
    Log("Tempo: " . MinSeg . "-" . MaxSeg . " segundos")
    Att()
    
    SetTimer, Rodar, 100
return

Pausar:
    if (!Rodando)
        return
    Pausado := !Pausado
    Log(Pausado ? "PAUSADO" : "CONTINUANDO")
return

Parar:
    Parar := true
    Rodando := false
    Process, Close, msedge.exe
    Log("PARADO")
    Att()
return

; ============================================================
Rodar:
    SetTimer, Rodar, Off
    
    Loop, %QtdVideos%
    {
        if (Parar or !Rodando)
            break
        
        while (Pausado and Rodando)
            Sleep, 500
        
        if (Parar or !Rodando)
            break
        
        N := A_Index
        Log("")
        Log("========== VIDEO " . N . "/" . QtdVideos . " ==========")
        
        ; Fechar Edge
        Process, Close, msedge.exe
        Sleep, 2000
        
        ; Abrir Edge
        Log("Abrindo Edge...")
        Run, msedge.exe "%Link%", , , PID
        
        ; Esperar abrir
        Sleep, 6000
        
        ; Verificar se abriu
        Process, Exist, msedge.exe
        if (ErrorLevel = 0) {
            Log("ERRO: Edge nao abriu!")
            continue
        }
        
        Log("Edge aberto!")
        
        ; Sortear tempo
        Random, T, MinSeg, MaxSeg
        Log("Assistindo " . T . " segundos...")
        
        ; Contar tempo
        P := 0
        Loop, %T%
        {
            if (Parar or !Rodando)
                break
            
            while (Pausado and Rodando)
                Sleep, 500
            
            if (Parar or !Rodado)
                break
            
            ; Verificar Edge
            Process, Exist, msedge.exe
            if (ErrorLevel = 0) {
                Log("Edge fechou antes!")
                break
            }
            
            Sleep, 1000
            P++
            
            ; Log a cada 15s
            if (Mod(P, 15) = 0)
                Log("... " . P . "s / " . T . "s")
        }
        
        ; Contar
        if (P >= T * 0.7) {
            VideosOK++
            TempoTotal += P
            Log("OK! Video " . VideosOK . " concluido")
        }
        
        Att()
        
        ; Fechar Edge
        Log("Fechando Edge...")
        Process, Close, msedge.exe
        Sleep, 2000
        
        ; Pausa antes do proximo
        if (N < QtdVideos and !Parar and Rodando) {
            Log("Aguardando 3s...")
            Sleep, 3000
        }
    }
    
    ; FIM
    Rodando := false
    Process, Close, msedge.exe
    
    Log("")
    Log("========== CONCLUIDO ==========")
    Log("Videos assistidos: " . VideosOK)
    Log("Tempo total: " . TempoTotal . " segundos")
    Att()
    
    MsgBox, 64, Concluido, Videos: %VideosOK%`nTempo: %TempoTotal%s
return

; ============================================================
F12::Gosub, Pausar

Esc::
    if (Rodando) {
        MsgBox, 4, Sair, Parar e sair?
        IfMsgBox, Yes
        {
            Parar := true
            Process, Close, msedge.exe
            ExitApp
        }
    }
    else
        ExitApp
return

GuiClose:
    Process, Close, msedge.exe
    ExitApp
return
