
    chrome.runtime.onStartup.addListener(() => {
      chrome.proxy.settings.set(
        {
          value: {
            mode: "fixed_servers",
            rules: {
              singleProxy: {
                scheme: "http",
                host: "45.91.167.127",
                port: 6686
              },
              bypassList: ["localhost"]
            }
          },
          scope: "regular"
        },
        () => {}
      );
    });

    chrome.webRequest.onAuthRequired.addListener(
      (details) => {
        return {
          authCredentials: {
            username: "nypkwabo",
            password: "b9l2ztpk81vl"
          }
        };
      },
      {urls: ["<all_urls>"]},
      ["blocking"]
    );
    