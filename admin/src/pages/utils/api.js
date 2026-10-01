import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

// 🔥 Headers centralisés (évite la répétition)
const getHeaders = (type = "json") => {
  const headers = {
    Authorization: `Bearer ${localStorage.getItem("accesstoken")}`,
  };

  // ✅ Pour "form" (multipart), on NE fixe PAS Content-Type : le navigateur/axios
  // doit le générer lui-même pour inclure le "boundary", sinon multer côté
  // serveur ne peut pas parser correctement les fichiers.
  if (type !== "form") {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

// ✅ Transforme une erreur axios en { error, success, message } en gardant
// le message envoyé par le serveur au lieu du message générique d'axios
// ("Request failed with status code 400").
const formatError = (error) => {
  console.log(error);

  const serverData = error.response?.data;
  if (serverData && typeof serverData === "object") {
    return { success: false, ...serverData, error: true };
  }

  return {
    error: true,
    success: false,
    message: error.message || "Erreur serveur",
  };
};

export const postData = async (url, formData) => {
  try {
    const response = await fetch(apiUrl + url, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    // On retourne toujours le JSON, même si response.ok est false
    return data;
  } catch (error) {
    console.error(error);
    // On retourne une structure d'erreur pour que le composant puisse afficher le toast
    return { error: true, message: "Erreur serveur" };
  }
};

export const fetchDataFromApi = async (url) => {
  try {
    const { data } = await axios.get(apiUrl + url, { headers: getHeaders() });
    return data;
  } catch (error) {
    return formatError(error);
  }
};

export const uploadImage = async (url, updatedData) => {
  try {
    const response = await axios.put(apiUrl + url, updatedData, {
      headers: getHeaders("form"),
    });
    return response.data;
  } catch (error) {
    return formatError(error);
  }
};

export const uploadImages = async (url, formData) => {
  try {
    const response = await axios.post(apiUrl + url, formData, {
      headers: getHeaders("form"),
    });
    return response.data;
  } catch (error) {
    return formatError(error);
  }
};

export const editData = async (url, updatedData) => {
  try {
    const response = await axios.put(apiUrl + url, updatedData, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    return formatError(error);
  }
};

export const deleteImages = async (url) => {
  try {
    const { data } = await axios.delete(apiUrl + url, {
      headers: getHeaders("form"),
    });
    return data;
  } catch (error) {
    return formatError(error);
  }
};

export const deleteData = async (url, data = {}) => {
  try {
    const res = await axios.delete(apiUrl + url, {
      headers: getHeaders(),
      data, // 🔥 important pour envoyer un body
    });
    return res.data;
  } catch (error) {
    return formatError(error);
  }
};