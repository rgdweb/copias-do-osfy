;==============================================================
; YOUTUBE VIEWER PRO v2.0 - COM PROXIES AUTOMATICOS
;==============================================================
;
; Baseado no YtbView5.1 - Versao melhorada e gratuita
; Usa os 100 proxies do arquivo proxy.txt
;
; Funcionalidades:
; - Troca de IP automatica com proxies
; - Interface grafica completa
; - Roda no Edge (voce usa o Chrome)
; - Sem necessidade de licenca
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
global EdgeID := ""
global ProxyAtual := 0
global ListaProxies := []
global TotalProxies := 0
global Parar := false
global PastaScript := A_ScriptDir
global PastaExtensions := ""

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

; Cabecalho
Gui, Add, Text, x20 y10 w660 h25 Center cCyan BackgroundTrans, ================================================================
Gui, Font, s12 cCyan Bold
Gui, Add, Text, x20 y15 w660 h30 Center BackgroundTrans, YOUTUBE VIEWER PRO v2.0
Gui, Font, s8 cGray Normal
Gui, Add, Text, x20 y42 w660 h20 Center BackgroundTrans, Gerador de Visualizacoes com Proxies Automaticos - 100% Gratuito
Gui, Font, s10 cWhite

; Secao de Link
Gui, Add, GroupBox, x20 y65 w660 h115 cCyan, Configuracoes do Video
Gui, Add, Text, x35 y90 w200 h20 BackgroundTrans, Insira o link do video ou playlist:
Gui, Add, Edit, x35 y110 w630 h25 vLinkYouTube, https://www.youtube.com/

Gui, Add, Text, x35 y140 w80 h20 BackgroundTrans, Tipo de link:
Gui, Add, DropDownList, x120 y137 w100 h200 vTipoLink Choose1, Video|Playlist|Canal
Gui, Add, CheckBox, x240 y140 w150 h20 vIgnorarAssistidos Checked BackgroundTrans, Ignorar videos assistidos

; Secao de Proxy
Gui, Add, GroupBox, x20 y190 w320 h145 cCyan, Proxy / IP
Gui, Add, Text, x35 y215 w120 h20 BackgroundTrans, Proxies carregados:
Gui, Add, Text, x160 y215 w80 h20 vStatusProxies cLime BackgroundTrans, 0

Gui, Add, Text, x35 y240 w120 h20 BackgroundTrans, Proxy atual:
Gui, Add, Text, x160 y240 w160 h20 vProxyInfo cYellow BackgroundTrans, Nenhum

Gui, Add, Text, x35 y265 w120 h20 BackgroundTrans, Trocar IP a cada:
Gui, Add, Edit, x160 y262 w50 h20 vTrocarProxy Center, 3
Gui, Add, Text, x215 y265 w80 h20 BackgroundTrans, videos

Gui, Add, CheckBox, x35 y295 w280 h20 vUsarProxy Checked BackgroundTrans, Usar proxies automaticos (100 disponiveis)

; Secao de Visualizacoes
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

; Botoes principais
Gui, Add, Button, x20 y345 w150 h40 gIniciar, INICIAR
Gui, Add, Button, x180 y345 w80 h40 gPausar, PAUSAR
Gui, Add, Button, x270 y345 w80 h40 gParar, PARAR
Gui, Add, Button, x360 y345 w100 h40 gCarregarProxies, CARREGAR PROXIES
Gui, Add, Button, x470 y345 w100 h40 gTestarProxy, TESTAR PROXY
Gui, Add, Button, x580 y345 w100 h40 gAjuda, AJUDA

; Log de atividades
Gui, Add, GroupBox, x20 y395 w420 h180 cCyan, Log de Atividades
Gui, Add, Edit, x30 y415 w400 h150 vLogEdit ReadOnly HScroll -Wrap

; Status
Gui, Add, GroupBox, x450 y395 w230 h180 cCyan, Status
Gui, Add, Text, x465 y420 w200 h20 BackgroundTrans, Videos assistidos:
Gui, Add, Text, x465 y440 w200 h30 vStatusVideos cLime BackgroundTrans, 0 / 0

Gui, Add, Text, x465 y480 w200 h20 BackgroundTrans, Tempo total:
Gui, Add, Text, x465 y500 w200 h30 vStatusTempo cLime BackgroundTrans, 0h 0m 0s

Gui, Add, Text, x465 y540 w200 h20 BackgroundTrans, Status:
Gui, Add, Text, x465 y560 w200 h20 vStatusAtual cYellow BackgroundTrans, Aguardando...

