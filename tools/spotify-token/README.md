# Spotify token renewal

Spotify refresh tokens expire six months after authorisation. When the Spotify image in the profile shows an error, or the Metrics workflow fails on the Spotify step, renew the `SPOTIFY_TOKENS` secret with this page.

The page runs only on your computer. It sends one request, to the Spotify token endpoint, and it stores nothing.

## One-time setup

In the [Spotify developer dashboard](https://developer.spotify.com/dashboard), open the app, tick **Web API**, and add this Redirect URI:

```
http://127.0.0.1:8888/callback
```

## Renewal

1. From the root of this repository, start the local page (Python 3.7 or newer):

   ```sh
   python3 -m http.server 8888 --bind 127.0.0.1 --directory tools/spotify-token
   ```

2. Open <http://127.0.0.1:8888/>.
3. Paste the **Client ID** from the dashboard and click **Continue to Spotify**.
4. Click **Agree** on Spotify. Spotify sends you back to the local page.
5. Paste the **Client secret** from the dashboard and click **Get refresh token**.
6. Click **Copy**, open the [`SPOTIFY_TOKENS` secret](https://github.com/infinia-yzl/infinia-yzl/settings/secrets/actions/SPOTIFY_TOKENS), paste the value and save.
7. Close the tab and stop the server with <kbd>Ctrl</kbd>+<kbd>C</kbd>.
8. Run the [Metrics workflow](https://github.com/infinia-yzl/infinia-yzl/actions/workflows/main.yml) and check the Spotify image.
