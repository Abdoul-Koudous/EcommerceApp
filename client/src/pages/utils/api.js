import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

// 🔥 Fonction pour éviter répétition des headers
const getHeaders = (type = "json") => {
  const headers = {
    Authorization: `Bearer ${localStorage.getItem("accesstoken")}`,
  };

  // ✅ Pour "form" (multipart), on NE fixe PAS Content-Type manuellement.
  // Le navigateur/axios doit le générer lui-même pour inclure le "boundary"
  // (ex: multipart/form-data; boundary=----WebKitFormBoundary...), sinon
  // le serveur (multer) ne peut pas parser correctement les fichiers,
  // ce qui cause des uploads qui échouent de façon intermittente.
  if (type !== "form") {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

// ✅ Transforme une erreur axios en objet { error, success, message }
// en gardant le message envoyé par le serveur (ex : "Mot de passe actuel
// incorrect") au lieu du message générique d'axios
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

export const postDataFromApi = async (url, body) => {
  try {
    const { data } = await axios.post(apiUrl + url, body, {
      headers: getHeaders(),
    });
    return data;
  } catch (error) {
    return formatError(error);
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
    return formatError(error);
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
    return formatError(error);
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
    return formatError(error);
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
    return formatError(error);
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
    return formatError(error);
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
    return formatError(error);
  }
};