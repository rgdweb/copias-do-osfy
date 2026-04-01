;==============================================================
; YOUTUBE VIEWER PRO v2.1 - CORRIGIDO
;==============================================================
;
; CORRECOES v2.1:
; - Verifica se Edge esta aberto antes de continuar
; - Fecha Edge e abre novo para cada video
; - Contador correto de visualizacoes
; - Logs mais detalhados
;
;==============================================================

#SingleInstance Force
#NoEnv
SetWorkingDir %A_ScriptDir%
CoordMode, Mouse, Screen

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
; CRIAR INTERFACE GRAFICA
; ============================================================

Gui, Font, s10 cWhite, Segoe UI
Gui, Color, 1a1a2e, 16213e

Gui, Add, Text, x20 y10 w660 h25 Center cCyan BackgroundTrans, ================================================================
Gui, Font, s12 cCyan Bold
Gui, Add, Text, x20 y15 w660 h30 Center BackgroundTrans, YOUTUBE VIEWER PRO v2.1
Gui, Font, s8 cGray Normal
Gui, Add, Text, x20 y42 w660 h20 Center BackgroundTrans, Gerador de Visualizacoes com Proxies Automaticos - Versao Corrigida
Gui, Font, s10 cWhite

Gui, Add, GroupBox, x20 y65 w660 h115 cCyan, Configuracoes do Video
Gui, Add, Text, x35 y90 w200 h20 BackgroundTrans, Insira o link do video ou playlist:
Gui, Add, Edit, x35 y110 w630 h25 vLinkYouTube, https://www.youtube.com/

Gui, Add, Text, x35 y140 w80 h20 BackgroundTrans, Tipo de link:
Gui, Add, DropDownList, x120 y137 w100 h200 vTipoLink Choose1, Video|Playlist|Canal
Gui, Add, CheckBox, x240 y140 w150 h20 vIgnorarAssistidos Checked BackgroundTrans, Ignorar videos assistidos

Gui, Add, GroupBox, x20 y190 w320 h145 cCyan, Proxy / IP
Gui, Add, Text, x35 y215 w120 h20 BackgroundTrans, Proxies carregados:
Gui, Add, Text, x160 y215 w80 h20 vStatusProxies cLime BackgroundTrans, 0

Gui, Add, Text, x35 y240 w120 h20 BackgroundTrans, Proxy atual:
Gui, Add, Text, x160 y240 w160 h20 vProxyInfo cYellow BackgroundTrans, Nenhum

Gui, Add, Text, x35 y265 w120 h20 BackgroundTrans, Trocar IP a cada:
Gui, Add, Edit, x160 y262 w50 h20 vTrocarProxy Center, 3
Gui, Add, Text, x215 y265 w80 h20 BackgroundTrans, videos

Gui, Add, CheckBox, x35 y295 w280 h20 vUsarProxy Checked BackgroundTrans, Usar proxies automaticos

Gui, Add, GroupBox, x360 y190 w320 h145 cCyan, Visualizacoes
Gui, Add, Text, x375 y215 w150 h20 BackgroundTrans, Quantidade:
Gui, Add, Edit, x530 y212 w80 h25 vQuantidade Center, 10

Gui, Add, Text, x375 y245 w100 h20 BackgroundTrans, Tempo minimo:
Gui, Add, Edit, x475 y242 w50 h20 vMinTempo Center, 45
Gui, Add, Text, x530 y245 w20 h20 BackgroundTrans, seg

Gui, Add, Text, x375 y270 w100 h20 BackgroundTrans, Tempo maximo:
Gui, Add, Edit, x475 y267 w50 h20 vMaxTempo Center, 120
Gui, Add, Text, x530 y270 w20 h20 BackgroundTrans, seg

Gui, Add, Text, x375 y300 w250 h20 cGray BackgroundTrans, Navegador: Microsoft Edge

Gui, Add, Button, x20 y345 w150 h40 gIniciar, INICIAR
Gui, Add, Button, x180 y345 w80 h40 gPausar, PAUSAR
Gui, Add, Button, x270 y345 w80 h40 gParar, PARAR
Gui, Add, Button, x360 y345 w100 h40 gCarregarProxies, CARREGAR PROXIES
Gui, Add, Button, x470 y345 w100 h40 gTestarProxy, TESTAR PROXY
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

Gui, Add, Text, x20 y585 w660 h20 Center cGray BackgroundTrans, F12 = Pausar/Retomar | ESC = Encerrar

Gui, Show, w700 h610, YouTube Viewer PRO v2.1

CriarEstrutura()
CarregarProxiesAutomatico()

return

; ============================================================
; FUNCOES DE INICIALIZACAO
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
        . "91.123.8.35:6575:nypkwabo:b9l2ztpk81vl`n"
        
        FileAppend, %ProxiesPadrao%, %ArquivoProxy%
    }
}

CarregarProxiesAutomatico()
{
    global PastaScript, ListaProxies, TotalProxies
    
    ArquivoProxy := PastaScript . "\proxy.txt"
    
    if !FileExist(ArquivoProxy)
    {
        AdicionarLog("[!] Arquivo proxy.txt nao encontrado")
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
    NovaLinha := "[" . Hora . "] " . Texto . "`r`n"
    GuiControl,, LogEdit, % NovaLinha . LogAtual
    ControlSend, Edit1, ^{Home}, YouTube Viewer PRO v2.1
}

AtualizarStatus()
{
    global VideosAssistidos, TotalVideos, TempoTotal, Rodando, Pausado
    
    Horas := TempoTotal // 3600
    Minutos := (TempoTotal mod 3600) // 60
    Segundos := TempoTotal mod 60
    
    GuiControl,, StatusVideos, % VideosAssistidos . " / " . TotalVideos
    GuiControl,, StatusTempo, % Horas . "h " . Minutos . "m " . Segundos . "s"
    
    if (Rodando and !Pausado)
        GuiControl,, StatusAtual, Executando...
    else if (Pausado)
        GuiControl,, StatusAtual, Pausado
    else
        GuiControl,, StatusAtual, Parado
}

; ============================================================
; CRIAR EXTENSAO DE PROXY
; ============================================================

CriarExtensaoProxy(Proxy)
{
    global PastaExtensions
    
    NomeExtensao := "proxy_" . Proxy.IP . "_" . Proxy.Porta
    PastaExtensao := PastaExtensions . "\" . NomeExtensao
    
    if !FileExist(PastaExtensao)
        FileCreateDir, %PastaExtensao%
    
    Manifest := "{`n"
    . "  ""version"": ""1.0.0"",`n"
    . "  ""manifest_version"": 3,`n"
    . "  ""name"": ""YouTube Viewer Proxy"",`n"
    . "  ""permissions"": [""proxy"", ""storage"", ""webRequest"", ""webRequestAuthProvider""],`n"
    . "  ""host_permissions"": [""<all_urls>""],`n"
    . "  ""background"": {`n"
    . "    ""service_worker"": ""background.js""`n"
    . "  }`n"
    . "}"
    
    ArquivoManifest := PastaExtensao . "\manifest.json"
    FileDelete, %ArquivoManifest%
    FileAppend, %Manifest%, %ArquivoManifest%
    
    Background := "chrome.runtime.onStartup.addListener(() => {`n"
    . "  chrome.proxy.settings.set({`n"
    . "    value: {`n"
    . "      mode: ""fixed_servers"",`n"
    . "      rules: {`n"
    . "        singleProxy: {`n"
    . "          scheme: ""http"",`n"
    . "          host: """ . Proxy.IP . """,`n"
    . "          port: " . Proxy.Porta . "`n"
    . "        },`n"
    . "        bypassList: [""localhost""]`n"
    . "      }`n"
    . "    },`n"
    . "    scope: ""regular""`n"
    . "  }, () => {});`n"
    . "});`n`n"
    . "chrome.webRequest.onAuthRequired.addListener(`n"
    . "  (details) => {`n"
    . "    return {`n"
    . "      authCredentials: {`n"
    . "        username: """ . Proxy.Usuario . """,`n"
    . "        password: """ . Proxy.Senha . """`n"
    . "      }`n"
    . "    };`n"
    . "  },`n"
    . "  {urls: [""<all_urls>""]},`n"
    . "  [""blocking""]`n"
    . ");"
    
    ArquivoBackground := PastaExtensao . "\background.js"
    FileDelete, %ArquivoBackground%
    FileAppend, %Background%, %ArquivoBackground%
    
    return PastaExtensao
}

; ============================================================
; BOTOES
; ============================================================

CarregarProxies:
    FileSelectFile, ArquivoSelecionado, 3, %PastaScript%, Selecione o arquivo de proxies, Arquivos de texto (*.txt)
    if (ArquivoSelecionado = "")
        return
    FileCopy, %ArquivoSelecionado%, %PastaScript%\proxy.txt, 1
    CarregarProxiesAutomatico()
return

TestarProxy:
    global ListaProxies, TotalProxies
    
    if (TotalProxies = 0)
    {
        MsgBox, 48, Aviso, Carregue os proxies primeiro!
        return
    }
    
    Random, Indice, 1, TotalProxies
    Proxy := ListaProxies[Indice]
    
    AdicionarLog("[TESTE] Proxy: " . Proxy.IP . ":" . Proxy.Porta)
    
    PastaExtensao := CriarExtensaoProxy(Proxy)
    Run, msedge.exe --load-extension="%PastaExtensao%" https://whatismyipaddress.com
    
    AdicionarLog("[OK] Edge aberto - verifique o IP")
return

Ajuda:
    MsgBox, 64, Ajuda,
    (
    COMO USAR:

    1. Carregue os proxies
    2. Cole o link do YouTube
    3. Configure quantidade e tempo
    4. Clique em INICIAR

    LOGICA:
    - Abre Edge com proxy
    - Assiste o video pelo tempo configurado
    - Fecha Edge
    - Abre novo Edge com novo proxy
    - Repete ate completar a quantidade

    ATALHOS:
    F12 = Pausar/Retomar
    ESC = Sair
    )
return

Iniciar:
    if (Rodando)
    {
        MsgBox, 48, Aguarde, O script ja esta rodando!
        return
    }
    
    Gui, Submit, NoHide
    
    if (InStr(LinkYouTube, "youtube.com") = 0 and InStr(LinkYouTube, "youtu.be") = 0)
    {
        MsgBox, 16, Erro, Insira um link valido do YouTube!
        return
    }
    
    Quantidade := Quantidade + 0
    if (Quantidade < 1)
        Quantidade := 1
    if (Quantidade > 1000)
        Quantidade := 1000
    
    ConfigMinTempo := MinTempo + 0
    ConfigMaxTempo := MaxTempo + 0
    ConfigTrocarProxy := TrocarProxy + 0
    ConfigUsarProxy := UsarProxy
    
    if (ConfigUsarProxy and TotalProxies = 0)
    {
        MsgBox, 48, Aviso, Proxies nao carregados! Continuar sem proxy?
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
    ProxyAtual := 0
    LinkAtual := LinkYouTube
    
    AdicionarLog("[INICIO] " . Quantidade . " videos configurados")
    AdicionarLog("[LINK] " . LinkYouTube)
    
    if (ConfigUsarProxy)
        AdicionarLog("[PROXY] " . TotalProxies . " disponiveis")
    else
        AdicionarLog("[AVISO] Sem proxy")
    
    AtualizarStatus()
    SetTimer, ExecutarScript, 100
return

Pausar:
    if (!Rodando)
        return
    
    Pausado := !Pausado
    
    if (Pausado)
    {
        AdicionarLog("[PAUSA] Script pausado")
        GuiControl,, StatusAtual, Pausado
    }
    else
    {
        AdicionarLog("[CONTINUE] Script retomado")
        GuiControl,, StatusAtual, Executando...
    }
return

Parar:
    if (!Rodando)
        return
    
    Parar := true
    Rodando := false
    Pausado := false
    
    AdicionarLog("[PARADO] Usuario parou o script")
    
    ; Fechar todos os Edge
    Process, Close, msedge.exe
    
    AtualizarStatus()
return

; ============================================================
; EXECUCAO PRINCIPAL - LOGICA CORRIGIDA
; ============================================================

ExecutarScript:
    SetTimer, ExecutarScript, Off
    
    Loop, %TotalVideos%
    {
        ; Verificar se deve parar
        if (Parar or !Rodando)
        {
            AdicionarLog("[FIM] Script interrompido")
            break
        }
        
        ; Verificar pausa
        while (Pausado and Rodando)
            Sleep, 500
        
        if (Parar or !Rodando)
            break
        
        VideoNum := A_Index
        
        ; ========================================
        ; PASSO 1: Fechar Edge anterior
        ; ========================================
        AdicionarLog("[VIDEO " . VideoNum . "/" . TotalVideos . "] Preparando...")
        
        Process, Close, msedge.exe
        Sleep, 2000
        
        ; ========================================
        ; PASSO 2: Escolher proxy
        ; ========================================
        if (ConfigUsarProxy and TotalProxies > 0)
        {
            Random, ProxyAtual, 1, TotalProxies
            Proxy := ListaProxies[ProxyAtual]
            AdicionarLog("[PROXY] " . Proxy.IP . ":" . Proxy.Porta)
            GuiControl,, ProxyInfo, % Proxy.IP . ":" . Proxy.Porta
            PastaExtensao := CriarExtensaoProxy(Proxy)
            Comando := "msedge.exe --load-extension=""" . PastaExtensao . """ """ . LinkAtual . """"
        }
        else
        {
            AdicionarLog("[SEM PROXY] Conexao direta")
            Comando := "msedge.exe """ . LinkAtual . """"
        }
        
        ; ========================================
        ; PASSO 3: Abrir Edge
        ; ========================================
        AdicionarLog("[ABRINDO] Iniciando Edge...")
        
        Run, %Comando%, , , EdgePID
        
        ; Esperar Edge abrir
        Sleep, 5000
        
        ; Verificar se Edge abriu
        Process, Exist, msedge.exe
        if (ErrorLevel = 0)
        {
            AdicionarLog("[ERRO] Edge nao abriu! Tentando novamente...")
            Sleep, 2000
            Run, %Comando%, , , EdgePID
            Sleep, 5000
            
            Process, Exist, msedge.exe
            if (ErrorLevel = 0)
            {
                AdicionarLog("[ERRO] Edge falhou! Pulando video...")
                continue
            }
        }
        
        AdicionarLog("[OK] Edge aberto com sucesso")
        
        ; ========================================
        ; PASSO 4: Assistir video
        ; ========================================
        Random, TempoAssistir, ConfigMinTempo, ConfigMaxTempo
        AdicionarLog("[ASSISTINDO] Tempo: " . TempoAssistir . " segundos")
        
        ; Contar tempo com verificacoes
        TempoPassado := 0
        Loop
        {
            ; Verificar pausa
            while (Pausado and Rodando)
                Sleep, 500
            
            ; Verificar se deve parar
            if (Parar or !Rodando)
                break
            
            ; Verificar se Edge ainda esta aberto
            Process, Exist, msedge.exe
            if (ErrorLevel = 0)
            {
                AdicionarLog("[ERRO] Edge foi fechado inesperadamente!")
                break
            }
            
            ; Esperar 1 segundo
            Sleep, 1000
            TempoPassado++
            
            ; Acoes aleatorias a cada 10 segundos
            if (Mod(TempoPassado, 10) = 0)
            {
                Random, Acao, 1, 100
                WinGet, EdgeID, ID, ahk_exe msedge.exe
                if (EdgeID != "")
                {
                    if (Acao <= 30)
                        ControlSend, , k, ahk_id %EdgeID%  ; Pausar
                    else if (Acao <= 60)
                        ControlSend, , {PgDn}, ahk_id %EdgeID%  ; Scroll
                    else if (Acao <= 80)
                        ControlSend, , j, ahk_id %EdgeID%  ; Voltar
                }
            }
            
            ; Verificar se terminou o tempo
            if (TempoPassado >= TempoAssistir)
                break
        }
        
        ; ========================================
        ; PASSO 5: Contar visualizacao
        ; ========================================
        VideosAssistidos++
        TempoTotal += TempoPassado
        AtualizarStatus()
        
        AdicionarLog("[CONCLUIDO] Video " . VideosAssistidos . " assistido (" . TempoPassado . "s)")
        
        ; ========================================
        ; PASSO 6: Fechar Edge
        ; ========================================
        AdicionarLog("[FECHANDO] Encerrando Edge...")
        Process, Close, msedge.exe
        Sleep, 2000
        
        ; Pausa entre videos
        if (VideoNum < TotalVideos)
        {
            Random, Pausa, 3000, 8000
            AdicionarLog("[PAUSA] Aguardando " . (Pausa/1000) . "s para proximo video...")
            Sleep, %Pausa%
        }
    }
    
    ; ========================================
    ; FIM
    ; ========================================
    Rodando := false
    Process, Close, msedge.exe
    
    AdicionarLog("[FIM] Total: " . VideosAssistidos . " videos assistidos")
    AtualizarStatus()
    
    MsgBox, 64, Concluido,
    (
    Visualizacoes concluidas: %VideosAssistidos%
    Tempo total: %TempoTotal% segundos
    
    Obrigado por usar YouTube Viewer PRO!
    )
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
        MsgBox, 4, Sair, Parar o script e sair?
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
    if (Rodando)
    {
        MsgBox, 4, Sair, Parar o script e sair?
        IfMsgBox, Yes
        {
            Parar := true
            Process, Close, msedge.exe
            ExitApp
        }
        return
    }
    ExitApp
return
