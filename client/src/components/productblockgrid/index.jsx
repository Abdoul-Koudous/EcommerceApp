import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductItem from "../productitem";
import { fetchDataFromApi } from "../../pages/utils/api";
import { ProductLoading } from "../ProductLoading";
import "./productblockgrid.scss";

const ProductBlockGrid = ({ title, subtitle, fetchUrl, voirPlusLink }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchDataFromApi(fetchUrl)
      .then((res) => {
        const data = res.products || res.data || [];
        setProducts(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [fetchUrl]);

  // ✅ pas de bloc vide affiché : si rien à montrer (ex: aucun produit
  // avec stock bas actuellement), la section disparaît proprement
  if (!loading && products.length === 0) return null;

  return (
    <section className="pbg-block">
      <div className="pbg-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {voirPlusLink && (
          <Link to={voirPlusLink} className="pbg-voir-plus">
            Voir plus
          </Link>
        )}
      </div>

      {loading ? (
        <ProductLoading />
      ) : (
        <div className="pbg-grid">
          {products.map((p) => (
            <ProductItem key={p._id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductBlockGrid;