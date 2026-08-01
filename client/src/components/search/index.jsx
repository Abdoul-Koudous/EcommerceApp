import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoSearch } from "react-icons/io5";
import "./search.scss";
import { fetchDataFromApi } from '../../pages/utils/api';

const Search = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  // ✅ Fetch debouncé des suggestions à chaque frappe
  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);

    const delay = setTimeout(() => {
      fetchDataFromApi(`/api/product/searchSuggestions?q=${encodeURIComponent(trimmed)}`)
        .then((res) => {
          setSuggestions(res?.products || []);
          setIsOpen(true);
          setIsLoading(false);
        })
        .catch(() => {
          setSuggestions([]);
          setIsLoading(false);
        });
    }, 250);

    return () => clearTimeout(delay);
  }, [query]);

  // ✅ Ferme le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Entrée/clic sur la loupe SANS choisir de suggestion -> page résultats complète
  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setIsOpen(false);
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  // ✅ Clic sur une suggestion -> direct sur la fiche produit
  const handleSuggestionClick = (product) => {
    setIsOpen(false);
    setQuery("");
    navigate(`/product/${product._id}`);
  };

  return (
    <div className="searchBoxWrapper" ref={wrapperRef}>
      <form className='searchBox' onSubmit={handleSearch}>
        <input
          type="text"
          placeholder='Rechercher les produits...'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
        />
        <button type="submit"><IoSearch /></button>
      </form>

      {isOpen && (
        <div className="searchSuggestions">
          {isLoading ? (
            <div className="suggestion-loading">Recherche...</div>
          ) : suggestions.length > 0 ? (
            <>
              {suggestions.map((product) => (
                <div
                  key={product._id}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(product)}
                >
                  <img src={product.images?.[0]} alt={product.name} />
                  <div className="suggestion-info">
                    <span className="suggestion-name">{product.name}</span>
                    <span className="suggestion-price">{product.price} FCFA</span>
                  </div>
                </div>
              ))}
              <div
                className="suggestion-viewAll"
                onClick={handleSearch}
              >
                Voir tous les résultats pour "{query}"
              </div>
            </>
          ) : (
            <div className="suggestion-empty">Aucun produit trouvé</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;