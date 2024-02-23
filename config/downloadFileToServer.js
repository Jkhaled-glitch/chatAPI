const axios = require('axios');
const fs = require('fs'); // Importer le module 'fs' pour lire le contenu du fichier

const downloadFileToServer = async (file, destination) => {
    try {
       
        const blob = new Blob([file.buffer], { type: file.mimetype });
        const formData = new FormData();
        // Ajouter le Blob à FormData
        formData.append('file', blob, file.originalname);

        // Effectuer la requête POST vers le serveur distant avec le fichier sous forme de buffer
        const response = await axios.post(`${process.env.SERVER_STORAGE_BASE_URI}/${destination}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        const fileUrl = response.data.url;
        return fileUrl;
    } catch (err) {
        throw new Error('Storage Error : '+err)
    }

};

module.exports = downloadFileToServer;
