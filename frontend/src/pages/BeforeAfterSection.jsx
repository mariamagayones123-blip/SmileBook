import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BEFORE_AFTER_CASES } from '../beforeAfterCases'
import { SERVICE_CATEGORIES } from '../serviceCategories'

function CaseCard({ item, service }) {
  const [showAfter, setShowAfter] = useState(false)
  const side = showAfter ? 'after' : 'before'
  const toggle = () => setShowAfter((value) => !value)
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
        <button
          type="button"
          className={`ba-arrow ${showAfter ? 'ba-arrow-left' : 'ba-arrow-right'}`}
          onClick={toggle}
          aria-label={showAfter ? `Show before photo for ${item.service}` : `Show after photo for ${item.service}`}
        >
          <span aria-hidden="true">{showAfter ? '‹' : '›'}</span>
        </button>
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
  const findService = (name) => services.find((s) => s.name.toLowerCase() === name.toLowerCase())
  const visible = BEFORE_AFTER_CASES.filter((item) => item.category === category)

  return (
    <section className="landing-section before-after-section" id="before-after" aria-labelledby="before-after-heading">
      <div className="section-heading section-heading-row">
        <div>
          <span className="eyebrow">Smile transformations</span>
          <h2 id="before-after-heading">Before &amp; After</h2>
        </div>
        <p>See the difference our services can make. Tap the arrow to switch between before and after.</p>
      </div>
      <div className="ba-tabs" role="tablist" aria-label="Service categories">
        {categories.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            id={`ba-tab-${name}`}
            aria-selected={category === name}
            aria-controls="ba-panel"
            className={category === name ? 'on' : ''}
            onClick={() => setCategory(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="ba-grid" id="ba-panel" role="tabpanel" aria-labelledby={`ba-tab-${category}`}>
        {visible.map((item) => (
          <CaseCard key={item.service} item={item} service={findService(item.service)} />
        ))}
      </div>
      <p className="ba-disclaimer">Individual results may vary depending on each patient&apos;s case.</p>
    </section>
  )
}
