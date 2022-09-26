const fs = require('fs');
const fsp = fs.promises;

// resolves to true or false
async function compareFiles(fname1, fname2) {
    const kReadSize = 1024 * 8;
    let h1, h2;
    try {
        h1 = await fsp.open(fname1);
        h2 = await fsp.open(fname2);
        const [stat1, stat2] = await Promise.all([h1.stat(), h2.stat()]);
        if (stat1.size !== stat2.size) {
            return false;
        }
        const buf1 = Buffer.alloc(kReadSize);
        const buf2 = Buffer.alloc(kReadSize);
        let pos = 0;
        let remainingSize = stat1.size;
        while (remainingSize > 0) {
            let readSize = Math.min(kReadSize, remainingSize);
            let [r1, r2] = await Promise.all([h1.read(buf1, 0, readSize, pos), h2.read(buf2, 0, readSize, pos)]);
            if (r1.bytesRead !== readSize || r2.bytesRead !== readSize) {
                throw new Error("Failed to read desired number of bytes");
            }
            if (buf1.compare(buf2, 0, readSize, 0, readSize) !== 0) {
                return false;
            }
            remainingSize -= readSize;
            pos += readSize;
        }
        return true;
    } finally {
        if (h1) {
            await h1.close();
        }
        if (h2) {
            await h2.close();
        }
    }
}

// sample usage
compareFiles(__dirname + '/db/test.json', __dirname + '/db/test3.json').then(result => {
    console.log(result);
}).catch(err => {
    console.log(err);
});
