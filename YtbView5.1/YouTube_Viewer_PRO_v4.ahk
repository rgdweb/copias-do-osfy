;==============================================================
; YOUTUBE VIEWER PRO v4.1 - CORRIGIDO
;==============================================================

#SingleInstance Force
#NoEnv
SetWorkingDir %A_ScriptDir%

global Rodando := false
global Pausado := false
global Parar := false
global TotalVideos := 0
global VideosOK := 0
global TempoTotal := 0
global LinkVideo := ""
global MinTempo := 45
global MaxTempo := 120
global TrocarIP := 3
global UsarProxies := true

global ListaProxies := []
global TotalProxies := 0
global ProxyIndex := 0
global PastaScript := A_ScriptDir
global PastaExt := ""

; ============================================================
; INTERFACE
; ============================================================

Gui, Font, s11 cWhite, Arial
Gui, Color, 0x1a1a2e

Gui, Add, Text, x0 y5 w620 h35 Center cCyan Background0x16213e, YOUTUBE VIEWER PRO v4.1

Gui, Font, s10 cWhite
Gui, Add, GroupBox, x15 y45 w590 h80 cCyan, Video
Gui, Add, Text, x25 y65 w80 h20, Link:
Gui, Add, Edit, x25 y85 w570 h25 vLinkVideo, https://www.youtube.com/watch?v=

Gui, Add, GroupBox, x15 y130 w290 h170 cCyan, Configuracoes
Gui, Add, Text, x25 y155 w120 h20, Quantidade:
Gui, Add, Edit, x150 y152 w60 h25 vTotalVideos Center, 10

Gui, Add, Text, x25 y185 w120 h20, Tempo min (seg):
Gui, Add, Edit, x150 y182 w60 h25 vMinTempo Center, 45

Gui, Add, Text, x25 y215 w120 h20, Tempo max (seg):
Gui, Add, Edit, x150 y212 w60 h25 vMaxTempo Center, 120

Gui, Add, Text, x25 y245 w120 h20, Trocar IP a cada:
Gui, Add, Edit, x150 y242 w60 h25 vTrocarIP Center, 3
Gui, Add, Text, x215 y245 w70 h20, videos

Gui, Add, CheckBox, x25 y275 w260 h20 vUsarProxies Checked, Usar proxies do arquivo

Gui, Add, GroupBox, x315 y130 w290 h170 cCyan, Proxies
Gui, Add, Text, x325 y155 w100 h20, Proxies carregados:
Gui, Add, Text, x430 y155 w80 h20 vStatusProxies cLime, 0

Gui, Add, Text, x325 y185 w100 h20, Proxy atual:
Gui, Add, Text, x430 y185 w160 h20 vProxyAtual cYellow, Nenhum

Gui, Add, Button, x325 y220 w130 h30 gCarregarProxies, Carregar Proxies
Gui, Add, Button, x465 y220 w130 h30 gTestarProxy, Testar Proxy

Gui, Add, Button, x15 y310 w130 h45 gIniciar Background0x27ae60, INICIAR
Gui, Add, Button, x155 y310 w90 h45 gPausar Background0xf39c12, PAUSAR
Gui, Add, Button, x255 y310 w90 h45 gParar Background0xe74c3c, PARAR

Gui, Add, GroupBox, x15 y365 w380 h130 cCyan, Log
Gui, Add, Edit, x25 y385 w360 h100 vLogEdit ReadOnly

Gui, Add, GroupBox, x405 y365 w200 h130 cCyan, Status
Gui, Add, Text, x420 y390 w170 h20, Visualizacoes:
Gui, Add, Text, x420 y410 w170 h25 vStatusVids cLime, 0 / 0
Gui, Add, Text, x420 y440 w170 h20, Tempo total:
Gui, Add, Text, x420 y460 w170 h25 vStatusTempo cLime, 0 min
Gui, Add, Text, x420 y490 w170 h20, Situacao:
Gui, Add, Text, x420 y510 w170 h20 vStatusSit cYellow, Aguardando

Gui, Show, w620 h510, YouTube Viewer PRO v4.1

PastaExt := PastaScript . "\proxy_ext"
if !FileExist(PastaExt)
    FileCreateDir, %PastaExt%

CarregarProxies()
return

