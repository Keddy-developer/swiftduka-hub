import axios from "axios";

/**
 * Uploads a file to Cloudinary using a signed direct upload.
 * Fetches the signature from the backend to keep credentials secure.
 */
const uploadToCloudinary = async (file) => {
  const token = localStorage.getItem("fulfillment_token"); // Standard for fulfillment dashboard

  const apiUrl = import.meta.env.VITE_APP_API_URL || "http://localhost:5000/api";
  
  const { data } = await axios.get(
    `${apiUrl}/cloudinary/signature`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", data.apiKey);
  formData.append("signature", data.signature);
  formData.append("timestamp", data.timestamp);
  formData.append("folder", data.folder);
  formData.append("public_id", data.public_id);
  formData.append("overwrite", "true");
  formData.append("return_delete_token", "true");

  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${data.cloudName}/auto/upload`,
    formData,
    {
      withCredentials: false,
    }
  );
  
  const imageUrl = response.data.secure_url;
  const deleteToken = response.data.delete_token;
  const publicId = response.data.public_id;

  return { imageUrl, deleteToken, publicId };
};

export default uploadToCloudinary;
