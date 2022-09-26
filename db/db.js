module.exports = class TODB {
    constructor(databaseOptions) {
        this.fs = require('fs');
        this.database = databaseOptions.database;
        this.collection = __dirname + `/${databaseOptions.database}/${databaseOptions.collection}.json`;

        // make db if not exists
        if (!this.fs.existsSync(__dirname + '/' + this.database)) {
            this.fs.mkdirSync(__dirname + '/' + this.database);
        }
    }

    read() {
        let startTime = Date.now();
        return new Promise((resolve, reject) => {
            let chunks = [];
            const readStream = this.fs.createReadStream(this.collection);

            // Handle any errors while reading
            readStream.on('error', err => {
                console.log('Error while Reading')
                reject(err)
            });

            // Listen for data
            readStream.on('data', chunk => {
                chunks.push(chunk);
            });

            // File is done being read
            readStream.on('close', () => {
                let data;
                if (chunks.length > 0) {
                    data = JSON.parse(Buffer.concat(chunks).toString());
                } else {
                    data = [];
                }
                let endTime = Date.now();
                console.log('Read document in', (endTime - startTime), 'ms.');
                resolve(data);
            });
        })
    }

    // `let writer = this.fs.createWriteStream(this.collection);` needs to be only after `await this.read()`
    //  else some weird happens and there is no data chunks on data event inside read function
    async write(doc) {
        return new Promise(async (resolve, reject) => {
            let startTime = Date.now();
            if (this.isJsonString(doc)) {
                doc = JSON.parse(doc);
            }

            //read collection
            let collectionData = await this.read();

            // create stream
            let writeStream = this.fs.createWriteStream(this.collection);

            // append doc to collection's array
            collectionData.push(doc);
            // 4 is spaces in indentation
            collectionData = JSON.stringify(collectionData, null, 2);
            // write collectionData to file
            writeStream.write(collectionData);

            writeStream.on('finish', () => {
                let endTime = Date.now();
                console.log('Wrote document in', (endTime - startTime), 'ms.');
                resolve(collectionData);
            });
            writeStream.on('error', reject);
            // mandatory, else on write stream's `finish` event wont fire off
            writeStream.end();
        })
    }

    isJsonString(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }
}