import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { getArticleById, getRelatedArticles, formatDate } from "./data";
import "./blog.scss";
import "./blogdetails.scss";

function ArticleBlock({ block }) {
  switch (block.type) {
    case "heading":
      return <h2 className="article-body__heading">{block.text}</h2>;
    case "quote":
      return <blockquote className="article-body__quote">{block.text}</blockquote>;
    case "image":
      return (
        <figure className="article-body__figure">
          <img src={block.src} alt="" loading="lazy" />
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      );
    case "list":
      return (
        <ul className="article-body__list">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case "paragraph":
    default:
      return <p className="article-body__paragraph">{block.text}</p>;
  }
}

export default function BlogDetails() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Reset à chaque changement d'id (navigation vers un autre article)
    setArticle(null);
    setRelated([]);
    setNotFound(false);

    (async () => {
      const data = await getArticleById(id);

      if (cancelled) return;

      if (!data) {
        setNotFound(true);
        return;
      }

      setArticle(data);

      const relatedData = await getRelatedArticles(data, 3);
      if (!cancelled) {
        setRelated(relatedData);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (notFound) {
    return <Navigate to="/blog" replace />;
  }

  if (!article) {
    return null;
  }

  return (
    <div className="blog-page article-page">
      {/* HERO — image + titre */}
      <section className="article-hero">
        <div className="article-hero__media">
          <img src={article.image} alt="" />
          <div className="blog-hero__scrim" />
        </div>
        <div className="article-hero__content">
          <span className="seal-tag seal-tag--light">
            <span className="seal-tag__dot" />
            {article.category}
          </span>
          <h1>{article.title}</h1>
          <div className="blog-hero__meta">
            <span>{article.author.name}</span>
            <span className="blog-hero__sep">·</span>
            <span>{formatDate(article.date)}</span>
            <span className="blog-hero__sep">·</span>
            <span>{article.readTime} min de lecture</span>
          </div>
        </div>
      </section>

      <div className="blog-page__container article-page__container">
        <nav className="article-breadcrumb" aria-label="Fil d'Ariane">
          <Link to="/blog">Blog</Link>
          <span>/</span>
          <span>{article.category}</span>
        </nav>

        <div className="article-layout">
          {/* Corps de l'article */}
          <article className="article-body">
            {article.body.map((block, i) => (
              <ArticleBlock block={block} key={i} />
            ))}

            <div className="article-tags">
              <span className="seal-tag">
                <span className="seal-tag__dot" />
                {article.category}
              </span>
            </div>
          </article>

          {/* Auteur + partage */}
          <aside className="article-aside">
            <div className="article-author">
              <div className="article-author__avatar" aria-hidden="true">
                {article.author.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")}
              </div>
              <div>
                <p className="article-author__name">{article.author.name}</p>
                <p className="article-author__role">{article.author.role}</p>
              </div>
            </div>

            <div className="article-share">
              <p>Partager cet article</p>
              <div className="article-share__links">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(article.title)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    window.location.href
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Facebook
                </a>
                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard?.writeText(window.location.href)
                  }
                >
                  Copier le lien
                </button>
              </div>
            </div>
          </aside>
        </div>

        {/* Articles liés */}
        {related.length > 0 && (
          <section className="article-related">
            <h3>À lire aussi</h3>
            <div className="blog-grid">
              {related.map((a) => (
                <Link to={`/blog/${a._id}`} key={a._id} className="blog-card">
                  <div className="blog-card__media">
                    <img src={a.image} alt="" loading="lazy" />
                    <span className="seal-tag blog-card__tag">
                      <span className="seal-tag__dot" />
                      {a.category}
                    </span>
                  </div>
                  <div className="blog-card__body">
                    <h3>{a.title}</h3>
                    <p>{a.excerpt}</p>
                    <div className="blog-card__meta">
                      <span>{formatDate(a.date)}</span>
                      <span className="blog-hero__sep">·</span>
                      <span>{a.readTime} min</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}