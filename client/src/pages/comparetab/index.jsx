import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./comparetab.scss";
import CompareTabItems from "./comparetabitems";
import { UserContext } from "../../UserContext/UserContext";

const CompareTabPage = () => {
  const { compareItems, loadCompareItems } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    loadCompareItems();
  }, []);

  return (
    <div className="compare-page">
      <p>
        Vous avez <strong>{compareItems.length}</strong>{" "}
        {compareItems.length > 1 ? "produits" : "produit"} à comparer.
      </p>

      {compareItems.length === 0 ? (
        <div className="empty-compare">
          <img
            src="/MyListeRmpity.png"
            alt="Comparateur vide"
            className="empty-compare-img"
          />
          <p className="empty-text">
            Votre comparateur est vide pour le moment
          </p>
          <button className="continue-shopping-btn" onClick={() => navigate("/")}>
            Continuer les achats
          </button>
        </div>
      ) : (
        <CompareTabItems items={compareItems} onRemoved={loadCompareItems} />
      )}
    </div>
  );
};

export default CompareTabPage;