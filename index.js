const TODB = require('./db/db.js');

const init = async () => {
    const dbOptions = {
        database: 'arun',
        collection: 'notes'
    }

    const x = new TODB(dbOptions);
    const writtenData = await x.write({ hello: 'kitty' });
}

init();