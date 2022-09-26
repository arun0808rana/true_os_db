import TODB from './db/db.js';

const init = async () => {
    const dbOptions = {
        database: 'arun',
        collection: 'notes'
    }

    // making a new document
    const notes = new TODB(dbOptions);

    try {
        // writing to the document
        const writtenData = await notes.write({ hello: "kitty" });
        // write function returns the data of the document
        console.log("writtenData", writtenData);
    } catch (error) {
        console.error(error)
    }
    const document = await notes.findOne({
        hello4: "kitty4"
    });
    console.log('document', document)

}

init();