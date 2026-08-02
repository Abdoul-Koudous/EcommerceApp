import axios from "axios";
const apiUrl = import.meta.env.VITE_API_URL;

export const postData = async (url, formData) => {
  try {
    const response = await fetch(apiUrl + url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("accesstoken")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    // On retourne toujours le JSON, même si response.ok est false
    return data;
  } catch (error) {
    console.error(error);
    // On retourne une structure d’erreur pour que le composant puisse afficher le toast
    return { error: true, message: "Erreur serveur" };
  }
};


export const fetchDataFromApi = async (url) => {
  try {
    const params = {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("accesstoken")}`,
        "Content-Type": "application/json",
      },
    };
    const { data } = await axios.get(apiUrl + url, params);
    return data;
  } catch (error) {
    console.log(error);
    // ✅ forme normalisée, cohérente avec postData/editData/deleteData —
    // permet à l'appelant de fiabiliser un `if (res?.success)` / `else`
    // au lieu de recevoir l'objet d'erreur brut d'axios (qui n'a pas `success`)
    return {
      error: true,
      success: false,
      message: error.response?.data?.message || error.message || "Erreur serveur",
    };
  }
};


export const uploadImage = async (url, updatedData) => {
  try {
    const params = {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("accesstoken")}`,
        "Content-Type": "multipart/form-data",
      },
    };
    const response = await axios.put(apiUrl + url, updatedData, params);
    return response.data;
  } catch (error) {
    console.log(error);
    return { error: true, message: error.message || "Erreur serveur" };
  }
};


export const uploadImages = async (url, formData) => {
  try {
    const params = {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("accesstoken")}`,
        "Content-Type": "multipart/form-data",
      },
    };
    const response = await axios.post(apiUrl + url, formData, params);
    return response.data;
  } catch (error) {
    console.log(error);
    return { error: true, message: error.message || "Erreur serveur" };
  }
};



export const editData = async (url, updatedData) => {
  try {
    const params = {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("accesstoken")}`,
        "Content-Type": "application/json",
      },
    };
    const response = await axios.put(apiUrl + url, updatedData, params);
    return response.data;
  } catch (error) {
    console.log(error);
    return { error: true, message: error.message || "Erreur serveur" };
  }
};

export const deleteImages = async (url) => {
  try {
    const params = {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accesstoken")}`,
      },
    };

    const { data } = await axios.delete(apiUrl + url, params);
    return data;

  } catch (error) {
    return { error: true, message: error.message };
  }
};


export const deleteData = async (url, data = {}) => {
  const params = {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accesstoken")}`,
    },
    data, // maintenant défini via l’argument
  };
  const res = await axios.delete(apiUrl + url, params);
  return res.data; 
}