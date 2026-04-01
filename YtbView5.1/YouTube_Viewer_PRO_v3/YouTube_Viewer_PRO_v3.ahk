;==============================================================
; YOUTUBE VIEWER PRO v3.0 - FUNCIONA DE VERDADE
;==============================================================
;
; Este script FUNCIONA. Ponto final.
;
; Como usar:
; 1. Cole o link do video
; 2. Escolha quantidade e tempo
; 3. Clique INICIAR
;
; O script vai:
; - Abrir o Edge
; - Esperar o video rodar
; - Fechar e abrir o proximo
;
;==============================================================

#SingleInstance Force
#NoEnv
SetWorkingDir %A_ScriptDir%

; Variaveis
global Rodando := false
global Pausado := false
global Parar := false
global TotalVideos := 0
global VideosOK := 0
global TempoTotal := 0
global LinkVideo := ""
global MinTempo := 45
global MaxTempo := 120

; ============================================================
; INTERFACE
; ============================================================

Gui, Font, s12 cWhite, Arial
Gui, Color, 0x2C3E50

; Titulo
Gui, Add, Text, x0 y10 w600 h40 Center cWhite Background0x34495E, YOUTUBE VIEWER PRO v3.0

; Link
Gui, Font, s10
Gui, Add, Text, x20 y60 w560 h20 cWhite, Link do video do YouTube:
Gui, Add, Edit, x20 y85 w560 h30 vLinkVideo, https://www.youtube.com/watch?v=

; Configuracoes
Gui, Add, Text, x20 y130 w180 h20 cWhite, Quantidade de visualizacoes:
Gui, Add, Edit, x200 y127 w80 h30 vQtd Center, 10

Gui, Add, Text, x20 y165 w180 h20 cWhite, Tempo minimo (segundos):
Gui, Add, Edit, x200 y162 w80 h30 vMinTempo Center, 45

Gui, Add, Text, x20 y200 w180 h20 cWhite, Tempo maximo (segundos):
Gui, Add, Edit, x200 y197 w80 h30 vMaxTempo Center, 120

; Botoes
Gui, Font, s11 Bold
Gui, Add, Button, x20 y245 w140 h50 gIniciar Background0x27AE60, INICIAR
Gui, Add, Button, x170 y245 w100 h50 gPausar Background0xF39C12, PAUSAR
Gui, Add, Button, x280 y245 w100 h50 gParar Background0xE74C3C, PARAR

; Status
Gui, Font, s10 Normal
Gui, Add, GroupBox, x400 y130 w180 h170 cWhite, STATUS
Gui, Add, Text, x415 y155 w150 h20 cWhite, Videos concluidos:
Gui, Add, Text, x415 y175 w150 h30 vStatusVideos cLime, 0 / 0
Gui, Add, Text, x415 y210 w150 h20 cWhite, Tempo total:
Gui, Add, Text, x415 y230 w150 h30 vStatusTempo cLime, 0 min
Gui, Add, Text, x415 y265 w150 h20 cWhite, Situacao:
Gui, Add, Text, x415 y285 w150 h20 vStatusSituacao cYellow, Aguardando...

; Log
Gui, Add, GroupBox, x20 y310 w560 h180 cWhite, LOG
Gui, Add, Edit, x30 y330 w540 h150 vLogEdit ReadOnly

Gui, Show, w600 h510, YouTube Viewer PRO v3.0
return

; ============================================================
; FUNCOES
; ============================================================

Log(Msg)
{
    FormatTime, Hora,, HH:mm:ss
    GuiControlGet, Atual,, LogEdit
    Novo := "[" . Hora . "] " . Msg . "`r`n" . Atual
    GuiControl,, LogEdit, %Novo%
}

Atualizar()
{
    global VideosOK, TotalVideos, TempoTotal
    GuiControl,, StatusVideos, %VideosOK% / %TotalVideos%
    Min := TempoTotal // 60
    GuiControl,, StatusTempo, %Min% min
}

; ============================================================
; BOTOES
; ============================================================

Iniciar:
    if (Rodando)
    {
        MsgBox, 48, Aviso, Ja esta rodando!
        return
    }
    
    Gui, Submit, NoHide
    
    ; Validar link
    if (InStr(LinkVideo, "youtube.com") = 0 and InStr(LinkVideo, "youtu.be") = 0)
    {
        MsgBox, 16, Erro, Coloque um link do YouTube!
        return
    }
    
    ; Validar quantidade
    TotalVideos := Qtd + 0
    if (TotalVideos < 1)
        TotalVideos := 1
    if (TotalVideos > 100)
        TotalVideos := 100
    
    MinTempo := MinTempo + 0
    if (MinTempo < 10)
        MinTempo := 10
    
    MaxTempo := MaxTempo + 0
    if (MaxTempo < MinTempo)
        MaxTempo := MinTempo + 30
    
    ; Iniciar
    Rodando := true
    Pausado := false
    Parar := false
    VideosOK := 0
    TempoTotal := 0
    
    Log("==================== INICIANDO ====================")
    Log("Videos: " . TotalVideos)
    Log("Tempo: " . MinTempo . " a " . MaxTempo . " segundos")
    Log("Link: " . LinkVideo)
    
    GuiControl,, StatusSituacao, Rodando...
    Atualizar()
    
    Gosub, Executar
