const fs = require('fs')
class loda {
    read() {
        let chunks = []
        const readStream = fs.createReadStream('/home/dev/Desktop/pro/true_os_db/db/arun/notes.json', 'utf-8');
        readStream.on('error', (error) => console.log(error.message));
        readStream.on('data', (chunk) => chunks.push(chunk));
        readStream.on('end', () => console.log('Reading complete', chunks));

    }
}


const x = new loda();
x.read();

// /home/dev/Desktop/pro/true_os_db/db/arun
// db/arun/notes.json


// home/dev/Desktop/pro/true_os_db/db/arun/notes.json