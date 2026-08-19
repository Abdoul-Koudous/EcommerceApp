import React from "react";
import { getIconComponent } from "../../pages/utils/iconOptions";
import "./aboutpreview.scss";

const AboutPreview = ({ data }) => {
  return (
    <section className="about-page">
      {/* HERO */}
      <div
        className="about-hero"
        style={data.heroImage ? { backgroundImage: `url(${data.heroImage})` } : undefined}
      >
        <div className="overlay"></div>
        <div className="hero-content">
          {data.heroTag && <p className="tag">{data.heroTag}</p>}
          {data.heroTitle && <h1>{data.heroTitle}</h1>}
          {data.heroSubtitle && <p className="subtitle">{data.heroSubtitle}</p>}
        </div>
      </div>

      {/* STORY */}
      {(data.storyTitle || data.storyParagraphs?.length > 0) && (
        <div className="about-story container">
          <div className="story-text">
            {data.storyTag && <p className="tag">{data.storyTag}</p>}
            {data.storyTitle && <h2>{data.storyTitle}</h2>}
            {data.storyParagraphs?.map((p, i) => p && <p key={i}>{p}</p>)}
            <span className="btn-primary">Découvrir la boutique</span>
          </div>
          {data.storyImage && (
            <div className="story-image">
              <img src={data.storyImage} alt="Notre histoire" />
            </div>
          )}
        </div>
      )}

      {/* STATS */}
      {data.stats?.length > 0 && (
        <div className="about-stats">
          <div className="container stats-grid">
            {data.stats.map((stat, i) => (
              <div className="stat-item" key={i}>
                <h3>{stat.value || "—"}</h3>
                <p>{stat.label || "..."}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VALEURS */}
      {data.values?.length > 0 && (
        <div className="about-values container">
          {data.valuesTag && <p className="tag center">{data.valuesTag}</p>}
          {data.valuesTitle && <h2 className="center">{data.valuesTitle}</h2>}

          <div className="values-grid">
            {data.values.map((val, i) => {
              const Icon = getIconComponent(val.icon);
              return (
                <div className="value-card" key={i}>
                  <Icon className="icon" />
                  <h4>{val.title || "..."}</h4>
                  <p>{val.description || "..."}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      {(data.ctaTitle || data.ctaSubtitle) && (
        <div className="about-cta">
          <div className="container">
            {data.ctaTitle && <h2>{data.ctaTitle}</h2>}
            {data.ctaSubtitle && <p>{data.ctaSubtitle}</p>}
            <span className="btn-primary">Voir la boutique</span>
          </div>
        </div>
      )}
    </section>
  );
};

export default AboutPreview;