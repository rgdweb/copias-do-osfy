; Cria a extensão que BLOQUEIA o pop-up de senha do navegador
CriarExt(Prx) {
    global PastaExt
    
    ; TRANSFORMA OBJETO EM VARIÁVEIS SIMPLES (Resolve o erro do ponto)
    pIP := Prx.IP
    pPort := Prx.Port
    pUser := Prx.User
    pPass := Prx.Pass
    
    Dir := PastaExt . "\" . pIP
    if !FileExist(Dir)
        FileCreateDir, %Dir%
    
    ; Manifest.json atualizado para não pedir senha
    M =
    (
    {
      "version": "1.0.0",
      "manifest_version": 3,
      "name": "Proxy Auth Bypass",
      "permissions": ["proxy", "webRequest", "webRequestAuthProvider"],
      "host_permissions": ["<all_urls>"],
      "background": {
        "service_worker": "background.js"
      }
    }
    )
    FileDelete, %Dir%\manifest.json
    FileAppend, %M%, %Dir%\manifest.json
    
    ; background.js que injeta a senha direto na requisição
    B =
    (
    chrome.proxy.settings.set({
      value: {
        mode: "fixed_servers",
        rules: {
          singleProxy: {
            scheme: "http",
            host: "%pIP%",
            port: %pPort%
          }
        }
      },
      scope: "regular"
    });

    chrome.webRequest.onAuthRequired.addListener(
      function(details, callback) {
        callback({
          authCredentials: {
            username: "%pUser%",
            password: "%pPass%"
          }
        });
      },
      {urls: ["<all_urls>"]},
      ["asyncBlocking"]
    );
    )
    FileDelete, %Dir%\background.js
    FileAppend, %B%, %Dir%\background.js
    return Dir
}