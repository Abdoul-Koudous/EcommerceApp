import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getFeaturedArticle,
  getCategories,
  getArticles,
  formatDate,
} from "./data";
import "./blog.scss";

export default function Blog() {
  const [featured, setFeatured] = useState(null);
  const [categories, setCategories] = useState(["Tous"]);
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [articles, setArticles] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(true);

  // Chargé une seule fois : article à la une + liste des catégories
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [featuredData, categoriesData] = await Promise.all([
        getFeaturedArticle(),
        getCategories(),
      ]);

      if (cancelled) return;

      setFeatured(featuredData);
      setCategories(["Tous", ...categoriesData]);
      setLoadingInitial(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Rechargé à chaque changement de catégorie ou de page
  useEffect(() => {
    let cancelled = false;
    setLoadingArticles(true);

    (async () => {
      const result = await getArticles({
        category: activeCategory,
        excludeFeatured: false,
        page,
      });

      if (cancelled) return;

      setArticles(result.articles);
      setTotalPages(result.totalPages);
      setLoadingArticles(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeCategory, page]);

  // Le hero a besoin de l'article à la une pour s'afficher — tant qu'on
  // ne l'a pas (ou qu'il n'existe pas encore côté backend), on ne rend rien.
  if (loadingInitial || !featured) {
    return null;
  }

  return (
    <div className="blog-page">
      {/* HERO — article à la une */}
      <section className="blog-hero">
        <div className="blog-hero__media">
          <img src={featured.image} alt="" />
          <div className="blog-hero__scrim" />
        </div>

        <div className="blog-hero__content">
          <span className="seal-tag seal-tag--light">
            <span className="seal-tag__dot" />À la une
          </span>
          <h1>{featured.title}</h1>
          <p>{featured.excerpt}</p>
          <div className="blog-hero__meta">
            <span>{formatDate(featured.date)}</span>
            <span className="blog-hero__sep">·</span>
            <span>{featured.readTime} min de lecture</span>
          </div>
          <Link to={`/blog/${featured._id}`} className="blog-hero__cta">
            Lire l'article
          </Link>
        </div>
      </section>

      <div className="blog-page__container">
        {/* Intro + filtres */}
        <header className="blog-intro">
          <div>
            <p className="blog-intro__eyebrow">Le journal</p>
            <h2>Conseils, coulisses &amp; inspirations</h2>
          </div>
          <p className="blog-intro__text">
            Guides d'achat, entretien de vos pièces, rencontres avec nos
            partenaires : tout ce qu'on avait envie de vous raconter.
          </p>
        </header>

        <nav className="blog-filters" aria-label="Filtrer par catégorie">
          {categories.map((cat) => (
            <button
              key={cat}
              className={
                "blog-filters__pill" +
                (activeCategory === cat ? " blog-filters__pill--active" : "")
              }
              onClick={() => {
                setActiveCategory(cat);
                setPage(1);
              }}
            >
              {cat}
            </button>
          ))}
        </nav>

        {/* Grille d'articles */}
        <section className="blog-grid">
          {articles.map((article) => (
            <Link
              to={`/blog/${article._id}`}
              key={article._id}
              className="blog-card"
            >
              <div className="blog-card__media">
                <img src={article.image} alt="" loading="lazy" />
                <span className="seal-tag blog-card__tag">
                  <span className="seal-tag__dot" />
                  {article.category}
                </span>
              </div>
              <div className="blog-card__body">
                <h3>{article.title}</h3>
                <p>{article.excerpt}</p>
                <div className="blog-card__meta">
                  <span>{formatDate(article.date)}</span>
                  <span className="blog-hero__sep">·</span>
                  <span>{article.readTime} min</span>
                </div>
              </div>
            </Link>
          ))}

          {!loadingArticles && articles.length === 0 && (
            <p className="blog-grid__empty">
              Aucun article dans cette catégorie pour le moment.
            </p>
          )}
        </section>

        {/* Pagination */}
        {!loadingArticles && articles.length > 0 && totalPages > 1 && (
          <nav className="blog-pagination" aria-label="Pagination des articles">
            <button
              type="button"
              className="blog-filters__pill"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Précédent
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                className={
                  "blog-filters__pill" +
                  (page === n ? " blog-filters__pill--active" : "")
                }
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}

            <button
              type="button"
              className="blog-filters__pill"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Suivant
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}