return

Pausar:
    if (!Rodando)
        return
    
    Pausado := !Pausado
    
    if (Pausado)
    {
        Log(">>> PAUSADO <<<")
        GuiControl,, StatusSituacao, Pausado
    }
    else
    {
        Log(">>> CONTINUANDO <<<")
        GuiControl,, StatusSituacao, Rodando...
    }
return

Parar:
    Log(">>> PARADO PELO USUARIO <<<")
    Parar := true
    Rodando := false
    Process, Close, msedge.exe
    GuiControl,, StatusSituacao, Parado
    Atualizar()
return

; ============================================================
; EXECUCAO PRINCIPAL
; ============================================================

Executar:

Loop, %TotalVideos%
{
    ; Verificar se deve parar
    if (Parar)
        break
    
    ; Verificar pausa
    while (Pausado and Rodando and !Parar)
        Sleep, 500
    
    if (Parar or !Rodando)
        break
    
    ; Numero do video atual
    Num := A_Index
    Log("")
    Log("========== VIDEO " . Num . " DE " . TotalVideos . " ==========")
    
    ; ============================================
    ; PASSO 1: Fechar qualquer Edge aberto
    ; ============================================
    Log("Fechando Edge anterior...")
    Process, Close, msedge.exe
    Sleep, 2000
    
    ; ============================================
    ; PASSO 2: Abrir Edge com o video
    ; ============================================
    Log("Abrindo Edge...")
    
    Run, msedge.exe "%LinkVideo%", , , EdgePID
    
    ; Esperar o Edge abrir
    Log("Aguardando Edge carregar...")
    Sleep, 6000
    
    ; ============================================
    ; PASSO 3: Verificar se abriu
    ; ============================================
    Process, Exist, msedge.exe
    
    if (ErrorLevel = 0)
    {
        Log("ERRO: Edge nao abriu! Tentando novamente...")
        Run, msedge.exe "%LinkVideo%", , , EdgePID
        Sleep, 6000
        
        Process, Exist, msedge.exe
        if (ErrorLevel = 0)
        {
            Log("ERRO: Edge nao abriu de novo! Pulando...")
            continue
        }
    }
    
    Log("Edge aberto com sucesso!")
    
    ; ============================================
    ; PASSO 4: Assistir o video
    ; ============================================
    Random, Tempo, MinTempo, MaxTempo
    Log("Assistindo por " . Tempo . " segundos...")
    
    SegundosPassados := 0
    
    ; Loop de contagem
    Loop, %Tempo%
    {
        ; Verificar pausa
        while (Pausado and Rodando and !Parar)
            Sleep, 500
        
        ; Verificar se parou
        if (Parar or !Rodando)
            break
        
        ; Verificar se Edge ainda existe
        Process, Exist, msedge.exe
        if (ErrorLevel = 0)
        {
            Log("ALERTA: Edge fechou antes do tempo!")
            break
        }
        
        ; Esperar 1 segundo
        Sleep, 1000
        SegundosPassados++
        
        ; Mostrar progresso a cada 15 segundos
        if (Mod(SegundosPassados, 15) = 0)
        {
            Restam := Tempo - SegundosPassados
            Log("Restam " . Restam . " segundos...")
        }
    }
    
    ; ============================================
    ; PASSO 5: Contar visualizacao
    ; ============================================
    if (SegundosPassados >= (Tempo * 0.7))
    {
        VideosOK++
        TempoTotal += SegundosPassados
        Log("Video " . VideosOK . " concluido! (" . SegundosPassados . "s)")
    }
    else
    {
        Log("Video nao foi totalmente assistido")
    }
    
    Atualizar()
    
    ; ============================================
    ; PASSO 6: Fechar Edge
    ; ============================================
    Log("Fechando Edge...")
    Process, Close, msedge.exe
    Sleep, 2000
    
    ; ============================================
    ; PASSO 7: Pausa antes do proximo
    ; ============================================
    if (Num < TotalVideos and !Parar and Rodando)
    {
        Log("Aguardando 3 segundos ate o proximo...")
        Sleep, 3000
    }
}

; ============================================
; FIM
; ============================================
Rodando := false
Process, Close, msedge.exe

Log("")
Log("==================== CONCLUIDO ====================")
Log("Videos assistidos: " . VideosOK)
Log("Tempo total: " . TempoTotal . " segundos")

GuiControl,, StatusSituacao, Concluido!
Atualizar()

MsgBox, 64, Concluido!, Videos assistidos: %VideosOK%`nTempo total: %TempoTotal% segundos
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
        MsgBox, 4, Sair, Deseja parar e sair?
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
