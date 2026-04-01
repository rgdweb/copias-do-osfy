;==============================================================
; YOUTUBE VIEWER PRO v2.2 - CORRIGIDO
;==============================================================
;
; CORRECOES v2.2:
; - Foca na janela do Edge antes de interagir
; - Clica no video para dar play
; - Nao abre DevTools
; - Fecha no tempo exato
; - Abre proximo video automaticamente
;
;==============================================================

#SingleInstance Force
#NoEnv
SetWorkingDir %A_ScriptDir%

; Variaveis globais
global Rodando := false
global Pausado := false
global TotalVideos := 0
global VideosAssistidos := 0
global TempoTotal := 0
global EdgePID := 0
global ProxyAtual := 0
global ListaProxies := []
global TotalProxies := 0
global Parar := false
global PastaScript := A_ScriptDir
global PastaExtensions := ""
global LinkAtual := ""

; Configuracoes
global ConfigMinTempo := 45
global ConfigMaxTempo := 120
global ConfigTrocarProxy := 3
global ConfigUsarProxy := true

; ============================================================
; INTERFACE GRAFICA
; ============================================================

Gui, Font, s10 cWhite, Segoe UI
Gui, Color, 1a1a2e, 16213e

Gui, Add, Text, x20 y10 w660 h25 Center cCyan BackgroundTrans, ================================================================
Gui, Font, s12 cCyan Bold
Gui, Add, Text, x20 y15 w660 h30 Center BackgroundTrans, YOUTUBE VIEWER PRO v2.2
Gui, Font, s8 cGray Normal
Gui, Add, Text, x20 y42 w660 h20 Center BackgroundTrans, Versao Corrigida - Foca no Edge e NAO abre DevTools
Gui, Font, s10 cWhite

Gui, Add, GroupBox, x20 y65 w660 h115 cCyan, Configuracoes do Video
Gui, Add, Text, x35 y90 w200 h20 BackgroundTrans, Insira o link do video:
Gui, Add, Edit, x35 y110 w630 h25 vLinkYouTube, https://www.youtube.com/

Gui, Add, Text, x35 y140 w80 h20 BackgroundTrans, Tipo:
Gui, Add, DropDownList, x120 y137 w100 vTipoLink Choose1, Video|Shorts
Gui, Add, CheckBox, x240 y140 w200 vUsarProxy Checked BackgroundTrans, Usar proxies automaticos

Gui, Add, GroupBox, x20 y190 w320 h145 cCyan, Proxy / IP
Gui, Add, Text, x35 y215 w120 h20 BackgroundTrans, Proxies carregados:
Gui, Add, Text, x160 y215 w80 h20 vStatusProxies cLime BackgroundTrans, 0

Gui, Add, Text, x35 y240 w120 h20 BackgroundTrans, Proxy atual:
Gui, Add, Text, x160 y240 w160 h20 vProxyInfo cYellow BackgroundTrans, Nenhum

Gui, Add, Text, x35 y265 w120 h20 BackgroundTrans, Trocar IP a cada:
Gui, Add, Edit, x160 y262 w50 h20 vTrocarProxy Center, 3
Gui, Add, Text, x215 y265 w80 h20 BackgroundTrans, videos

Gui, Add, GroupBox, x360 y190 w320 h145 cCyan, Visualizacoes
Gui, Add, Text, x375 y215 w150 h20 BackgroundTrans, Quantidade:
Gui, Add, Edit, x530 y212 w80 h25 vQuantidade Center, 10

Gui, Add, Text, x375 y245 w100 h20 BackgroundTrans, Tempo minimo:
Gui, Add, Edit, x475 y242 w50 h20 vMinTempo Center, 45
Gui, Add, Text, x530 y245 w20 h20 BackgroundTrans, seg

Gui, Add, Text, x375 y270 w100 h20 BackgroundTrans, Tempo maximo:
Gui, Add, Edit, x475 y267 w50 h20 vMaxTempo Center, 120
Gui, Add, Text, x530 y270 w20 h20 BackgroundTrans, seg

Gui, Add, Button, x20 y345 w150 h40 gIniciar, INICIAR
Gui, Add, Button, x180 y345 w80 h40 gPausar, PAUSAR
Gui, Add, Button, x270 y345 w80 h40 gParar, PARAR
Gui, Add, Button, x360 y345 w100 h40 gCarregarProxies, CARREGAR PROXIES
Gui, Add, Button, x470 y345 w100 h40 gTestarProxy, TESTAR
Gui, Add, Button, x580 y345 w100 h40 gAjuda, AJUDA

Gui, Add, GroupBox, x20 y395 w420 h180 cCyan, Log de Atividades
Gui, Add, Edit, x30 y415 w400 h150 vLogEdit ReadOnly HScroll -Wrap

