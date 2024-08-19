/*
 * Downloads `a2sui.tar.gz` and unpacks it.
 * Written in JS to increase portability.
 */

import fs from 'fs';
import fetch from 'node-fetch';
import tar from 'tar';


const URI = 'https://adder2snake.vercel.app/a2sui.tar.gz',
      TAR_FN = 'a2sui.tar.gz';

async function main() {
    console.log('📦 Downloading ' + URI);
    let resp = await fetch(URI);
    const dest = fs.createWriteStream(TAR_FN),
          download = resp.body.pipe(dest);
    await new Promise((resolve, reject) => {
        download.on("close", () => resolve("it worked"));
        dest.on("error", reject);
    });
    var cnt = 0;
    await tar.x({file: TAR_FN, onentry: () => cnt++});
    console.log(`🗂  Done (${cnt} files extracted).`);
}


main();
