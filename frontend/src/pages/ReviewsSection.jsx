import { useEffect, useState } from 'react'
import api, { errMsg } from '../api'
import { useAuth } from '../App'
import { useToast } from '../Toast'

function Star({ filled }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3.6 14.5 9l6 .7-4.5 4.1 1.3 5.8L12 16.8 6.7 19.6 8 13.8 3.5 9.7l6-.7L12 3.6Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Stars({ value, onChange, interactive = false }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <div className="star-rating" role={interactive ? 'radiogroup' : 'img'} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        interactive ? (
          <button
            key={n}
            type="button"
            className={`star-btn${shown >= n ? ' on' : ''}`}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
            aria-checked={value === n}
            role="radio"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            onClick={() => onChange(n)}
          >
            <Star filled={shown >= n} />
          </button>
        ) : (
          <span key={n} className={`star-static${value >= n ? ' on' : ''}`}><Star filled={value >= n} /></span>
        )
      ))}
    </div>
  )
}

export default function ReviewsSection({ services }) {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    name: user?.name || '',
    service_id: '',
    rating: 0,
    comment: '',
  })

  useEffect(() => {
    if (user?.name) setForm((current) => ({ ...current, name: current.name || user.name }))
  }, [user])

  useEffect(() => {
    api.get('/reviews')
      .then((response) => setReviews(response.data))
      .catch((error) => setLoadError(errMsg(error)))
      .finally(() => setLoading(false))
  }, [])

  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value })
    setFormError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.rating) {
      setFormError('Please choose a star rating.')
      return
    }
    setBusy(true)
    setFormError('')
    try {
      const { data } = await api.post('/reviews', form)
      setReviews((current) => [data, ...current])
      setForm({ name: user?.name || '', service_id: '', rating: 0, comment: '' })
      addToast('success', 'Thank you — your review is now on the page.')
    } catch (error) {
      setFormError(errMsg(error))
    }
    setBusy(false)
  }

  return (
    <section className="landing-section reviews-section" id="reviews" aria-labelledby="reviews-heading">
      <div className="section-heading section-heading-row">
        <div>
          <span className="eyebrow">What patients say</span>
          <h2 id="reviews-heading">Reviews on our services</h2>
        </div>
        <p>Share a star rating and a short note about the care you received.</p>
      </div>
      <div className="reviews-layout">
        <form className="feedback-card" onSubmit={submit}>
          <h3>Leave a review</h3>
          {formError && <p className="field-error" role="alert">{formError}</p>}
          {!user && (
            <label>Your name
              <input value={form.name} onChange={set('name')} placeholder="e.g. Jamie Santos" required maxLength={100} />
            </label>
          )}
          {user && <p className="review-as">Posting as <b>{user.name}</b></p>}
          <label>Service
            <select value={form.service_id} onChange={set('service_id')} required>
              <option value="">-- choose a service --</option>
              {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
            </select>
          </label>
          <fieldset className="rating-fieldset">
            <legend>Star rating</legend>
            <Stars value={form.rating} onChange={(rating) => { setForm({ ...form, rating }); setFormError('') }} interactive />
          </fieldset>
          <label>Your review
            <textarea
              value={form.comment}
              onChange={set('comment')}
              placeholder="How was your visit and this service?"
              required
              minLength={8}
              maxLength={800}
              rows={4}
            />
          </label>
          <button className="btn" disabled={busy}>{busy ? 'Sending...' : 'Submit review'}</button>
        </form>
        <div className="review-list" aria-live="polite">
          {loading && <p className="muted" role="status">Loading reviews...</p>}
          {loadError && <p className="error" role="alert">Could not load reviews: {loadError}</p>}
          {!loading && !loadError && reviews.length === 0 && <p className="muted">Be the first to review a service.</p>}
          {reviews.map((review) => (
            <article className="review-card" key={review.id}>
              <div className="review-card-top">
                <div>
                  <b>{review.name}</b>
                  <span>{review.service?.name || 'Service'}</span>
                </div>
                <Stars value={review.rating} />
              </div>
              <p>{review.comment}</p>
              <small className="muted">{new Date(review.created_at).toLocaleDateString()}</small>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
