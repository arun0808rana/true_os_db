import fs from 'fs';

// __dirname is undefined while using es 6 style js
// fixing it using path
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class TODB {
    constructor(databaseOptions) {
        this.fs = fs;
        this.database = databaseOptions.database;
        this.collection = databaseOptions.collection;
    }

    #read() {
        let startTime = Date.now();
        return new Promise((resolve, reject) => {
            const filename = __dirname + `/${this.database}/${this.collection}.txt`;
            let lines = [];
            let chunks = '';
            const readStream = this.fs.createReadStream(filename, { encoding: 'utf-8' });
            let error;

            // Handle any errors while reading
            readStream.on('error', err => {
                // database not found
                if (!this.fs.existsSync(__dirname + '/' + this.database)) {
                    const errorReason = `[ERROR]: Database with the name ${this.database} does not exists.`;
                    error = {
                        error: true,
                        errorReason,
                        errorCode: 'DB NOT FOUND',
                        err,
                    }
                } else if (!this.fs.existsSync(filename)) {
                    // collection not found
                    const errorReason = `[ERROR]: Collection with the name ${this.collection} does not exists.`;
                    error = {
                        error: true,
                        errorReason,
                        errorCode: 'COLLECTION NOT FOUND',
                        err,
                    }
                } else {
                    // something else happened
                    error = {
                        error: true,
                        errorReason: err.message,
                        err,
                    }
                }
            });

            // Listen for data
            readStream.on('data', chunk => {
                console.log('chunk', chunk);
                for (let char of chunk) {
                    chunks += char;
                    if (char === '\n') {
                        lines.push(chunks);
                        chunks = ''
                    }
                }
            });

            // File is done being read
            readStream.on('close', () => {
                console.log('lines', lines)
                if (error) {
                    // console.error(error.errorReason);
                    reject(error);
                } else {
                    let data = '';
                    if (lines.length > 0) {
                        data = lines.join('');
                    }
                    let endTime = Date.now();
                    console.log('[READ]: Document read in', (endTime - startTime), 'ms.');
                    resolve(data);
                }
            });
        })
    }

    // `let writer = this.fs.createWriteStream(this.collection);` needs to be only after `await this.read()`
    //  else some weird happens and there is no data chunks on data event inside read function
    async write(doc, shouldAppend) {
        let startTime = Date.now();
        return new Promise(async (resolve, reject) => {
            const filename = __dirname + `/${this.database}/${this.collection}.txt`;

            // stingifying if doc is object rather than a string
            if (!this.isJsonString(doc)) {
                doc = JSON.stringify(doc) + '\n';
            }

            let collectionData = '';

            //read collection
            try {
                collectionData = await this.#read();
                console.log('collectionData', collectionData)
            } catch (error) {
                if (error.errorCode === 'DB NOT FOUND') {
                    console.error(error.errorReason);
                    console.warn(`[WARNING]: Creating database ${this.database} and collection ${this.collection}.`)
                    // make db if not exists
                    this.fs.mkdirSync(__dirname + '/' + this.database);
                } else if (error.errorCode === 'COLLECTION NOT FOUND') {
                    console.error(error.errorReason);
                    console.warn(`[WARNING]: Creating collection ${this.collection}.`)
                }
            }

            // create stream
            let writeStream;

            // should doc be appended or not at the end of the collection 
            if (shouldAppend) {
                writeStream = this.fs.createWriteStream(filename, { flags: 'a' });
                writeStream.write(doc);
            } else {
                writeStream = this.fs.createWriteStream(filename);
                // append doc to collection's data
                collectionData += doc;
                // write collectionData to file
                writeStream.write(collectionData);
            }

            // event listeners for write streams
            writeStream.on('finish', () => {
                let endTime = Date.now();
                console.log('[WRITE]: Document written in', (endTime - startTime), 'ms.');
                resolve(`[${collectionData}]`);
            });
            writeStream.on('error', reject);
            // mandatory, else on write stream's `finish` event wont fire off
            writeStream.end();
        })
    }

    async findOne(query) {
        try {
            const { default: deepCompare } = await import('./deepCompare.js');
            const collectionData = await this.#read();
            const found = await collectionData.find(doc => {
                return deepCompare(doc, query);
            })
            return found;
        } catch (error) {
            console.error(error, 'error inside findOne fn')
        }

    }

    async findAll(query) {
        try {
            // check if query is empty
            // because Object.keys(new Date()).length === 0;
            // we have to do some additional check
            const isQueryValid = query // 👈 null and undefined check
                && Object.keys(query).length === 0
                && Object.getPrototypeOf(query) === Object.prototype;

            const collectionData = await this.#read();

            if (!isQueryValid) {
                return collectionData;
            }

            const { default: deepCompare } = await import('./deepCompare.js');
            return await collectionData.filter(doc => {
                return deepCompare(doc, query);
            });
        } catch (error) {
            console.error(error, '[ERROR]: Error while finding all documents.')
        }
    }

    async updateOne(query, updateData) {
        const currentDoc = await this.findOne(query);
        for (const key in currentDoc) {
            currentDoc[key] = updateData[key];
        }
        return updatedDoc;
    }



    // helpers
    isJsonString(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }
}