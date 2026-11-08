// Google / Facebook sign-in in the browser.
// Each function opens the provider's popup and returns an access token.
// The token is then sent to our backend (POST /auth/google or /auth/facebook), which checks it.

// Easiest way: paste your IDs between the quotes below. (They are public IDs, not secrets.)
// Or put them in frontend/.env as VITE_GOOGLE_CLIENT_ID and VITE_FACEBOOK_APP_ID and restart `npm run dev`.
// Never put the Facebook App Secret here. It belongs in backend/.env only.
const GOOGLE_CLIENT_ID_HERE = '168336598083-4omihq5ih0s8ppn7ho4572so8te8cshv.apps.googleusercontent.com'
const FACEBOOK_APP_ID_HERE = '1564828341996107'

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID_HERE).trim()
const FACEBOOK_APP_ID = (import.meta.env.VITE_FACEBOOK_APP_ID || FACEBOOK_APP_ID_HERE).trim()

export const socialConfigured = {
  google: Boolean(GOOGLE_CLIENT_ID),
  facebook: Boolean(FACEBOOK_APP_ID),
}

// The user closed the popup or said no. Not an error worth showing.
export class SocialCancelled extends Error {}

const scripts = {}
function loadScript(src) {
  if (!scripts[src]) {
    scripts[src] = new Promise((resolve, reject) => {
      const el = document.createElement('script')
      el.src = src
      el.async = true
      el.onload = resolve
      el.onerror = () => { delete scripts[src]; reject(new Error('script failed')) }
      document.head.appendChild(el)
    })
  }
  return scripts[src]
}

let googleReady = false
let facebookReady = false

// Load the provider scripts early (when the login page opens), so the popup can open
// right when the button is clicked. Browsers block popups that open after a delay.
export function preloadSocial() {
  if (GOOGLE_CLIENT_ID) {
    loadScript('https://accounts.google.com/gsi/client').then(() => { googleReady = true }).catch(() => {})
  }
  if (FACEBOOK_APP_ID) {
    window.fbAsyncInit = () => {
      window.FB.init({ appId: FACEBOOK_APP_ID, cookie: false, xfbml: false, version: 'v21.0' })
      facebookReady = true
    }
    loadScript('https://connect.facebook.net/en_US/sdk.js').catch(() => {})
  }
}

// Must be called straight from a click (no await before it), or the popup gets blocked.
export function getGoogleToken() {
  return new Promise((resolve, reject) => {
    if (!googleReady || !window.google?.accounts?.oauth2) {
      reject(new Error('Google is still loading. Please try again in a moment.'))
      return
    }
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: (response) => {
        if (response.access_token) resolve(response.access_token)
        else reject(new SocialCancelled())
      },
      error_callback: () => reject(new SocialCancelled()),
    })
    client.requestAccessToken({ prompt: 'select_account' })
  })
}

// Must be called straight from a click (no await before it), or the popup gets blocked.
export function getFacebookToken() {
  return new Promise((resolve, reject) => {
    if (!facebookReady || !window.FB) {
      reject(new Error('Facebook is still loading. Please try again in a moment.'))
      return
    }
    window.FB.login((response) => {
      if (response.authResponse?.accessToken) resolve(response.authResponse.accessToken)
      else reject(new SocialCancelled())
    }, { scope: 'public_profile,email' })
  })
}