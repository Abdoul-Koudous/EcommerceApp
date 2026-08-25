// 📁 Fichier à remplacer : client/src/pages/helpcenter/index.jsx

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getFaqCategories, getFaqs } from "./data";
import { getIconComponent } from "../utils/iconMap";
import "./helpcenter.scss";

function CategoryIcon({ name }) {
  const Icon = getIconComponent(name);
  return <Icon />;
}

// Icônes maison, non liées à une catégorie en base (recherche, contact)
function IconFor({ name }) {
  const paths = {
    chat: (
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
    ),
    mail: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m2 7 10 6 10-6" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.35-4.35" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

export default function HelpCenter() {
  const [categories, setCategories] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [openQuestion, setOpenQuestion] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [flashQuestion, setFlashQuestion] = useState(null);

  const searchWrapRef = useRef(null);
  const faqRefs = useRef({});
  const pendingScrollRef = useRef(null);

  // Chargement initial : catégories + toutes les questions publiées.
  // Pas de refetch par catégorie : le filtrage reste local (recherche
  // instantanée), exactement comme avec le mock d'origine.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [categoriesData, faqsData] = await Promise.all([
        getFaqCategories(),
        getFaqs(),
      ]);

      if (cancelled) return;

      setCategories(categoriesData);
      setFaqs(faqsData);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Suggestions affichées sous la barre de recherche pendant la saisie
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return faqs
      .filter(
        (item) =>
          item.question.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [query, faqs]);

  const filteredFaq = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faqs.filter((item) => {
      const matchesCategory = !activeCategory || item.category === activeCategory;
      const matchesQuery =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory, faqs]);

  // Ferme le dropdown si on clique en dehors de la zone de recherche
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function goToQuestion(item) {
    // On enlève le filtre catégorie s'il masquerait la question choisie,
    // puis on programme le scroll + l'ouverture pour le prochain rendu.
    if (activeCategory && activeCategory !== item.category) {
      setActiveCategory(null);
    }
    setQuery("");
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    setOpenQuestion(item._id);
    pendingScrollRef.current = item._id;
  }

  // Une fois la liste FAQ ré-affichée (après filtre/ouverture), on scrolle
  // jusqu'à la question ciblée et on la met brièvement en surbrillance.
  useEffect(() => {
    const target = pendingScrollRef.current;
    if (!target) return;
    const node = faqRefs.current[target];
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "center" });
      setFlashQuestion(target);
      pendingScrollRef.current = null;
      const timer = setTimeout(() => setFlashQuestion(null), 1200);
      return () => clearTimeout(timer);
    }
  });

  function handleSearchKeyDown(e) {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = suggestions[highlightedIndex] ?? suggestions[0];
      if (pick) goToQuestion(pick);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  if (loading) {
    return null;
  }

  return (
    <div className="help-page">
      <section className="help-hero">
        <span className="seal-tag seal-tag--light">
          <span className="seal-tag__dot" />
          Centre d'aide
        </span>
        <h1>Comment pouvons-nous vous aider ?</h1>
        <p>
          Parcourez les questions les plus fréquentes ou recherchez
          directement votre sujet ci-dessous.
        </p>

        <div className="help-search-wrap" ref={searchWrapRef}>
          <div className="help-search">
            <IconFor name="search" />
            <input
              type="text"
              placeholder="Rechercher une question (ex. « retour », « livraison »…)"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
                setHighlightedIndex(-1);
              }}
              onFocus={() => query && setShowSuggestions(true)}
              onKeyDown={handleSearchKeyDown}
              role="combobox"
              aria-expanded={showSuggestions && suggestions.length > 0}
              aria-controls="help-suggestions-list"
              autoComplete="off"
            />
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <ul className="help-suggestions" id="help-suggestions-list" role="listbox">
              {suggestions.map((item, i) => (
                <li
                  key={item._id}
                  role="option"
                  aria-selected={highlightedIndex === i}
                  className={
                    "help-suggestions__item" +
                    (highlightedIndex === i ? " is-highlighted" : "")
                  }
                  onMouseEnter={() => setHighlightedIndex(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => goToQuestion(item)}
                >
                  <span className="help-suggestions__tag">{item.category}</span>
                  <span className="help-suggestions__text">{item.question}</span>
                </li>
              ))}
              <li className="help-suggestions__footer">
                Appuyez sur Entrée pour aller à la question sélectionnée
              </li>
            </ul>
          )}
        </div>
      </section>

      <div className="help-page__container">
        {/* Catégories */}
        <section className="help-categories">
          {categories.map((cat) => (
            <button
              key={cat.key}
              className={
                "help-category" +
                (activeCategory === cat.title ? " help-category--active" : "")
              }
              onClick={() =>
                setActiveCategory((current) => (current === cat.title ? null : cat.title))
              }
            >
              <span className="help-category__icon">
                <CategoryIcon name={cat.icon} />
              </span>
              <span className="help-category__title">{cat.title}</span>
              <span className="help-category__desc">{cat.description}</span>
            </button>
          ))}
        </section>

        {/* FAQ */}
        <section className="help-faq">
          <h2>{activeCategory || "Questions fréquentes"}</h2>

          {filteredFaq.length === 0 && (
            <p className="help-faq__empty">
              Aucun résultat pour cette recherche. Essayez un autre mot-clé ou{" "}
              <Link to="/contact">contactez-nous directement</Link>.
            </p>
          )}

          <ul>
            {filteredFaq.map((item) => {
              const isOpen = openQuestion === item._id;
              const isFlashing = flashQuestion === item._id;
              return (
                <li
                  key={item._id}
                  ref={(el) => (faqRefs.current[item._id] = el)}
                  className={
                    (isOpen ? "is-open" : "") + (isFlashing ? " is-flash" : "")
                  }
                >
                  <button
                    className="help-faq__question"
                    onClick={() => setOpenQuestion(isOpen ? null : item._id)}
                    aria-expanded={isOpen}
                  >
                    {item.question}
                    <span className="help-faq__chevron" aria-hidden="true" />
                  </button>
                  {isOpen && <p className="help-faq__answer">{item.answer}</p>}
                </li>
              );
            })}
          </ul>
        </section>

        {/* Contact */}
        <section className="help-contact">
          <div className="help-contact__text">
            <h3>Vous ne trouvez pas votre réponse ?</h3>
            <p>Notre équipe vous répond en général sous 24h ouvrées.</p>
          </div>
          <div className="help-contact__actions">
            <a href="mailto:support@yeboushop.com" className="help-contact__btn">
              <IconFor name="mail" />
              Écrire un e-mail
            </a>
            <Link to="/contact" className="help-contact__btn help-contact__btn--primary">
              <IconFor name="chat" />
              Contacter le support
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}