; ============================================================
; FUNCOES
; ============================================================

Log(Msg)
{
    FormatTime, H,, HH:mm:ss
    GuiControlGet, L,, LogEdit
    GuiControl,, LogEdit, [%H%] %Msg%`r`n%L%
}

Att()
{
    global VideosOK, TotalVideos, TempoTotal
    GuiControl,, StatusVids, %VideosOK% / %TotalVideos%
    GuiControl,, StatusTempo, % (TempoTotal // 60) . " min"
    GuiControl,, StatusSit, % Rodando ? (Pausado ? "Pausado" : "Rodando") : "Parado"
}

CarregarProxies()
{
    global
    Arquivo := PastaScript . "\proxy.txt"
    
    if !FileExist(Arquivo)
    {
        Log("Arquivo proxy.txt nao encontrado")
        return
    }
    
    ListaProxies := []
    TotalProxies := 0
    
    Loop, Read, %Arquivo%
    {
        L := Trim(A_LoopReadLine)
        if (L = "")
            continue
        
        P := StrSplit(L, ":")
        if (P.Length() >= 4)
        {
            ListaProxies.Push({IP: P[1], Porta: P[2], User: P[3], Pass: P[4]})
            TotalProxies++
        }
    }
    
    if (TotalProxies > 0)
    {
        GuiControl,, StatusProxies, %TotalProxies%
        Log("Carregados " . TotalProxies . " proxies!")
    }
}

CriarExtensao(Proxy)
{
    global PastaExt
    
    Pasta := PastaExt . "\" . Proxy.IP
    if !FileExist(Pasta)
        FileCreateDir, %Pasta%
    
    ; Manifest.json - usando variaveis para evitar erro de aspas
    M1 = {"version":"1.0","manifest_version":3,"name":"ProxyExt"
    M2 = ,"permissions":["proxy","webRequest","webRequestAuthProvider"]
    M3 = ,"host_permissions":["<all_urls>"]
    M4 = ,"background":{"service_worker":"bg.js"}}
    Manifest = %M1%%M2%%M3%%M4%
    
    FileDelete, %Pasta%\manifest.json
    FileAppend, %Manifest%, %Pasta%\manifest.json
    
    ; Background.js
    B1 = chrome.proxy.settings.set({value:{mode:"fixed_servers",rules:{singleProxy:{scheme:"http",host:"
    B2 = % Proxy.IP
    B3 = ",port:
    B4 = % Proxy.Porta
    B5 = }}},scope:"regular"});chrome.webRequest.onAuthRequired.addListener((d)=>({authCredentials:{username:"
    B6 = % Proxy.User
    B7 = ",password:"
    B8 = % Proxy.Pass
    B9 = "}}),{urls:["<all_urls>"]},["blocking"]);"
    Background = %B1%%B2%%B3%%B4%%B5%%B6%%B7%%B8%%B9%
    
    FileDelete, %Pasta%\bg.js
    FileAppend, %Background%, %Pasta%\bg.js
    
    return Pasta
}

; ============================================================
; BOTOES
; ============================================================

CarregarProxies:
    FileSelectFile, F, 3, %PastaScript%, Selecionar arquivo de proxies, *.txt
    if (F != "")
    {
        FileCopy, %F%, %PastaScript%\proxy.txt, 1
        CarregarProxies()
    }
return

TestarProxy:
    if (TotalProxies = 0)
    {
        MsgBox, Carregue os proxies primeiro!
        return
    }
    
    Random, I, 1, TotalProxies
    P := ListaProxies[I]
    Log("Testando: " . P.IP)
    
    Ext := CriarExtensao(P)
    Run, msedge.exe --load-extension="%Ext%" "https://whatismyipaddress.com"
    
    Log("Edge aberto - verifique o IP")
return

Iniciar:
    if (Rodando)
    {
        MsgBox, Ja esta rodando!
        return
    }
    
    Gui, Submit, NoHide
    
    if (InStr(LinkVideo, "youtube") = 0)
    {
        MsgBox, Link invalido!
        return
    }
    
    TotalVideos := TotalVideos + 0
    if (TotalVideos < 1)
        TotalVideos := 1
    
    MinTempo := MinTempo + 0
    if (MinTempo < 10)
        MinTempo := 10
    
    MaxTempo := MaxTempo + 0
    if (MaxTempo < MinTempo)
        MaxTempo := MinTempo
    
    TrocarIP := TrocarIP + 0
    if (TrocarIP < 1)
        TrocarIP := 1
    
    UsarProxies := UsarProxies
    
    if (UsarProxies and TotalProxies = 0)
    {
        MsgBox, 4, Sem proxies, Continuar sem proxies?
        IfMsgBox, No
            return
        UsarProxies := false
    }
    
    Rodando := true
    Pausado := false
    Parar := false
    VideosOK := 0
    TempoTotal := 0
    
    Log("========== INICIANDO ==========")
    Log("Videos: " . TotalVideos)
    Log("Tempo: " . MinTempo . "-" . MaxTempo . "s")
    
    if (UsarProxies)
        Log("Proxies: " . TotalProxies . " disponiveis")
    else
        Log("Sem proxies")
    
    Att()
    SetTimer, Rodar, 100
return

Pausar:
    if (!Rodando)
        return
    Pausado := !Pausado
    Log(Pausado ? "PAUSADO" : "CONTINUANDO")
    Att()
return

Parar:
    Parar := true
    Rodando := false
    Process, Close, msedge.exe
    Log("PARADO")
    Att()
return

; ============================================================
; EXECUCAO
; ============================================================

Rodar:
    SetTimer, Rodar, Off
    
    Loop, %TotalVideos%
    {
        if (Parar or !Rodando)
            break
        
        while (Pausado and Rodando)
            Sleep, 500
        
        if (Parar or !Rodando)
            break
        
        Num := A_Index
        Log("")
        Log("========== VIDEO " . Num . "/" . TotalVideos . " ==========")
        
        ; Fechar Edge
        Process, Close, msedge.exe
        Sleep, 2000
        
        ; Escolher proxy
        ExtPath := ""
        if (UsarProxies and TotalProxies > 0)
        {
            if (Mod(Num, TrocarIP) = 1)
            {
                ProxyIndex++
                if (ProxyIndex > TotalProxies)
                    ProxyIndex := 1
            }
            
            P := ListaProxies[ProxyIndex]
            Log("Proxy: " . P.IP . ":" . P.Porta)
            GuiControl,, ProxyAtual, % P.IP . ":" . P.Porta
            
            ExtPath := CriarExtensao(P)
        }
        
        ; Abrir Edge
        Log("Abrindo Edge...")
        
        if (ExtPath != "")
            Run, msedge.exe --load-extension="%ExtPath%" "%LinkVideo%", , , PID
        else
            Run, msedge.exe "%LinkVideo%", , , PID
        
        Sleep, 7000
        
        Process, Exist, msedge.exe
        if (ErrorLevel = 0)
        {
            Log("ERRO: Edge nao abriu!")
            continue
        }
        
        Log("Edge aberto!")
        
        Random, Tempo, MinTempo, MaxTempo
        Log("Assistindo " . Tempo . " segundos...")
        
        Passados := 0
        Loop, %Tempo%
        {
            if (Parar or !Rodando)
                break
            
            while (Pausado and Rodando)
                Sleep, 500
            
            if (Parar or !Rodando)
                break
            
            Process, Exist, msedge.exe
            if (ErrorLevel = 0)
            {
                Log("Edge fechou antes!")
                break
            }
            
            Sleep, 1000
            Passados++
            
            if (Mod(Passados, 20) = 0)
                Log("... " . Passados . "s / " . Tempo . "s")
        }
        
        if (Passados >= Tempo * 0.7)
        {
            VideosOK++
            TempoTotal += Passados
            Log("OK! Video " . VideosOK . " concluido")
        }
        
        Att()
        
        Log("Fechando Edge...")
        Process, Close, msedge.exe
        Sleep, 2000
        
        if (Num < TotalVideos and !Parar and Rodando)
        {
            Log("Aguardando 3s...")
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
    
    MsgBox, 64, Concluido, Videos: %VideosOK%`nTempo: %TempoTotal%s
return

; ============================================================
; ATALHOS
; ============================================================

F12::Gosub, Pausar

Esc::
    if (Rodando)
    {
        MsgBox, 4, Sair, Parar?
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
