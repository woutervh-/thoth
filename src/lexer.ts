import * as stream from "stream";
import * as fs from "fs";
import * as path from "path";

interface Token {
    emit: boolean;
}

const stream = fs.createReadStream(path.resolve(__dirname, "..", "test", "hello-world.th"), { encoding: "utf-8" });

