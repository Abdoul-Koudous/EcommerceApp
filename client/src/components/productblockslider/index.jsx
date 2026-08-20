import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductSlider from "../productslider";
import { fetchDataFromApi } from "../../pages/utils/api";
import { ProductLoading } from "../ProductLoading";
import "./productblockslider.scss";

const ProductBlockSlider = ({ title, subtitle, fetchUrl, voirPlusLink }) => {
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

  // ✅ pas de bloc vide si rien à montrer
  if (!loading && products.length === 0) return null;

  // ✅ Si aucun lien statique n'est fourni, on le dérive automatiquement
  // du catId du premier produit reçu — évite de coder les IDs en dur
  // dans Home.jsx, qui devraient rester du ressort de la base de données.
  const resolvedLink =
    voirPlusLink || (products[0]?.catId ? `/productlisting?catId=${products[0].catId}` : null);

  return (
    <section className="pbs-block">
      <div className="pbs-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {resolvedLink && (
          <Link to={resolvedLink} className="pbs-voir-plus">
            Voir plus
          </Link>
        )}
      </div>

      {loading ? (
        <ProductLoading />
      ) : (
        <ProductSlider products={products} />
      )}
    </section>
  );
};

export default ProductBlockSlider;