import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchDataFromApi } from "../utils/api";
import { getIconComponent } from "../utils/iconMap";
import "./about.scss";

const About = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDataFromApi("/api/about").then((res) => {
      if (res?.success) {
        setData(res.data);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="about-page__loading">Chargement...</div>;
  }

  if (!data) {
    return <div className="about-page__loading">Impossible de charger la page.</div>;
  }

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
            {data.storyParagraphs?.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <Link to="/productlisting" className="btn-primary">
              Découvrir la boutique
            </Link>
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
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
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
                  <h4>{val.title}</h4>
                  <p>{val.description}</p>
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
            <Link to="/productlisting" className="btn-primary">
              Voir la boutique
            </Link>
          </div>
        </div>
      )}
    </section>
  );
};

export default About;