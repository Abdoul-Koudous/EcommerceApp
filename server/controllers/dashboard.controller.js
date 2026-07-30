import { getDashboardStats, getMonthlyStats } from "../services/dashboard.service.js";

// Réservé aux ADMIN (voir middleware adminAuth sur la route)
export const getDashboardStatsController = async (req, res) => {
  try {
    const stats = await getDashboardStats();

    res.status(200).json({
      error: false,
      success: true,
      message: "Statistiques du tableau de bord récupérées avec succès",
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      data: error.message,
    });
  }
};

export const getMonthlyStatsController = async (req, res) => {
  try {
    const data = await getMonthlyStats();

    res.status(200).json({
      error: false,
      success: true,
      message: "Statistiques mensuelles récupérées avec succès",
      data,
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      success: false,
      message: "Erreur lors de la récupération des statistiques mensuelles",
      data: error.message,
    });
  }
};