Gui, Add, GroupBox, x450 y395 w230 h180 cCyan, Status
Gui, Add, Text, x465 y420 w200 h20 BackgroundTrans, Videos assistidos:
Gui, Add, Text, x465 y440 w200 h30 vStatusVideos cLime BackgroundTrans, 0 / 0

Gui, Add, Text, x465 y480 w200 h20 BackgroundTrans, Tempo total:
Gui, Add, Text, x465 y500 w200 h30 vStatusTempo cLime BackgroundTrans, 0h 0m 0s

Gui, Add, Text, x465 y540 w200 h20 BackgroundTrans, Status:
Gui, Add, Text, x465 y560 w200 h20 vStatusAtual cYellow BackgroundTrans, Aguardando...

Gui, Add, Text, x20 y585 w660 h20 Center cGray BackgroundTrans, F12 = Pausar | ESC = Sair

Gui, Show, w700 h610, YouTube Viewer PRO v2.2

CriarEstrutura()
CarregarProxiesAutomatico()

return

; ============================================================
; FUNCOES BASICAS
; ============================================================

CriarEstrutura()
{
    global PastaScript, PastaExtensions
    PastaExtensions := PastaScript . "\proxy_extensions"
    if !FileExist(PastaExtensions)
        FileCreateDir, %PastaExtensions%
    
    ArquivoProxy := PastaScript . "\proxy.txt"
    if !FileExist(ArquivoProxy)
    {
        ProxiesPadrao := "194.38.19.174:6736:nypkwabo:b9l2ztpk81vl`n"
        . "45.87.50.25:7085:nypkwabo:b9l2ztpk81vl`n"
        FileAppend, %ProxiesPadrao%, %ArquivoProxy%
    }
}

CarregarProxiesAutomatico()
{
    global PastaScript, ListaProxies, TotalProxies
    
    ArquivoProxy := PastaScript . "\proxy.txt"
    if !FileExist(ArquivoProxy)
    {
        AdicionarLog("[!] proxy.txt nao encontrado")
        return
    }
    
    ListaProxies := []
    TotalProxies := 0
    
    Loop, Read, %ArquivoProxy%
    {
        Linha := Trim(A_LoopReadLine)
        if (Linha = "")
            continue
        Partes := StrSplit(Linha, ":")
        if (Partes.Length() >= 4)
        {
            ListaProxies.Push({IP: Partes[1], Porta: Partes[2], Usuario: Partes[3], Senha: Partes[4]})
            TotalProxies++
        }
    }
    
    if (TotalProxies > 0)
    {
        GuiControl,, StatusProxies, %TotalProxies%
        AdicionarLog("[OK] " . TotalProxies . " proxies carregados")
    }
}

AdicionarLog(Texto)
{
    FormatTime, Hora,, HH:mm:ss
    GuiControlGet, LogAtual,, LogEdit
    GuiControl,, LogEdit, % "[" . Hora . "] " . Texto . "`r`n" . LogAtual
}

AtualizarStatus()
{
    global VideosAssistidos, TotalVideos, TempoTotal, Rodando, Pausado
    Horas := TempoTotal // 3600
    Minutos := (TempoTotal mod 3600) // 60
    Segundos := TempoTotal mod 60
    GuiControl,, StatusVideos, % VideosAssistidos . " / " . TotalVideos
    GuiControl,, StatusTempo, % Horas . "h " . Minutos . "m " . Segundos . "s"
    GuiControl,, StatusAtual, % Rodando ? (Pausado ? "Pausado" : "Executando") : "Parado"
}

