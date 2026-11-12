import { useEffect, useState } from 'react'

// Friendly note while the server is slow to answer. The free Render server goes to sleep and needs up to a minute
// to wake up, so without this the page just looks empty or stuck. api.js sends the 'api:slow' event.
export default function ServerWaking() {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const onSlow = (e) => setSlow(Boolean(e.detail))
    window.addEventListener('api:slow', onSlow)
    return () => window.removeEventListener('api:slow', onSlow)
  }, [])
  if (!slow) return null
  return (
    <div className="server-waking" role="status" aria-live="polite">
      <span className="server-waking-dot" aria-hidden="true" />
      <p><b>Waking up the server…</b> This can take up to a minute the first time. Please wait, no need to refresh.</p>
    </div>
  )
}