; Rodape
Gui, Add, Text, x20 y585 w660 h20 Center cGray BackgroundTrans, F12 = Pausar/Retomar | ESC = Encerrar | Baseado no YtbView5.1

Gui, Show, w700 h610, YouTube Viewer PRO v2.0

; Criar pastas necessarias
CriarEstrutura()

; Carregar proxies automaticamente
CarregarProxiesAutomatico()

return

; ============================================================
; FUNCOES DE INICIALIZACAO
; ============================================================

CriarEstrutura()
{
    global PastaScript, PastaExtensions
    
    PastaExtensions := PastaScript . "\proxy_extensions"
    
    ; Criar pasta de extensoes se nao existir
    if !FileExist(PastaExtensions)
        FileCreateDir, %PastaExtensions%
    
    ; Criar arquivo proxy.txt se nao existir
    ArquivoProxy := PastaScript . "\proxy.txt"
    if !FileExist(ArquivoProxy)
    {
        ProxiesPadrao := "194.38.19.174:6736:nypkwabo:b9l2ztpk81vl`n"
        . "45.87.50.25:7085:nypkwabo:b9l2ztpk81vl`n"
        . "91.123.8.35:6575:nypkwabo:b9l2ztpk81vl`n"
        . "85.198.45.204:6128:nypkwabo:b9l2ztpk81vl`n"
        . "92.113.244.43:5730:nypkwabo:b9l2ztpk81vl`n"
        
        FileAppend, %ProxiesPadrao%, %ArquivoProxy%
    }
}

CarregarProxiesAutomatico()
{
    global PastaScript, ListaProxies, TotalProxies
    
    ArquivoProxy := PastaScript . "\proxy.txt"
    
    ; Verificar se existe o arquivo
    if !FileExist(ArquivoProxy)
    {
        AdicionarLog("⚠️ Arquivo proxy.txt nao encontrado")
        AdicionarLog("📝 Clique em CARREGAR PROXIES para selecionar")
        return
    }
    
    ; Ler arquivo de proxies
    ListaProxies := []
    TotalProxies := 0
    
    Loop, Read, %ArquivoProxy%
    {
        Linha := Trim(A_LoopReadLine)
        if (Linha = "")
            continue
        
        ; Formato: IP:PORTA:USUARIO:SENHA
        Partes := StrSplit(Linha, ":")
        if (Partes.Length() >= 4)
        {
            IP := Partes[1]
            Porta := Partes[2]
            Usuario := Partes[3]
            Senha := Partes[4]
            
            ListaProxies.Push({IP: IP, Porta: Porta, Usuario: Usuario, Senha: Senha})
            TotalProxies++
        }
    }
    
    if (TotalProxies > 0)
    {
        GuiControl,, StatusProxies, %TotalProxies%
        AdicionarLog("✅ " . TotalProxies . " proxies carregados!")
    }
    else
    {
        AdicionarLog("❌ Nenhum proxy valido encontrado")
    }
}

; ============================================================
; FUNCOES DA INTERFACE
; ============================================================

AdicionarLog(Texto)
{
    FormatTime, Hora,, HH:mm:ss
    GuiControlGet, LogAtual,, LogEdit
    NovaLinha := "[" . Hora . "] " . Texto . "`r`n"
    GuiControl,, LogEdit, % NovaLinha . LogAtual
    ControlSend, Edit1, ^{Home}, YouTube Viewer PRO v2.0
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
        GuiControl,, StatusAtual, ▶️ Executando...
    else if (Pausado)
        GuiControl,, StatusAtual, ⏸️ Pausado
    else
        GuiControl,, StatusAtual, ⏹️ Parado
}

; ============================================================
; CRIAR EXTENSAO DE PROXY
; ============================================================

