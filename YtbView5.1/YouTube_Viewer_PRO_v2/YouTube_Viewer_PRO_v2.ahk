;==============================================================
; YOUTUBE VIEWER PRO v2.3 - SIMPLES E FUNCIONAL
;==============================================================
;
; LOGICA SIMPLES:
; 1. Abre Edge com o video
; 2. Espera o tempo configurado (sem clicar em nada!)
; 3. Fecha Edge
; 4. Abre proximo video
; 5. Repete
;
; SEM cliques, SEM interacoes, SEM DevTools
;
;==============================================================

#SingleInstance Force
#NoEnv
SetWorkingDir %A_ScriptDir%

global Rodando := false
global Pausado := false
global TotalVideos := 0
global VideosAssistidos := 0
global TempoTotal := 0
global Parar := false
global LinkAtual := ""
global ListaProxies := []
global TotalProxies := 0
global ProxyAtual := 0
global PastaScript := A_ScriptDir
global PastaExtensions := ""

global ConfigMinTempo := 45
global ConfigMaxTempo := 120
global ConfigUsarProxy := true

; ============================================================
; INTERFACE
; ============================================================

Gui, Font, s10 cWhite, Segoe UI
Gui, Color, 1a1a2e, 16213e

Gui, Add, Text, x20 y10 w560 h25 Center cCyan, ================================================================
Gui, Font, s12 cCyan Bold
Gui, Add, Text, x20 y15 w560 h30 Center, YOUTUBE VIEWER PRO v2.3
Gui, Font, s8 cGray Normal
Gui, Add, Text, x20 y42 w560 h20 Center, Versao Simples - Abre, Espera, Fecha
Gui, Font, s10 cWhite

Gui, Add, GroupBox, x20 y65 w560 h90 cCyan, Video
Gui, Add, Text, x35 y85 w100 h20, Link do video:
Gui, Add, Edit, x35 y105 w530 h25 vLinkYouTube, https://www.youtube.com/watch?v=

Gui, Add, GroupBox, x20 y165 w270 h130 cCyan, Configuracoes
Gui, Add, Text, x35 y190 w100 h20, Quantidade:
Gui, Add, Edit, x140 y187 w60 h25 vQuantidade Center, 10

Gui, Add, Text, x35 y220 w100 h20, Tempo min (seg):
Gui, Add, Edit, x140 y217 w60 h25 vMinTempo Center, 45

Gui, Add, Text, x35 y250 w100 h20, Tempo max (seg):
Gui, Add, Edit, x140 y247 w60 h25 vMaxTempo Center, 120

Gui, Add, CheckBox, x35 y280 w200 h20 vUsarProxy Checked, Usar proxies

Gui, Add, GroupBox, x310 y165 w270 h130 cCyan, Proxy
Gui, Add, Text, x325 y190 w100 h20, Carregados:
Gui, Add, Text, x430 y190 w60 h20 vStatusProxies cLime, 0

Gui, Add, Text, x325 y220 w100 h20, Proxy atual:
Gui, Add, Text, x430 y220 w120 h20 vProxyInfo cYellow, Nenhum

Gui, Add, Button, x325 y260 w100 h25 gCarregarProxies, Carregar Proxies

Gui, Add, Button, x20 y305 w120 h40 gIniciar, INICIAR
Gui, Add, Button, x150 y305 w80 h40 gPausar, PAUSAR
Gui, Add, Button, x240 y305 w80 h40 gParar, PARAR

Gui, Add, GroupBox, x20 y355 w350 h160 cCyan, Log
Gui, Add, Edit, x30 y375 w330 h130 vLogEdit ReadOnly

Gui, Add, GroupBox, x380 y355 w200 h160 cCyan, Status
Gui, Add, Text, x395 y380 w170 h20, Videos:
Gui, Add, Text, x395 y400 w170 h25 vStatusVideos cLime, 0 / 0
Gui, Add, Text, x395 y435 w170 h20, Tempo total:
Gui, Add, Text, x395 y455 w170 h25 vStatusTempo cLime, 0h 0m 0s
Gui, Add, Text, x395 y490 w170 h20, Status:
Gui, Add, Text, x395 y510 w170 h20 vStatusAtual cYellow, Aguardando

Gui, Add, Text, x20 y525 w560 h20 Center cGray, ESC = Sair | F12 = Pausar

Gui, Show, w600 h550, YouTube Viewer PRO v2.3

CarregarProxiesAuto()
return

; ============================================================
; FUNCOES
; ============================================================

CarregarProxiesAuto()
{
    global
    Arquivo := PastaScript . "\proxy.txt"
    if !FileExist(Arquivo)
        return
    
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
        Log("Carregados " . TotalProxies . " proxies")
    }
}

Log(Txt)
{
    FormatTime, H,, HH:mm:ss
    GuiControlGet, L,, LogEdit
    GuiControl,, LogEdit, [%H%] %Txt%`r`n%L%
}

AttStatus()
{
    global
    H := TempoTotal // 3600
    M := (TempoTotal mod 3600) // 60
    S := TempoTotal mod 60
    GuiControl,, StatusVideos, %VideosAssistidos% / %TotalVideos%
    GuiControl,, StatusTempo, %H%h %M%m %S%s
    GuiControl,, StatusAtual, % Rodando ? (Pausado ? "Pausado" : "Rodando") : "Parado"
}

