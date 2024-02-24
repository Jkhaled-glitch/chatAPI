const axios = require('axios');
const fs = require('fs'); 

const downloadFileToServer = async (file, destination) => {
    try {
       
        const blob = new Blob([file.buffer], { type: file.mimetype });
        const formData = new FormData();
        
        formData.append('file', blob, file.originalname);

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
