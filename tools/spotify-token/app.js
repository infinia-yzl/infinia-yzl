// Runs entirely in the browser. The only network request goes to the Spotify token endpoint.
// Nothing is stored except a random one-time nonce in sessionStorage, which is deleted on return from Spotify.

const REDIRECT_URI = "http://127.0.0.1:8888/callback"
// top mode of the music plugin only reads /me/top/tracks
const SCOPE = "user-top-read"
const NONCE_KEY = "spotify-token-nonce"

const message = document.getElementById("message")

function show(text, error = false) {
  message.textContent = text
  message.classList.toggle("error", error)
}

// Step 1: send the browser to the Spotify consent page
function start() {
  const input = document.getElementById("client-id")
  const button = document.getElementById("connect")
  button.addEventListener("click", () => {
    const clientId = input.value.trim()
    if (!/^[0-9a-f]{32}$/i.test(clientId)) {
      show("The Client ID should be 32 hexadecimal characters.", true)
      return
    }
    const nonce = crypto.randomUUID()
    sessionStorage.setItem(NONCE_KEY, nonce)
    const url = new URL("https://accounts.spotify.com/authorize")
    url.search = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      scope: SCOPE,
      redirect_uri: REDIRECT_URI,
      // The Client ID travels in state, so it does not need to be pasted again on return
      state: `${nonce}.${clientId}`,
      show_dialog: "true",
    })
    location.assign(url)
  })
}

// Step 2: check the callback, then exchange the code for a refresh token
function callback() {
  const params = new URLSearchParams(location.search)
  // Remove the code from the address bar and history straight away
  history.replaceState(null, "", location.pathname)
  const expected = sessionStorage.getItem(NONCE_KEY)
  sessionStorage.removeItem(NONCE_KEY)

  const fail = text => {
    show(text, true)
    document.getElementById("restart").hidden = false
  }
  if (params.has("error")) {
    return fail(`Spotify returned an error: ${params.get("error")}.`)
  }
  const code = params.get("code")
  const [nonce, clientId] = (params.get("state") ?? "").split(".")
  if (!code) {
    return fail("This page has no approval code. The page may have been reloaded.")
  }
  if (!expected || nonce !== expected) {
    return fail("The request did not start from this page, so it was rejected.")
  }

  const exchange = document.getElementById("exchange")
  const secretInput = document.getElementById("client-secret")
  const button = document.getElementById("get-token")
  exchange.hidden = false
  secretInput.focus()

  button.addEventListener("click", async () => {
    const clientSecret = secretInput.value.trim()
    if (!clientSecret) {
      show("Paste the Client secret first.", true)
      return
    }
    button.disabled = true
    show("Requesting the refresh token from Spotify...")
    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: REDIRECT_URI,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.refresh_token) {
        throw new Error(data.error_description ?? data.error ?? `HTTP ${response.status}`)
      }
      secretInput.value = ""
      exchange.hidden = true
      document.getElementById("secret-value").value = `${clientId},${clientSecret},${data.refresh_token}`
      document.getElementById("result").hidden = false
      show("")
    }
    catch (error) {
      // An approval code works only once, so a failed exchange needs a new approval
      fail(`Spotify rejected the request: ${error.message}. Check the Client secret and start again.`)
    }
  })

  document.getElementById("copy").addEventListener("click", async () => {
    await navigator.clipboard.writeText(document.getElementById("secret-value").value)
    show("Copied.")
  })
}

if (document.getElementById("connect")) {
  start()
}
else {
  callback()
}
