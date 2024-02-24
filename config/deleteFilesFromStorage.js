const axios = require('axios');

const deleteFilesFromStorage = async (destination,filenames) => {
    console.log('deleteFilesFromStorage')
    try {
        
       
        await axios.delete(`${process.env.SERVER_STORAGE_BASE_URI}/${destination}`, {filenames} );
    } catch (err) {
        throw new Error('Storage Error : '+err)
    }
    return

};

module.exports = deleteFilesFromStorage;
