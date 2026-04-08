import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

// 🔥 Fonction pour éviter répétition des headers
const getHeaders = (type = "json") => {
  return {
    Authorization: `Bearer ${localStorage.getItem("accesstoken")}`,
    "Content-Type":
      type === "form" ? "multipart/form-data" : "application/json",
  };
};

// ✅ POST (création)
export const postData = async (url, formData) => {
  try {
    const response = await fetch(apiUrl + url, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return { error: true, message: error.message || "Erreur serveur" };
  }
};

// ✅ GET
export const fetchDataFromApi = async (url) => {
  try {
    const { data } = await axios.get(apiUrl + url, {
      headers: getHeaders(),
    });
    return data;
  } catch (error) {
    console.log(error);
    return { error: true, message: error.message || "Erreur serveur" };
  }
};

// ✅ UPLOAD UNE IMAGE
export const uploadImage = async (url, formData) => {
  try {
    const response = await axios.put(apiUrl + url, formData, {
      headers: getHeaders("form"),
    });
    return response.data;
  } catch (error) {
    console.log(error);
    return { error: true, message: error.message || "Erreur serveur" };
  }
};

// ✅ UPLOAD PLUSIEURS IMAGES
export const uploadImages = async (url, formData) => {
  try {
    const response = await axios.post(apiUrl + url, formData, {
      headers: getHeaders("form"),
    });
    return response.data;
  } catch (error) {
    console.log(error);
    return { error: true, message: error.message || "Erreur serveur" };
  }
};

// ✅ UPDATE
export const editData = async (url, updatedData) => {
  try {
    const response = await axios.put(apiUrl + url, updatedData, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    console.log(error);
    return { error: true, message: error.message || "Erreur serveur" };
  }
};

// ✅ DELETE SIMPLE ou AVEC DATA
export const deleteData = async (url, data = {}) => {
  try {
    const response = await axios.delete(apiUrl + url, {
      headers: getHeaders(),
      data, // 🔥 important pour envoyer un body
    });
    return response.data;
  } catch (error) {
    console.log(error);
    return { error: true, message: error.message || "Erreur serveur" };
  }
};

// ✅ DELETE IMAGE (optionnel séparé)
export const deleteImages = async (url) => {
  try {
    const response = await axios.delete(apiUrl + url, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    return { error: true, message: error.message || "Erreur serveur" };
  }
};