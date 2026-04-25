import React, { useState, useEffect } from "react";
import "./sidebar.scss";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";
import PriceRangeSlider from "./PriceRangeSlider";
import { fetchDataFromApi, postData } from "../../pages/utils/api";
import { useLocation, useNavigate } from "react-router-dom";
import { FaStar } from "react-icons/fa";

const disponibilites = [
  { name: "En stock", count: 40 },
  { name: "Rupture de stock", count: 7 },
  { name: "Bientôt disponible", count: 3 },
];

const tailles = [
  { name: "S", count: 12 },
  { name: "M", count: 20 },
  { name: "L", count: 15 },
  { name: "XL", count: 8 },
  { name: "XXL", count: 4 },
];
const ratings = [
  { stars: 5, count: 12 },
  { stars: 4, count: 8 },
  { stars: 3, count: 6 },
  { stars: 2, count: 3 },
  { stars: 1, count: 1 },
];

const SideBar = (props) => {
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [isDisponibilityOpen, setIsDisponibilityOpen] = useState(true);
  const [isSizeOpen, setIsSizeOpen] = useState(true);
  const [isPriceOpen, setIsPriceOpen] = useState(true);

  const [priceRange, setPriceRange] = useState({ min: 0, max: 999999999 });
  const [isRatingOpen, setIsRatingOpen] = useState(true);
  const [priceFilter, setPriceFilter] = useState({ min: 0, max: 999999999 });
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [previousPage, setPreviousPage] = useState(1);
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    catId: [],
    subCatId: [],
    thirdsubCatId: [],
    minPrice: "",
    maxPrice: "",
    rating: null,
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

      // reset dépendances
      if (filterName === "catId") {
        newFilters.subCatId = [];
        newFilters.thirdsubCatId = [];
      }

      // 🔥 BUILD URL propre
      const params = new URLSearchParams();

      newFilters.catId.forEach((id) => params.append("catId", id));
      newFilters.subCatId.forEach((id) => params.append("subCatId", id));
      newFilters.thirdsubCatId.forEach((id) =>
        params.append("thirdsubCatId", id),
      );

      navigate(`/productlisting?${params.toString()}`);

      return newFilters;
    });
  };

  useEffect(() => {
    const query = new URLSearchParams(location.search);

    const catIds = query.getAll("catId");
    const subCatIds = query.getAll("subCatId");
    const thirdCatIds = query.getAll("thirdsubCatId");

    setFilters((prev) => ({
      ...prev,
      catId: catIds,
      subCatId: subCatIds,
      thirdsubCatId: thirdCatIds,
      rating: null,
      page: 1,
    }));
  }, [location.search]);

  const filtesData = () => {
    props.setIsLoading(true);

    postData(`/api/product/filters`, filters).then((res) => {
      // 🔥 correction clé
      if (filters.page > res.totalPages && res.totalPages > 0) {
        setFilters((prev) => ({
          ...prev,
          page: res.totalPages,
        }));
        return; // ⚠️ on stop ici pour relancer avec bonne page
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

  return (
    <section className="sidebar-section">
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

      {/* === Bloc Disponibilité === */}
      <div className="box">
        <h3 onClick={() => setIsDisponibilityOpen(!isDisponibilityOpen)}>
          Disponibilité{" "}
          <span className="toggle-icon">
            {isDisponibilityOpen ? <FaAngleUp /> : <FaAngleDown />}
          </span>
        </h3>
        <div
          className={`checkbox-list ${isDisponibilityOpen ? "open" : "closed"}`}
        >
          {disponibilites.map((item, index) => (
            <label key={index} className="checkbox-item">
              <input type="checkbox" />
              <span className="label-text">{item.name}</span>
              <span className="label-count">{item.count}</span>
            </label>
          ))}
        </div>
      </div>

      {/* === Bloc Taille === */}
      <div className="box">
        <h3 onClick={() => setIsSizeOpen(!isSizeOpen)}>
          Taille{" "}
          <span className="toggle-icon">
            {isSizeOpen ? <FaAngleUp /> : <FaAngleDown />}
          </span>
        </h3>
        <div className={`checkbox-list ${isSizeOpen ? "open" : "closed"}`}>
          {tailles.map((item, index) => (
            <label key={index} className="checkbox-item">
              <input type="checkbox" />
              <span className="label-text">{item.name}</span>
              <span className="label-count">{item.count}</span>
            </label>
          ))}
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
          {ratings.map((rating, index) => (
            <label key={index} className="checkbox-item">
              <input
                type="radio"
                name="rating"
                value={rating.stars}
                checked={filters.rating === rating.stars}
                onClick={() => handleChekboxChange("rating", rating.stars)}
                readOnly
              />
              <span className="label-text">
                {/* Affichage des étoiles */}
                <span className="rating">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      color={i < rating.stars ? "#FFD700" : "#ccc"}
                      size={16}
                    />
                  ))}
                </span>
              </span>
              <span className="label-count">{rating.count}</span>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SideBar;
