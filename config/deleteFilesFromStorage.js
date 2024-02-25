const axios = require('axios');


const deleteFilesFromStorage = async (destination,files) => {
    try { 
        
         await axios.delete(`${process.env.SERVER_STORAGE_BASE_URI}/${destination}`, { data: { filenames: files } } );

    } catch (err) {
        throw new Error(' Storage Error : '+err)
    }
    return

};

module.exports = deleteFilesFromStorage;
