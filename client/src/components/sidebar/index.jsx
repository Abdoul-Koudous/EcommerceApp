import React, { useState, useEffect } from "react";
import "./sidebar.scss";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";
import PriceRangeSlider from "./PriceRangeSlider";
import { fetchDataFromApi, postData } from "../../pages/utils/api";
import { useLocation, useNavigate } from "react-router-dom";
import { FaStar } from "react-icons/fa";

// Ordre d'affichage des étoiles dans le filtre Note (5 -> 1)
const ratingStars = [5, 4, 3, 2, 1];

const SideBar = (props) => {
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [isPriceOpen, setIsPriceOpen] = useState(true);

  const [priceRange, setPriceRange] = useState({ min: 0, max: 999999999 });
  const [isRatingOpen, setIsRatingOpen] = useState(true);
  const [priceFilter, setPriceFilter] = useState({ min: 0, max: 999999999 });
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [previousPage, setPreviousPage] = useState(1);
  const navigate = useNavigate();

  // clé utilisée pour forcer le remount du slider de prix lors d'un reset
  const [resetKey, setResetKey] = useState(0);

  const [filters, setFilters] = useState({
    catId: [],
    subCatId: [],
    thirdsubCatId: [],
    minPrice: "",
    maxPrice: "",
    rating: null,
    search: "",
    sortBy: props.sortBy || "createdAt",
    order: props.order || "desc",
    page: 1,
    limit: 15,
  });

  const [price, setPrice] = useState([0, 600000]);

  const handleMinChange = (e) => {
    const value = Number(e.target.value);
    setPriceRange((prev) => ({
      ...prev,
      min: value > prev.max ? prev.max : value,
    }));
  };

  const handleMaxChange = (e) => {
    const value = Number(e.target.value);
    setPriceRange((prev) => ({
      ...prev,
      max: value < prev.min ? prev.min : value,
    }));
  };

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCats = async () => {
      const res = await fetchDataFromApi("/api/category");
      setCategories(res.data || []);
    };

    fetchCats();
  }, []);

  // ✅ Synchronise le tri choisi dans ProductListing/SearchPage avec les filtres
  // (SideBar est maintenant la SEULE source de fetch, donc le tri doit passer par ici)
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      sortBy: props.sortBy || "createdAt",
      order: props.order || "desc",
    }));
  }, [props.sortBy, props.order]);

  const handleChekboxChange = (filterName, value) => {
    setFilters((prev) => {
      const currentValues = prev[filterName] || [];
      const isRemoving = currentValues.includes(value);

      const newValues = isRemoving
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];

      let newFilters = {
        ...prev,
        [filterName]: newValues,
        page: 1,
      };

      if (filterName === "catId") {
        newFilters.subCatId = [];
        newFilters.thirdsubCatId = [];
      }

      const params = new URLSearchParams();
      newFilters.catId.forEach((id) => params.append("catId", id));
      newFilters.subCatId.forEach((id) => params.append("subCatId", id));
      newFilters.thirdsubCatId.forEach((id) =>
        params.append("thirdsubCatId", id),
      );

      // ✅ garde le terme de recherche dans l'URL
      if (prev.search) params.set("q", prev.search);

      // ✅ garde le rating dans l'URL
      if (prev.rating) params.set("rating", prev.rating);

      // ✅ reste sur la page courante (productlisting OU search)
      navigate(`${location.pathname}?${params.toString()}`);

      return newFilters;
    });
  };

  const handleRatingChange = (stars) => {
    setFilters((prev) => {
      const newRating = prev.rating === stars ? null : stars;

      const params = new URLSearchParams();
      prev.catId.forEach((id) => params.append("catId", id));
      prev.subCatId.forEach((id) => params.append("subCatId", id));
      prev.thirdsubCatId.forEach((id) => params.append("thirdsubCatId", id));
      if (prev.search) params.set("q", prev.search);
      if (newRating) params.set("rating", newRating);

      navigate(`${location.pathname}?${params.toString()}`);

      return { ...prev, rating: newRating, page: 1 };
    });
  };

  // ✅ Réinitialise les filtres (catégories, dispo, taille, prix, note, recherche, URL)
  // Le tri (sortBy/order) n'est PAS réinitialisé : il reste piloté par le parent.
  const handleResetFilters = () => {
    setFilters((prev) => ({
      catId: [],
      subCatId: [],
      thirdsubCatId: [],
      minPrice: "",
      maxPrice: "",
      rating: null,
      search: "",
      sortBy: prev.sortBy,
      order: prev.order,
      page: 1,
      limit: 15,
    }));

    setPriceFilter({ min: 0, max: 999999999 });
    setPriceRange({ min: 0, max: 999999999 });
    setPrice([0, 600000]);

    // force le remount du PriceRangeSlider pour qu'il revienne visuellement à zéro
    setResetKey((k) => k + 1);

    // vide les query params de l'URL (catId, subCatId, q, rating...)
    navigate(location.pathname);
  };

  useEffect(() => {
    const query = new URLSearchParams(location.search);

    const catIds = query.getAll("catId");
    const subCatIds = query.getAll("subCatId");
    const thirdCatIds = query.getAll("thirdsubCatId");
    const q = query.get("q") || "";
    const ratingParam = query.get("rating");

    setFilters((prev) => ({
      ...prev,
      catId: catIds,
      subCatId: subCatIds,
      thirdsubCatId: thirdCatIds,
      search: q,
      rating: ratingParam ? Number(ratingParam) : null,
      page: 1,
    }));
  }, [location.search]);

  const filtesData = () => {
    props.setIsLoading(true);

    postData(`/api/product/filters`, filters).then((res) => {
      if (filters.page > res.totalPages && res.totalPages > 0) {
        setFilters((prev) => ({
          ...prev,
          page: res.totalPages,
        }));
        return;
      }

      props.setProductsData(res);
      props.setIsLoading(false);
      props.setTotalPages(res?.totalPages);
      window.scrollTo(0, 0);
    });
  };

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      page: props.page,
    }));
  }, [props.page]);

  useEffect(() => {
    const delay = setTimeout(() => {
      filtesData();
    }, 150);

    return () => clearTimeout(delay);
  }, [filters]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      minPrice: priceFilter.min,
      maxPrice: priceFilter.max,
    }));
  }, [priceFilter]);

  // ✅ Un filtre est actif si au moins un critère est différent de sa valeur par défaut
  const hasActiveFilters =
    filters.catId.length > 0 ||
    filters.subCatId.length > 0 ||
    filters.thirdsubCatId.length > 0 ||
    filters.rating !== null ||
    filters.search !== "" ||
    priceFilter.min !== 0 ||
    priceFilter.max !== 999999999;

  return (
    <section className="sidebar-section">
      {/* === Bloc Réinitialisation === */}
      <div className="box reset-box">
        <button
          className="reset-filters-btn"
          onClick={handleResetFilters}
          disabled={!hasActiveFilters}
        >
          Réinitialiser les filtres
        </button>
      </div>

      {/* === Bloc Catégories === */}
      <div className="box">
        <h3 onClick={() => setIsCategoryOpen(!isCategoryOpen)}>
          Catégorie{" "}
          <span className="toggle-icon">
            {isCategoryOpen ? <FaAngleUp /> : <FaAngleDown />}
          </span>
        </h3>
        <div className={`checkbox-list ${isCategoryOpen ? "open" : "closed"}`}>
          {categories.map((cat, index) => {
            return (
              <label key={index} className="checkbox-item">
                <input
                  type="checkbox"
                  value={cat._id}
                  checked={filters.catId.includes(cat._id)}
                  onChange={() => handleChekboxChange("catId", cat._id)}
                />
                <span className="label-text">{cat.name}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* === Bloc Prix === */}
      <div className="box">
        <h3 onClick={() => setIsPriceOpen(!isPriceOpen)}>
          Prix{" "}
          <span className="toggle-icon">
            {isPriceOpen ? <FaAngleUp /> : <FaAngleDown />}
          </span>
        </h3>
        <div className={`checkbox-list ${isPriceOpen ? "open" : "closed"}`}>
          <div className="price-range">
            <PriceRangeSlider
              key={resetKey}
              min={0}
              max={999999999}
              onChange={setPriceFilter}
            />
          </div>
        </div>
      </div>
      {/* === Bloc Rating === */}
      <div className="box">
        <h3 onClick={() => setIsRatingOpen(!isRatingOpen)}>
          Note{" "}
          <span className="toggle-icon">
            {isRatingOpen ? <FaAngleUp /> : <FaAngleDown />}
          </span>
        </h3>
        <div className={`checkbox-list ${isRatingOpen ? "open" : "closed"}`}>
          {ratingStars.map((stars) => {
            const count = props.productsData?.ratingCounts?.[stars] ?? 0;
            return (
              <label key={stars} className="checkbox-item">
                <input
                  type="radio"
                  name="rating"
                  value={stars}
                  checked={filters.rating === stars}
                  onClick={() => handleRatingChange(stars)}
                  readOnly
                />
                <span className="label-text">
                  <span className="rating">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        color={i < stars ? "#FFD700" : "#ccc"}
                        size={16}
                      />
                    ))}
                  </span>
                </span>
                <span className="label-count">{count}</span>
              </label>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SideBar;