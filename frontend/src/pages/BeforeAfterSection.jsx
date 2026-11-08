import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BEFORE_AFTER_CASES } from '../beforeAfterCases'
import { SERVICE_CATEGORIES } from '../serviceCategories'

function CaseCard({ item, service }) {
  const [showAfter, setShowAfter] = useState(false)
  const side = showAfter ? 'after' : 'before'
  const bookTo = service ? `/book?service=${service.id}` : '/book'

  return (
    <article className="ba-card">
      <div className="ba-frame">
        {['before', 'after'].map((which) => (
          <img
            key={which}
            className={`ba-img${side === which ? ' is-active' : ''}`}
            src={item[which]}
            alt={side === which ? `${item.service}: ${which} treatment${item.sample ? ' (sample image)' : ''}` : ''}
            aria-hidden={side !== which}
            loading="lazy"
            draggable="false"
          />
        ))}
        <span className="ba-label" aria-live="polite">{side}</span>
        {item.sample && <span className="ba-sample">Sample</span>}
      </div>
      <div className="ba-body">
        <div className="ba-dots" role="group" aria-label={`${item.service} photo view`}>
          <button type="button" className={!showAfter ? 'on' : ''} onClick={() => setShowAfter(false)} aria-pressed={!showAfter}>Before</button>
          <button type="button" className={showAfter ? 'on' : ''} onClick={() => setShowAfter(true)} aria-pressed={showAfter}>After</button>
        </div>
        <h3>{item.service}</h3>
        <p>{item.note}</p>
        <Link className="btn ba-book" to={bookTo}>Book this service <span aria-hidden="true">→</span></Link>
      </div>
    </article>
  )
}

export default function BeforeAfterSection({ services = [] }) {
  const categories = SERVICE_CATEGORIES.filter((category) => BEFORE_AFTER_CASES.some((item) => item.category === category))
  const [category, setCategory] = useState(categories[0])
  // Only the services in the selected category show up; the arrows browse through them
  const cases = BEFORE_AFTER_CASES.filter((item) => item.category === category)
  const trackRef = useRef(null)
  const findService = (name) => services.find((s) => s.name.toLowerCase() === name.toLowerCase())

  const smooth = () => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth')

  const goTo = useCallback((index) => {
    const track = trackRef.current
    const card = track?.children[index]
    if (!card) return
    track.scrollTo({ left: card.offsetLeft, behavior: smooth() })
  }, [])

  const step = (direction) => {
    const track = trackRef.current
    if (!track) return
    const cards = Array.from(track.children)
    const atStart = track.scrollLeft <= 2
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2
    if (direction > 0 && atEnd) return goTo(0) // loop back to the first service
    if (direction < 0 && atStart) { // loop to the last service
      track.scrollTo({ left: track.scrollWidth, behavior: smooth() })
      return
    }
    // Move one full "page" at a time: as many cards as are visible (3 on desktop, 2 on tablet, 1 on phone)
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0
    const perPage = Math.max(1, Math.round((track.clientWidth + gap) / (cards[0].offsetWidth + gap)))
    const current = Math.max(0, cards.findIndex((card) => card.offsetLeft >= track.scrollLeft - 2))
    goTo(Math.min(Math.max(current + direction * perPage, 0), cards.length - 1))
  }

  const onKeyDown = (event) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1) }
    if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1) }
  }

  return (
    <section className="landing-section before-after-section" id="before-after" aria-labelledby="before-after-heading">
      <div className="section-heading section-heading-row">
        <div>
          <span className="eyebrow">Smile transformations</span>
          <h2 id="before-after-heading">Before &amp; After</h2>
        </div>
        <p>See the difference our services can make. Pick a category, use the arrows to browse its services, then tap Before or After on a card.</p>
      </div>
      <div className="ba-tabs" role="group" aria-label="Service categories">
        {categories.map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={category === name}
            className={category === name ? 'on' : ''}
            onClick={() => setCategory(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="ba-carousel">
        <button type="button" className="ba-nav ba-nav-prev" onClick={() => step(-1)} aria-label="Previous services">
          <span aria-hidden="true">‹</span>
        </button>
        <div
          key={category}
          className="ba-track"
          ref={trackRef}
          onKeyDown={onKeyDown}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="Before and after photos by service"
        >
          {cases.map((item) => (
            <CaseCard key={item.service} item={item} service={findService(item.service)} />
          ))}
        </div>
        <button type="button" className="ba-nav ba-nav-next" onClick={() => step(1)} aria-label="Next services">
          <span aria-hidden="true">›</span>
        </button>
      </div>
      <p className="ba-disclaimer">Individual results may vary depending on each patient&apos;s case.</p>
    </section>
  )
}