CriarExtensaoProxy(Proxy)
{
    global PastaExtensions
    
    ; Nome unico para a extensao
    NomeExtensao := "proxy_" . Proxy.IP . "_" . Proxy.Porta
    PastaExtensao := PastaExtensions . "\" . NomeExtensao
    
    ; Criar pasta da extensao
    if !FileExist(PastaExtensao)
        FileCreateDir, %PastaExtensao%
    
    ; Criar manifest.json
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
    
    ; Criar background.js
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
    
    ; Copiar para pasta do script
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
    
    ; Escolher proxy aleatorio
    Random, Indice, 1, TotalProxies
    Proxy := ListaProxies[Indice]
    
    AdicionarLog("🧪 Testando proxy: " . Proxy.IP . ":" . Proxy.Porta)
    
    ; Criar extensao
    PastaExtensao := CriarExtensaoProxy(Proxy)
    
    ; Abrir Edge com a extensao
    Comando := "msedge.exe --load-extension=""" . PastaExtensao . """ https://whatismyipaddress.com"
    Run, %Comando%
    
    AdicionarLog("✅ Edge aberto com proxy!")
    AdicionarLog("📌 Verifique o IP no site aberto")
return

Ajuda:
    MsgBox, 64, Ajuda - YouTube Viewer PRO v2.0,
    (
    COMO USAR:

    1. Carregue os proxies (botao CARREGAR PROXIES)
       ou coloque o arquivo proxy.txt na pasta do script

    2. Cole o link do video do YouTube

    3. Configure quantidade e tempo

    4. Clique em INICIAR

    FORMATO DO PROXY.TXT:
    IP:PORTA:USUARIO:SENHA
    Ex: 192.168.1.1:8080:user:pass

    FUNCIONALIDADES:
    - Troca de IP automatica
    - Roda no Edge (voce usa o Chrome)
    - 100 proxies disponiveis
    - Comportamento humanizado

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
    
    ; Validar link
    if (InStr(LinkYouTube, "youtube.com") = 0 and InStr(LinkYouTube, "youtu.be") = 0)
    {
        MsgBox, 16, Erro, Insira um link valido do YouTube!
        return
    }
    
    ; Validar quantidade
    Quantidade := Quantidade + 0
    if (Quantidade < 1)
        Quantidade := 1
    if (Quantidade > 1000)
        Quantidade := 1000
    
    ; Salvar configuracoes
    ConfigMinTempo := MinTempo + 0
    ConfigMaxTempo := MaxTempo + 0
    ConfigTrocarProxy := TrocarProxy + 0
    ConfigUsarProxy := UsarProxy
    
    ; Verificar proxies
    if (ConfigUsarProxy and TotalProxies = 0)
    {
        MsgBox, 48, Aviso, Proxies nao carregados!`n`nDeseja continuar sem proxy?
        IfMsgBox, No
            return
        ConfigUsarProxy := false
    }
    
    ; Iniciar
    Rodando := true
    Pausado := false
    Parar := false
    TotalVideos := Quantidade
    VideosAssistidos := 0
    TempoTotal := 0
    ProxyAtual := 0
    
    AdicionarLog("🚀 Iniciando...")
    AdicionarLog("📺 Link: " . LinkYouTube)
    AdicionarLog("📊 Quantidade: " . Quantidade . " videos")
    
    if (ConfigUsarProxy)
        AdicionarLog("🌐 Usando " . TotalProxies . " proxies")
    else
        AdicionarLog("⚠️ Sem proxy (IP original)")
    
    AtualizarStatus()
    
    ; Executar em background
    SetTimer, ExecutarScript, 100
return

Pausar:
    if (!Rodando)
        return
    
    Pausado := !Pausado
    
    if (Pausado)
    {
        AdicionarLog("⏸️ Script pausado")
        GuiControl,, StatusAtual, ⏸️ Pausado
    }
    else
    {
        AdicionarLog("▶️ Script retomado")
        GuiControl,, StatusAtual, ▶️ Executando...
    }
return

Parar:
    if (!Rodando)
        return
    
    Parar := true
    Rodando := false
    Pausado := false
    
    AdicionarLog("⏹️ Script parado pelo usuario")
    
    ; Fechar Edge se estiver aberto
    if (EdgeID != "" and WinExist("ahk_id " EdgeID))
        WinClose, ahk_id %EdgeID%
    
    AtualizarStatus()
return

; ============================================================
; EXECUCAO PRINCIPAL
; ============================================================

ExecutarScript:
    SetTimer, ExecutarScript, Off
    
    ; Escolher primeiro proxy
    if (ConfigUsarProxy and TotalProxies > 0)
    {
        Random, ProxyAtual, 1, TotalProxies
        Proxy := ListaProxies[ProxyAtual]
        
        AdicionarLog("🌐 Proxy: " . Proxy.IP . ":" . Proxy.Porta)
        GuiControl,, ProxyInfo, % Proxy.IP . ":" . Proxy.Porta
        
        ; Criar extensao
        PastaExtensao := CriarExtensaoProxy(Proxy)
        
        ; Abrir Edge com extensao
        Comando := "msedge.exe --load-extension=""" . PastaExtensao . """ -inprivate """ . LinkYouTube . """"
    }
    else
    {
        ; Abrir Edge sem proxy
        Comando := "msedge.exe -inprivate """ . LinkYouTube . """"
    }
    
    AdicionarLog("🌐 Abrindo Microsoft Edge...")
    
    Run, %Comando%, , , EdgePID
    Sleep, 6000
    
    WinWait, ahk_class Chrome_WidgetWin_1,, 20
    WinGet, ListaIDs, List, ahk_class Chrome_WidgetWin_1
    Loop, %ListaIDs%
    {
        WinGet, Proc, ProcessName, % "ahk_id " ListaIDs%A_Index%
        if (Proc = "msedge.exe")
        {
            EdgeID := ListaIDs%A_Index%
            break
        }
    }
    
    if (EdgeID = "")
    {
        AdicionarLog("❌ Erro: Edge nao abriu!")
        Rodando := false
        AtualizarStatus()
        return
    }
    
    AdicionarLog("✅ Edge aberto com sucesso!")
    
    ; Loop principal
    Loop, %TotalVideos%
    {
        if (Parar or !Rodando)
            break
        
        ; Verificar pausa
        while (Pausado and Rodando)
        {
            Sleep, 500
            if (Parar)
                break
        }
        
        if (Parar or !Rodando)
            break
        
        ; Verificar se Edge ainda existe
        if !WinExist("ahk_id " EdgeID)
        {
            AdicionarLog("❌ Edge foi fechado!")
            break
        }
        
        VideoAtual := A_Index
        
        ; Tempo aleatorio
        Random, Tempo, ConfigMinTempo, ConfigMaxTempo
        
        ; Detectar tipo
        Tipo := "normal"
        if (InStr(LinkYouTube, "shorts"))
            Tipo := "shorts"
        
        AdicionarLog("🎬 Video " . VideoAtual . "/" . TotalVideos . " - " . Tempo . "s")
        
        ; Assistir video
        if (Tipo = "shorts")
            AssistirShorts(Tempo)
        else
            AssistirVideo(Tempo)
        
        VideosAssistidos++
        TempoTotal += Tempo
        AtualizarStatus()
        
        ; Trocar proxy periodicamente
        if (Mod(VideoAtual, ConfigTrocarProxy) = 0) and (ConfigUsarProxy) and (TotalProxies > 0)
        {
            TrocarProxy()
        }
        
        ; Navegar para proximo
        if (VideoAtual < TotalVideos)
        {
            AdicionarLog("➡️ Proximo video...")
            NavegarProximo(Tipo)
        }
        
        Sleep, 2000
    }
    
    ; Finalizar
    Rodando := false
    AdicionarLog("✅ Concluido! " . VideosAssistidos . " videos assistidos")
    AtualizarStatus()
    
    MsgBox, 64, Concluido,
    (
    Videos assistidos: %VideosAssistidos%
    Tempo total: %TempoTotal% segundos
    
    Obrigado por usar YouTube Viewer PRO v2.0!
    )
return

; ============================================================
; TROCAR PROXY
; ============================================================

TrocarProxy()
{
    global ListaProxies, TotalProxies, ProxyAtual, EdgeID, LinkYouTube
    
    AdicionarLog("🔄 Trocando proxy...")
    
    ; Escolher novo proxy diferente
    Antigo := ProxyAtual
    Loop, 10
    {
        Random, ProxyAtual, 1, TotalProxies
        if (ProxyAtual != Antigo)
            break
    }
    
    Proxy := ListaProxies[ProxyAtual]
    
    AdicionarLog("🌐 Novo proxy: " . Proxy.IP . ":" . Proxy.Porta)
    GuiControl,, ProxyInfo, % Proxy.IP . ":" . Proxy.Porta
    
    ; Criar nova extensao
    PastaExtensao := CriarExtensaoProxy(Proxy)
    
    ; Fechar Edge atual
    WinClose, ahk_id %EdgeID%
    Sleep, 2000
    
    ; Abrir novo Edge com novo proxy
    Comando := "msedge.exe --load-extension=""" . PastaExtensao . """ -inprivate """ . LinkYouTube . """"
    Run, %Comando%, , , EdgePID
    Sleep, 5000
    
    WinWait, ahk_class Chrome_WidgetWin_1,, 15
    WinGet, ListaIDs, List, ahk_class Chrome_WidgetWin_1
    Loop, %ListaIDs%
    {
        WinGet, Proc, ProcessName, % "ahk_id " ListaIDs%A_Index%
        if (Proc = "msedge.exe")
        {
            EdgeID := ListaIDs%A_Index%
            break
        }
    }
    
    AdicionarLog("✅ IP trocado com sucesso!")
}

; ============================================================
; FUNCOES DE VISUALIZACAO
; ============================================================

AssistirVideo(Segundos)
{
    global EdgeID, Pausado, Parar, Rodando
    Restante := Segundos
    
    Random, Espera, 2000, 4000
    Sleep, %Espera%
    Restante -= 3
    
    Loop
    {
        if (Parar or !Rodando)
            return
        
        while (Pausado and Rodando)
            Sleep, 500
        
        if !WinExist("ahk_id " EdgeID)
            return
        
        if (Restante < 10)
            break
        
        Random, Espera, 8, 15
        if (Espera > Restante)
            Espera := Restante
        
        Sleep, % Espera * 1000
        Restante -= Espera
        
        ; Acoes aleatorias
        Random, Acao, 1, 100
        
        if (Acao <= 20)
            ControlSend, , {PgDn}, ahk_id %EdgeID%
        else if (Acao <= 35)
        {
            ControlSend, , k, ahk_id %EdgeID%
            Random, Pausa, 1000, 3000
            Sleep, %Pausa%
            ControlSend, , k, ahk_id %EdgeID%
        }
        else if (Acao <= 50)
        {
            Random, Vezes, 1, 3
            Loop, %Vezes%
            {
                ControlSend, , {Left}, ahk_id %EdgeID%
                Sleep, 200
            }
        }
        else if (Acao <= 60)
            ControlSend, , {Right}, ahk_id %EdgeID%
        
        Sleep, 300
    }
    
    if (Restante > 0)
        Sleep, % Restante * 1000
}

AssistirShorts(Segundos)
{
    global EdgeID, Pausado, Parar, Rodando
    Restante := Segundos
    
    Random, Espera, 2000, 3000
    Sleep, %Espera%
    Restante -= 3
    
    Loop
    {
        if (Parar or !Rodando)
            return
        
        while (Pausado and Rodando)
            Sleep, 500
        
        if !WinExist("ahk_id " EdgeID)
            return
        
        if (Restante < 5)
            break
        
        Random, Espera, 5, 12
        if (Espera > Restante)
            Espera := Restante
        
        Sleep, % Espera * 1000
        Restante -= Espera
        
        Random, Acao, 1, 100
        
        if (Acao <= 30)
        {
            ControlSend, , k, ahk_id %EdgeID%
            Random, Pausa, 800, 2000
            Sleep, %Pausa%
            ControlSend, , k, ahk_id %EdgeID%
        }
        else if (Acao <= 60)
            ControlSend, , {Down}, ahk_id %EdgeID%
        else if (Acao <= 90)
            ControlSend, , {Up}, ahk_id %EdgeID%
        
        Sleep, 200
    }
    
    if (Restante > 0)
        Sleep, % Restante * 1000
}

NavegarProximo(Tipo)
{
    global EdgeID
    
    if (Tipo = "shorts")
    {
        ControlSend, , {Down}, ahk_id %EdgeID%
        Sleep, 500
        ControlSend, , {Down}, ahk_id %EdgeID%
    }
    else
    {
        Random, Scrolls, 2, 4
        Loop, %Scrolls%
        {
            ControlSend, , {PgDn}, ahk_id %EdgeID%
            Sleep, 400
        }
        
        Sleep, 1000
        
        Random, Tabs, 4, 8
        Loop, %Tabs%
        {
            ControlSend, , {Tab}, ahk_id %EdgeID%
            Sleep, 100
        }
        
        Sleep, 500
        ControlSend, , {Enter}, ahk_id %EdgeID%
    }
    
    Sleep, 2000
}

; ============================================================
; ATALHOS DE TECLADO
; ============================================================

F12::
    Gosub, Pausar
return

Esc::
    if (Rodando)
    {
        MsgBox, 4, Sair, O script esta rodando. Deseja parar e sair?
        IfMsgBox, Yes
        {
            Parar := true
            Rodando := false
            if (EdgeID != "" and WinExist("ahk_id " EdgeID))
                WinClose, ahk_id %EdgeID%
            ExitApp
        }
    }
    else
        ExitApp
return

GuiClose:
    if (Rodando)
    {
        MsgBox, 4, Sair, O script esta rodando. Deseja parar e sair?
        IfMsgBox, Yes
        {
            Parar := true
            if (EdgeID != "" and WinExist("ahk_id " EdgeID))
                WinClose, ahk_id %EdgeID%
            ExitApp
        }
        return
    }
    ExitApp
return
