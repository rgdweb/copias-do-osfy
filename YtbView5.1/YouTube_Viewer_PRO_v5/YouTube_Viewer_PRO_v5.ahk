;==============================================================
; YOUTUBE VIEWER PRO v5.1 - COM PROXY FUNCIONANDO
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
global UsarProxy := true
global TrocarCada := 3

global Proxies := []
global QtdProxies := 0
global ProxyIdx := 0
global PastaExt := ""

; ============================================================
Gui, Font, s11 cWhite, Arial
Gui, Color, 0x1a1a2e

Gui, Add, Text, x0 y5 w600 h35 Center cCyan Background0x16213e, YOUTUBE VIEWER PRO v5.1

Gui, Font, s10 cWhite
Gui, Add, GroupBox, x15 y45 w570 h70 cCyan, Video
Gui, Add, Text, x25 y65 w60 h20, Link:
Gui, Add, Edit, x25 y85 w550 h25 vLink, https://www.youtube.com/watch?v=

Gui, Add, GroupBox, x15 y120 w280 h150 cCyan, Configuracoes
Gui, Add, Text, x25 y145 w120 h20, Quantidade:
Gui, Add, Edit, x150 y142 w60 h25 vQtdVideos Center, 10

Gui, Add, Text, x25 y175 w120 h20, Tempo min (seg):
Gui, Add, Edit, x150 y172 w60 h25 vMinSeg Center, 45

Gui, Add, Text, x25 y205 w120 h20, Tempo max (seg):
Gui, Add, Edit, x150 y202 w60 h25 vMaxSeg Center, 120

Gui, Add, Text, x25 y235 w120 h20, Trocar proxy:
Gui, Add, Edit, x150 y232 w60 h25 vTrocarCada Center, 3
Gui, Add, Text, x215 y235 w60 h20, videos

Gui, Add, GroupBox, x305 y120 w280 h150 cCyan, Proxy
Gui, Add, Text, x315 y145 w100 h20, Proxies:
Gui, Add, Text, x420 y145 w80 h20 vStatusProxies cLime, 0

Gui, Add, Text, x315 y175 w100 h20, Atual:
Gui, Add, Text, x315 y195 w260 h20 vProxyInfo cYellow, Nenhum

Gui, Add, Button, x315 y225 w120 h30 gCarregarProxies, Carregar
Gui, Add, Button, x445 y225 w120 h30 gTestar, Testar

Gui, Add, CheckBox, x315 y260 w260 h20 vUsarProxy Checked, Usar proxies

Gui, Add, Button, x15 y280 w130 h45 gIniciar Background0x27ae60, INICIAR
Gui, Add, Button, x155 y280 w90 h45 gPausar Background0xf39c12, PAUSAR
Gui, Add, Button, x255 y280 w90 h45 gParar Background0xe74c3c, PARAR

Gui, Add, GroupBox, x15 y335 w380 h120 cCyan, Log
Gui, Add, Edit, x25 y355 w360 h90 vLogEdit ReadOnly

Gui, Add, GroupBox, x405 y335 w180 h120 cCyan, Status
Gui, Add, Text, x415 y355 w160 h20, Videos:
Gui, Add, Text, x415 y375 w160 h25 vStatusVids cLime, 0 / 0
Gui, Add, Text, x415 y405 w160 h20, Tempo:
Gui, Add, Text, x415 y425 w160 h25 vStatusTempo cLime, 0 min

Gui, Show, w600 h470, YouTube Viewer PRO v5.1

PastaExt := A_ScriptDir . "\ext_proxy"
if !FileExist(PastaExt)
    FileCreateDir, %PastaExt%

CarregarProxies()
return

; ============================================================
Log(M) {
    FormatTime, H,, HH:mm:ss
    GuiControlGet, L,, LogEdit
    GuiControl,, LogEdit, [%H%] %M%`r`n%L%
}

