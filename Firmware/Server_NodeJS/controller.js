var STRAIDE = require("./straide.js");

async function main(args) {
    await STRAIDE.Start();
    return Promise.resolve();
}

main();