CriarExtensaoProxy(Proxy)
{
    global PastaExtensions
    NomeExtensao := "proxy_" . Proxy.IP
    PastaExtensao := PastaExtensions . "\" . NomeExtensao
    if !FileExist(PastaExtensao)
        FileCreateDir, %PastaExtensao%
    
    Manifest := "{""version"":""1.0.0"",""manifest_version"":3,""name"":""Proxy"",""permissions"":[""proxy"",""storage"",""webRequest"",""webRequestAuthProvider""],""host_permissions"":[""<all_urls>""],""background"":{""service_worker"":""background.js""}}"
    FileDelete, %PastaExtensao%\manifest.json
    FileAppend, %Manifest%, %PastaExtensao%\manifest.json
    
    Background := "chrome.proxy.settings.set({value:{mode:""fixed_servers"",rules:{singleProxy:{scheme:""http"",host:""" . Proxy.IP . """,port:" . Proxy.Porta . "}}},scope:""regular""});chrome.webRequest.onAuthRequired.addListener((d)=>({authCredentials:{username:""" . Proxy.Usuario . """,password:""" . Proxy.Senha . """}}),{urls:[""<all_urls>""]},[""blocking""]);"
    FileDelete, %PastaExtensao%\background.js
    FileAppend, %Background%, %PastaExtensao%\background.js
    
    return PastaExtensao
}

; ============================================================
; BOTOES
; ============================================================

CarregarProxies:
    FileSelectFile, Arquivo, 3, %PastaScript%, Selecione proxy.txt, *.txt
    if (Arquivo != "")
    {
        FileCopy, %Arquivo%, %PastaScript%\proxy.txt, 1
        CarregarProxiesAutomatico()
    }
return

TestarProxy:
    if (TotalProxies = 0)
    {
        MsgBox, Carregue os proxies primeiro!
        return
    }
    Random, I, 1, TotalProxies
    Proxy := ListaProxies[I]
    AdicionarLog("[TESTE] " . Proxy.IP)
    Ext := CriarExtensaoProxy(Proxy)
    Run, msedge.exe --load-extension="%Ext%" https://whatismyipaddress.com
return

Ajuda:
    MsgBox,
    (
    COMO FUNCIONA:
    
    1. Coloque o link do video
    2. Configure quantidade e tempo
    3. Clique INICIAR
    
    O script vai:
    - Abrir Edge
    - Dar play no video
    - Assistir pelo tempo configurado
    - Fechar Edge
    - Abrir proximo video
    - Repetir ate completar
    )
return

Iniciar:
    if (Rodando)
    {
        MsgBox, Ja esta rodando!
        return
    }
    
    Gui, Submit, NoHide
    
    if (InStr(LinkYouTube, "youtube") = 0)
    {
        MsgBox, Link invalido!
        return
    }
    
    Quantidade := Quantidade + 0
    if (Quantidade < 1)
        Quantidade := 1
    
    ConfigMinTempo := MinTempo + 0
    ConfigMaxTempo := MaxTempo + 0
    ConfigTrocarProxy := TrocarProxy + 0
    ConfigUsarProxy := UsarProxy
    
    if (ConfigUsarProxy and TotalProxies = 0)
    {
        MsgBox, 4,, Proxies nao carregados. Continuar sem proxy?
        IfMsgBox, No
            return
        ConfigUsarProxy := false
    }
    
    Rodando := true
    Pausado := false
    Parar := false
    TotalVideos := Quantidade
    VideosAssistidos := 0
    TempoTotal := 0
    LinkAtual := LinkYouTube
    
    AdicionarLog("========== INICIANDO ==========")
    AdicionarLog("Videos: " . Quantidade)
    AdicionarLog("Tempo: " . ConfigMinTempo . "-" . ConfigMaxTempo . "s")
    
    AtualizarStatus()
    SetTimer, Executar, 100
return

Pausar:
    if (!Rodando)
        return
    Pausado := !Pausado
    AdicionarLog(Pausado ? "[PAUSADO]" : "[CONTINUANDO]")
    AtualizarStatus()
return

Parar:
    Parar := true
    Rodando := false
    Pausado := false
    Process, Close, msedge.exe
    AdicionarLog("[PARADO]")
    AtualizarStatus()
return

; ============================================================
; EXECUCAO PRINCIPAL
; ============================================================

Executar:
    SetTimer, Executar, Off
    
    Loop, %TotalVideos%
    {
        if (Parar or !Rodando)
            break
        
        while (Pausado and Rodando)
            Sleep, 500
        
        if (Parar or !Rodando)
            break
        
        NumVideo := A_Index
        AdicionarLog("========== VIDEO " . NumVideo . "/" . TotalVideos . " ==========")
        
        ; ========================================
        ; 1. FECHAR EDGE ANTIGO
        ; ========================================
        Process, Close, msedge.exe
        Sleep, 2000
        
        ; ========================================
        ; 2. ABRIR EDGE
        ; ========================================
        if (ConfigUsarProxy and TotalProxies > 0)
        {
            Random, ProxyAtual, 1, TotalProxies
            Proxy := ListaProxies[ProxyAtual]
            AdicionarLog("[PROXY] " . Proxy.IP . ":" . Proxy.Porta)
            GuiControl,, ProxyInfo, % Proxy.IP . ":" . Proxy.Porta
            Ext := CriarExtensaoProxy(Proxy)
            Run, msedge.exe --load-extension="%Ext%" "%LinkAtual%", , , EdgePID
        }
        else
        {
            Run, msedge.exe "%LinkAtual%", , , EdgePID
        }
        
        AdicionarLog("[ABRINDO] Edge...")
        Sleep, 6000
        
        ; ========================================
        ; 3. VERIFICAR SE ABRIU
        ; ========================================
        WinWait, ahk_exe msedge.exe,, 10
        if (ErrorLevel)
        {
            AdicionarLog("[ERRO] Edge nao abriu!")
            continue
        }
        
        ; ========================================
        ; 4. PEGAR JANELA DO EDGE
        ; ========================================
        WinGet, EdgeID, ID, ahk_exe msedge.exe
        if (EdgeID = "")
        {
            AdicionarLog("[ERRO] Nao achou janela do Edge")
            continue
        }
        
        ; ========================================
        ; 5. FOCAR NO EDGE
        ; ========================================
        WinActivate, ahk_id %EdgeID%
        WinWaitActive, ahk_id %EdgeID%,, 5
        Sleep, 1000
        
        AdicionarLog("[OK] Edge focado")
        
        ; ========================================
        ; 6. CLICAR NO CENTRO PARA DAR PLAY
        ; ========================================
        ; Pegar tamanho da janela
        WinGetPos, X, Y, W, H, ahk_id %EdgeID%
        
        ; Clicar no centro (onde fica o video)
        CentroX := X + (W // 2)
        CentroY := Y + (H // 2)
        
        ; Clicar para focar e dar play
        Click, %CentroX%, %CentroY%
        Sleep, 500
        Click, %CentroX%, %CentroY%  ; Clica duas vezes para garantir
        
        AdicionarLog("[PLAY] Video iniciado")
        
        ; ========================================
        ; 7. ASSISTIR O VIDEO
        ; ========================================
        Random, TempoTotalVideo, ConfigMinTempo, ConfigMaxTempo
        AdicionarLog("[ASSISTINDO] " . TempoTotalVideo . " segundos")
        
        TempoPassado := 0
        
        Loop, %TempoTotalVideo%
        {
            ; Verificar pausa
            while (Pausado and Rodando)
                Sleep, 500
            
            ; Verificar se parou
            if (Parar or !Rodando)
                break
            
            ; Verificar se Edge ainda existe
            if !WinExist("ahk_id " EdgeID)
            {
                AdicionarLog("[ERRO] Edge fechou!")
                break
            }
            
            ; Esperar 1 segundo
            Sleep, 1000
            TempoPassado++
            
            ; A cada 15 segundos: interagir
            if (Mod(TempoPassado, 15) = 0)
            {
                WinActivate, ahk_id %EdgeID%
                Sleep, 100
                
                Random, Acao, 1, 10
                
                ; NAO usar F12 (abre DevTools)
                ; Usar apenas teclas seguras
                if (Acao <= 3)
                {
                    ; Scroll para baixo
                    Click, WheelDown
                }
                else if (Acao <= 5)
                {
                    ; Pausar/continuar (tecla K)
                    Send, {k}
                }
                else if (Acao <= 7)
                {
                    ; Mover mouse (mantem ativo)
                    MouseMove, %CentroX%, %CentroY%
                }
            }
        }
        
        ; ========================================
        ; 8. CONTAR VISUALIZACAO
        ; ========================================
        if (TempoPassado >= (TempoTotalVideo * 0.8))  ; Se assistiu 80% ou mais
        {
            VideosAssistidos++
            TempoTotal += TempoPassado
            AdicionarLog("[OK] Video " . VideosAssistidos . " concluido")
        }
        else
        {
            AdicionarLog("[!] Video nao foi totalmente assistido")
        }
        
        AtualizarStatus()
        
        ; ========================================
        ; 9. FECHAR EDGE
        ; ========================================
        AdicionarLog("[FECHANDO] Edge...")
        WinClose, ahk_id %EdgeID%
        Sleep, 2000
        Process, Close, msedge.exe  ; Garantir que fechou
        Sleep, 1000
        
        ; ========================================
        ; 10. PAUSA ANTES DO PROXIMO
        ; ========================================
        if (NumVideo < TotalVideos)
        {
            Random, Pausa, 2000, 5000
            AdicionarLog("[PAUSA] " . (Pausa/1000) . "s ate proximo...")
            Sleep, %Pausa%
        }
    }
    
    ; ========================================
    ; FIM
    ; ========================================
    Rodando := false
    Process, Close, msedge.exe
    
    AdicionarLog("========== CONCLUIDO ==========")
    AdicionarLog("Total: " . VideosAssistidos . " videos")
    AtualizarStatus()
    
    MsgBox, 64, Concluido, Videos assistidos: %VideosAssistidos%`nTempo total: %TempoTotal% segundos
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
        MsgBox, 4, Sair, Parar e sair?
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
    Parar := true
    Process, Close, msedge.exe
    ExitApp
return
