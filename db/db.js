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
            const filename = __dirname + `/${this.database}/${this.collection}.json`;
            let chunks = [];
            const readStream = this.fs.createReadStream(filename);
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
                chunks.push(chunk);
            });

            // File is done being read
            readStream.on('close', () => {
                if (error) {
                    // console.error(error.errorReason);
                    reject(error);
                } else {
                    let data;
                    if (chunks.length > 0) {
                        data = JSON.parse(Buffer.concat(chunks).toString());
                    } else {
                        data = [];
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
    async write(doc) {
        let startTime = Date.now();
        return new Promise(async (resolve, reject) => {
            const filename = __dirname + `/${this.database}/${this.collection}.json`;

            // checking if doc is object or string
            if (this.isJsonString(doc)) {
                doc = JSON.parse(doc);
            }

            let collectionData = [];

            //read collection
            try {
                collectionData = await this.#read();
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
            let writeStream = this.fs.createWriteStream(filename);

            // append doc to collection's array
            collectionData.push(doc);
            // 4 is spaces in indentation
            collectionData = JSON.stringify(collectionData, null, 2);
            // write collectionData to file
            writeStream.write(collectionData);

            writeStream.on('finish', () => {
                let endTime = Date.now();
                console.log('[WRITE]: Document written in', (endTime - startTime), 'ms.');
                resolve(collectionData);
            });
            writeStream.on('error', reject);
            // mandatory, else on write stream's `finish` event wont fire off
            writeStream.end();
        })
    }

    async findOne(query){
        try {
            const {default: deepCompare} = await import('./deepCompare.js');
            const collectionData = await this.#read();
            const found = await collectionData.find(doc=>{
                return deepCompare(doc, query);
            })
            return found;
        } catch (error) {
            console.error(error, 'error inside findOne fn')
        }

    }

    findAll(){

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