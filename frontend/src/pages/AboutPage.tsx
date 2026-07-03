const AboutPage = () => {
  return (
    <section className="card-grid">
      <article className="hero-card wide-card">
        <div>
          <p className="eyebrow_about">About Voyage Hub</p>
          <h2>Discover dream destinations with a calm, modern planning experience.</h2>
          <p className="muted-text_about">
            Voyage Hub helps travelers browse vacation offers, save favorites, and receive tailored destination ideas from the built-in AI experience.
          </p>
        </div>
      </article>
      <article className="info-card">
        <h3>What you can do</h3>
        <ul>
          <li className="h3_about">Browse vacations by date, price, and activity</li>
          <li className="h3_about">Like trips and revisit your favorites</li>
          <li className="h3_about">Ask the MCP assistant about current offers</li>
        </ul>
      </article>
      <article className="info-card">
        <h3>Developer</h3>
        <p className="muted-text_about">Built by Tair Shimonov, a full-stack developer focused on polished interfaces and practical travel tools.</p>
      </article>
    </section>
  )
}

export default AboutPage
