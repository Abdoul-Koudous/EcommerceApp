import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./helpcenter.scss";

const CATEGORIES = [
  {
    key: "orders",
    title: "Commandes",
    desc: "Modifier, annuler ou consulter une commande.",
    icon: "box",
  },
  {
    key: "shipping",
    title: "Livraison",
    desc: "Délais, transporteurs, suivi de colis.",
    icon: "truck",
  },
  {
    key: "returns",
    title: "Retours & remboursements",
    desc: "Renvoyer un article, délai de remboursement.",
    icon: "refresh",
  },
  {
    key: "payment",
    title: "Paiement",
    desc: "Moyens acceptés, sécurité, échec de paiement.",
    icon: "card",
  },
  {
    key: "account",
    title: "Mon compte",
    desc: "Mot de passe, informations, adresses.",
    icon: "user",
  },
  {
    key: "products",
    title: "Produits",
    desc: "Tailles, matières, disponibilité.",
    icon: "tag",
  },
];

const FAQ = [
  {
    category: "orders",
    q: "Comment modifier ou annuler ma commande ?",
    a: "Tant que votre commande n'est pas encore en préparation, vous pouvez l'annuler depuis \"Mes commandes\" dans votre compte. Passé ce délai, contactez le service client au plus vite : nous ferons le maximum pour l'ajuster.",
  },
  {
    category: "shipping",
    q: "Combien de temps prend la livraison ?",
    a: "Comptez 2 à 4 jours ouvrés pour une livraison standard, et 24 à 48h pour la livraison express. Un e-mail de suivi vous est envoyé dès l'expédition de votre colis.",
  },
  {
    category: "returns",
    q: "Combien de temps ai-je pour retourner un article ?",
    a: "Vous disposez de 30 jours à compter de la réception pour nous retourner un article, à condition qu'il soit non porté et dans son emballage d'origine.",
  },
  {
    category: "returns",
    q: "Sous combien de temps suis-je remboursé ?",
    a: "Le remboursement est déclenché dès réception et contrôle du retour en entrepôt, sous 5 à 7 jours ouvrés en fonction de votre moyen de paiement initial.",
  },
  {
    category: "payment",
    q: "Quels moyens de paiement acceptez-vous ?",
    a: "Carte bancaire, Mobile Money et paiement à la livraison selon les zones. Toutes les transactions sont chiffrées et sécurisées.",
  },
  {
    category: "account",
    q: "J'ai oublié mon mot de passe, que faire ?",
    a: "Cliquez sur \"Mot de passe oublié\" depuis la page de connexion : un lien de réinitialisation vous sera envoyé par e-mail sous quelques minutes.",
  },
  {
    category: "products",
    q: "Comment connaître la bonne taille pour moi ?",
    a: "Chaque fiche produit contient un guide des tailles détaillé. En cas de doute entre deux tailles, nous recommandons généralement de prendre la taille au-dessus.",
  },
];

function categoryTitle(key) {
  return CATEGORIES.find((c) => c.key === key)?.title || "";
}

function IconFor({ name }) {
  const paths = {
    box: (
      <>
        <path d="M21 8 12 3 3 8l9 5 9-5Z" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </>
    ),
    truck: (
      <>
        <path d="M1 3h13v13H1z" />
        <path d="M14 8h4l3 3v5h-7V8Z" />
        <circle cx="5.5" cy="18.5" r="1.5" />
        <circle cx="17.5" cy="18.5" r="1.5" />
      </>
    ),
    refresh: (
      <>
        <path d="M23 4v6h-6" />
        <path d="M1 20v-6h6" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
        <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
      </>
    ),
    card: (
      <>
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <path d="M1 10h22" />
      </>
    ),
    user: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    tag: (
      <>
        <path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24L4 3a1 1 0 0 0-1 1l.24 5.59a2 2 0 0 0 .58 1.41l9.58 9.59a2 2 0 0 0 2.83 0l4.36-4.36a2 2 0 0 0 0-2.83Z" />
        <circle cx="7.5" cy="7.5" r="1" />
      </>
    ),
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
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [openQuestion, setOpenQuestion] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [flashQuestion, setFlashQuestion] = useState(null);

  const searchWrapRef = useRef(null);
  const faqRefs = useRef({});
  const pendingScrollRef = useRef(null);

  // Suggestions affichées sous la barre de recherche pendant la saisie
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return FAQ.filter(
      (item) =>
        item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [query]);

  const filteredFaq = useMemo(() => {
    return FAQ.filter((item) => {
      const matchesCategory = !activeCategory || item.category === activeCategory;
      const matchesQuery =
        !query.trim() ||
        item.q.toLowerCase().includes(query.trim().toLowerCase()) ||
        item.a.toLowerCase().includes(query.trim().toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

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
    setOpenQuestion(item.q);
    pendingScrollRef.current = item.q;
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
                  key={item.q}
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
                  <span className="help-suggestions__tag">
                    {categoryTitle(item.category)}
                  </span>
                  <span className="help-suggestions__text">{item.q}</span>
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
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              className={
                "help-category" +
                (activeCategory === cat.key ? " help-category--active" : "")
              }
              onClick={() =>
                setActiveCategory((current) => (current === cat.key ? null : cat.key))
              }
            >
              <span className="help-category__icon">
                <IconFor name={cat.icon} />
              </span>
              <span className="help-category__title">{cat.title}</span>
              <span className="help-category__desc">{cat.desc}</span>
            </button>
          ))}
        </section>

        {/* FAQ */}
        <section className="help-faq">
          <h2>
            {activeCategory
              ? categoryTitle(activeCategory)
              : "Questions fréquentes"}
          </h2>

          {filteredFaq.length === 0 && (
            <p className="help-faq__empty">
              Aucun résultat pour cette recherche. Essayez un autre mot-clé ou{" "}
              <Link to="/contact">contactez-nous directement</Link>.
            </p>
          )}

          <ul>
            {filteredFaq.map((item) => {
              const isOpen = openQuestion === item.q;
              const isFlashing = flashQuestion === item.q;
              return (
                <li
                  key={item.q}
                  ref={(el) => (faqRefs.current[item.q] = el)}
                  className={
                    (isOpen ? "is-open" : "") + (isFlashing ? " is-flash" : "")
                  }
                >
                  <button
                    className="help-faq__question"
                    onClick={() => setOpenQuestion(isOpen ? null : item.q)}
                    aria-expanded={isOpen}
                  >
                    {item.q}
                    <span className="help-faq__chevron" aria-hidden="true" />
                  </button>
                  {isOpen && <p className="help-faq__answer">{item.a}</p>}
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