CriarExtensaoProxy(IP, Porta, User, Pass)
{
    global PastaExtensions
    Pasta := PastaExtensions . "\p" . IP
    if !FileExist(Pasta)
        FileCreateDir, %Pasta%
    
    M := "{""version"":""1"",""manifest_version"":3,""name"":""P"",""permissions"":[""proxy"",""webRequest""],""host_permissions"":[""<all_urls>""],""background"":{""service_worker"":""b.js""}}"
    FileDelete, %Pasta%\manifest.json
    FileAppend, %M%, %Pasta%\manifest.json
    
    B := "chrome.proxy.settings.set({value:{mode:""fixed_servers"",rules:{singleProxy:{scheme:""http"",host:""" . IP . """,port:" . Porta . "}}},scope:""regular""});chrome.webRequest.onAuthRequired.addListener((d)=>({authCredentials:{username:""" . User . """,password:""" . Pass . """}}),{urls:[""<all_urls>""]},[""blocking""]);"
    FileDelete, %Pasta%\b.js
    FileAppend, %B%, %Pasta%\b.js
    
    return Pasta
}

; ============================================================
; BOTOES
; ============================================================

CarregarProxies:
    FileSelectFile, F, 3, %PastaScript%, Proxy, *.txt
    if (F != "")
    {
        FileCopy, %F%, %PastaScript%\proxy.txt, 1
        CarregarProxiesAuto()
    }
return

Iniciar:
    if (Rodando)
    {
        MsgBox, Ja rodando!
        return
    }
    
    Gui, Submit, NoHide
    
    if (InStr(LinkYouTube, "youtube") = 0)
    {
        MsgBox, Link invalido!
        return
    }
    
    TotalVideos := Quantidade + 0
    if (TotalVideos < 1)
        TotalVideos := 1
    
    ConfigMinTempo := MinTempo + 0
    ConfigMaxTempo := MaxTempo + 0
    ConfigUsarProxy := UsarProxy
    
    if (ConfigUsarProxy and TotalProxies = 0)
    {
        MsgBox, 4,, Sem proxies. Continuar?
        IfMsgBox, No
            return
        ConfigUsarProxy := false
    }
    
    Rodando := true
    Pausado := false
    Parar := false
    VideosAssistidos := 0
    TempoTotal := 0
    LinkAtual := LinkYouTube
    
    Log("========== INICIANDO ==========")
    Log("Videos: " . TotalVideos)
    Log("Tempo: " . ConfigMinTempo . "-" . ConfigMaxTempo . "s")
    AttStatus()
    
    SetTimer, Rodar, 100
return

Pausar:
    if (!Rodando)
        return
    Pausado := !Pausado
    Log(Pausado ? "PAUSADO" : "CONTINUANDO")
    AttStatus()
return

Parar:
    Parar := true
    Rodando := false
    Process, Close, msedge.exe
    Log("PARADO")
    AttStatus()
return

; ============================================================
; EXECUCAO - SIMPLES!
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
        
        N := A_Index
        Log("========== VIDEO " . N . "/" . TotalVideos . " ==========")
        
        ; 1. Fechar Edge anterior
        Process, Close, msedge.exe
        Sleep, 2000
        
        ; 2. Abrir Edge
        if (ConfigUsarProxy and TotalProxies > 0)
        {
            Random, ProxyAtual, 1, TotalProxies
            Pr := ListaProxies[ProxyAtual]
            Log("Proxy: " . Pr.IP)
            GuiControl,, ProxyInfo, % Pr.IP ":" Pr.Porta
            Ext := CriarExtensaoProxy(Pr.IP, Pr.Porta, Pr.User, Pr.Pass)
            Run, msedge.exe --load-extension="%Ext%" "%LinkAtual%", , , PID
        }
        else
        {
            Run, msedge.exe "%LinkAtual%", , , PID
        }
        
        Log("Abrindo Edge...")
        
        ; 3. Esperar abrir
        Sleep, 8000
        
        ; 4. Verificar se abriu
        Process, Exist, msedge.exe
        if (ErrorLevel = 0)
        {
            Log("ERRO: Edge nao abriu!")
            continue
        }
        
        Log("Edge aberto!")
        
        ; 5. Esperar o tempo configurado (SEM CLICAR EM NADA!)
        Random, Tempo, ConfigMinTempo, ConfigMaxTempo
        Log("Assistindo " . Tempo . "s...")
        
        Restante := Tempo
        Loop, %Tempo%
        {
            if (Parar or !Rodando)
                break
            
            while (Pausado and Rodando)
                Sleep, 500
            
            if (Parar or !Rodando)
                break
            
            ; Verificar se Edge ainda existe
            Process, Exist, msedge.exe
            if (ErrorLevel = 0)
            {
                Log("Edge fechou inesperadamente!")
                break
            }
            
            Sleep, 1000
            Restante--
            
            ; Atualizar a cada 10s
            if (Mod(Tempo - Restante, 10) = 0)
            {
                Log("Restam " . Restante . "s...")
            }
        }
        
        ; 6. Contar visualizacao
        VideosAssistidos++
        TempoTotal += Tempo
        Log("Video " . VideosAssistidos . " concluido!")
        AttStatus()
        
        ; 7. Fechar Edge
        Log("Fechando Edge...")
        Process, Close, msedge.exe
        Sleep, 2000
        
        ; 8. Pausa antes do proximo
        if (N < TotalVideos and !Parar and Rodando)
        {
            Log("Aguardando 3s...")
            Sleep, 3000
        }
    }
    
    ; FIM
    Rodando := false
    Process, Close, msedge.exe
    Log("========== CONCLUIDO ==========")
    Log("Total: " . VideosAssistidos . " videos")
    AttStatus()
    
    MsgBox, 64, Concluido, Videos: %VideosAssistidos%`nTempo: %TempoTotal%s
return

; ============================================================
; ATALHOS
; ============================================================

F12::
    Gosub, Pausar
return

Esc::
    if (Rodando)
    {
        MsgBox, 4, Sair?, Parar e sair?
        IfMsgBox, Yes
        {
            Parar := true
            Rodando := false
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