Att() {
    global VideosOK, QtdVideos, TempoTotal
    GuiControl,, StatusVids, %VideosOK% / %QtdVideos%
    GuiControl,, StatusTempo, % (TempoTotal // 60) . " min"
}
; ============================================================

CarregarProxies() {
    global
    File := A_ScriptDir . "\proxy.txt"
    if !FileExist(File) {
        Log("proxy.txt nao encontrado")
        return
    }
    Proxies := []
    QtdProxies := 0
    Loop, Read, %File%
    {
        L := Trim(A_LoopReadLine)
        if (L = "")
            continue
        P := StrSplit(L, ":")
        if (P.Length() >= 4) {
            Proxies.Push({IP:P[1], Port:P[2], User:P[3], Pass:P[4]})
            QtdProxies++
        }
    }
    if (QtdProxies > 0) {
        GuiControl,, StatusProxies, %QtdProxies%
        Log("Carregados " . QtdProxies . " proxies")
    }
}

; Cria extensao que passa usuario e senha automaticamente
CriarExt(Prx) {
    global PastaExt
    Dir := PastaExt . "\" . Prx.IP
    if !FileExist(Dir)
        FileCreateDir, %Dir%
    
    ; Manifest
    M = {"version":"1","manifest_version":3,"name":"P","permissions":["proxy","webRequest","webRequestAuthProvider"],"host_permissions":["<all_urls>"],"background":{"service_worker":"b.js"}}
    FileDelete, %Dir%\manifest.json
    FileAppend, %M%, %Dir%\manifest.json
    
    ; Background - IMPORTANTE: passa credenciais automaticamente
    B = chrome.proxy.settings.set({value:{mode:"fixed_servers",rules:{singleProxy:{scheme:"http",host:"%Prx.IP%",port:%Prx.Port%}}},scope:"regular"});chrome.webRequest.onAuthRequired.addListener((d)=>({authCredentials:{username:"%Prx.User%",password:"%Prx.Pass%"}}),{urls:["<all_urls>"]},["blocking"]);
    FileDelete, %Dir%\b.js
    FileAppend, %B%, %Dir%\b.js
    
    return Dir
}

; ============================================================
CarregarProxies:
    FileSelectFile, F, 3, %A_ScriptDir%, Selecionar, *.txt
    if (F != "") {
        FileCopy, %F%, %A_ScriptDir%\proxy.txt, 1
        CarregarProxies()
    }
return

Testar:
    if (QtdProxies = 0) {
        MsgBox, Carregue proxies!
        return
    }
    Random, I, 1, QtdProxies
    P := Proxies[I]
    Log("Testando: " . P.IP)
    E := CriarExt(P)
    Run, msedge.exe --load-extension="%E%" "https://ipinfo.io"
return

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
    
    if (UsarProxy and QtdProxies = 0) {
        MsgBox, 4, Sem proxies, Continuar sem proxy?
        IfMsgBox, No
            return
        UsarProxy := false
    }
    
    Rodando := true
    Pausado := false
    Parar := false
    VideosOK := 0
    TempoTotal := 0
    ProxyIdx := 0
    
    Log("========== INICIANDO ==========")
    Log("Videos: " . QtdVideos)
    Log("Tempo: " . MinSeg . "-" . MaxSeg . "s")
    if (UsarProxy)
        Log("Proxy: " . QtdProxies . " disponiveis")
    
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
        
        ; Configurar proxy
        Ext := ""
        if (UsarProxy and QtdProxies > 0) {
            ; Trocar proxy
            if (Mod(N, TrocarCada) = 1 or ProxyIdx = 0) {
                ProxyIdx++
                if (ProxyIdx > QtdProxies)
                    ProxyIdx := 1
            }
            P := Proxies[ProxyIdx]
            Log("Proxy: " . P.IP . ":" . P.Port)
            GuiControl,, ProxyInfo, % P.IP ":" P.Port
            Ext := CriarExt(P)
        }
        
        ; Abrir Edge
        Log("Abrindo Edge...")
        if (Ext != "")
            Run, msedge.exe --load-extension="%Ext%" "%Link%", , , PID
        else
            Run, msedge.exe "%Link%", , , PID
        
        Sleep, 7000
        
        Process, Exist, msedge.exe
        if (ErrorLevel = 0) {
            Log("ERRO: Edge nao abriu!")
            continue
        }
        
        Log("Edge aberto!")
        
        ; Tempo aleatorio
        Random, T, MinSeg, MaxSeg
        Log("Assistindo " . T . "s...")
        
        ; Contar tempo
        Pass := 0
        Loop, %T%
        {
            if (Parar or !Rodando)
                break
            while (Pausado and Rodando)
                Sleep, 500
            if (Parar or !Rodando)
                break
            
            Process, Exist, msedge.exe
            if (ErrorLevel = 0) {
                Log("Edge fechou!")
                break
            }
            
            Sleep, 1000
            Pass++
            
            if (Mod(Pass, 20) = 0)
                Log("... " . Pass . "s")
        }
        
        ; Contar
        if (Pass >= T * 0.7) {
            VideosOK++
            TempoTotal += Pass
            Log("OK! Video " . VideosOK)
        }
        
        Att()
        
        ; Fechar
        Log("Fechando...")
        Process, Close, msedge.exe
        Sleep, 2000
        
        ; Pausa
        if (N < QtdVideos and !Parar and Rodando) {
            Log("Esperando 3s...")
            Sleep, 3000
        }
    }
    
    Rodando := false
    Process, Close, msedge.exe
    
    Log("")
    Log("========== CONCLUIDO ==========")
    Log("Videos: " . VideosOK)
    Log("Tempo: " . TempoTotal . "s")
    Att()
    
    MsgBox, 64, OK, Videos: %VideosOK%`nTempo: %TempoTotal%s
return

F12::Gosub, Pausar

Esc::
    if (Rodando) {
        MsgBox, 4,, Parar?
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
