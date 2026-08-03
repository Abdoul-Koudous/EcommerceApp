import multer from "multer";

// ✅ memoryStorage : le fichier reste en RAM (dans un Buffer accessible via file.buffer),
// jamais écrit sur disque — évite toute dépendance à un dossier physique qui doit exister
// sur le serveur (fragile sur un hébergeur au système de fichiers éphémère comme Render)
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

export default upload;