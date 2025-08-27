function googleLogin(callback) {
  //@ts-ignore
  if (!window.googlelogincallbacks) {
    //@ts-ignore
    window.googlelogincallbacks = [];
    //@ts-ignore
  }

  if (callback) {
    //@ts-ignore
    window.googlelogincallbacks.push(callback);
  }

  const buttonWrapper = document.createElement("div");
  buttonWrapper.id = "google-login-button-wrapper";

  buttonWrapper.style.display = "none";
  document.body.appendChild(buttonWrapper);
  // @ts-ignore
  google.accounts.id.renderButton(buttonWrapper, {
    theme: "outline",
    size: "large",
    click_listener: (e) => {
      console.log(e);
    },
  });
  // @ts-ignore
  document
    .querySelector('#google-login-button-wrapper div[role="button"]')
    // @ts-ignore
    .click();
  document.body.removeChild(buttonWrapper);
}

function initGoogle() {
    google.accounts.id.initialize({
        client_id: PUBLIC_GOOGLE_CLIENT_ID,
        callback: (e) => {
            const token = e.credential

            fetch("/login", {
                method: "POST",
                body: JSON.stringify({ token })
            }).then(() => {
                window.location.reload()
            })
        },
        });
}
