import { readFileSync } from "fs";
import { bencode, isRecord } from "./encoders";
import { createHash } from "crypto";

function decodeBencode(bencodedValue: string): [string | number | Array<any> | Record<string, any>, number] {
    if (!isNaN(parseInt(bencodedValue[0]))) {
        return decodeBencodeString(bencodedValue);
    } else if (bencodedValue[0] == 'i') {
        return decodeBencodeNumber(bencodedValue);
    } else if (bencodedValue[0] == 'l') {
        return decodeBencodeList(bencodedValue);
    } else if (bencodedValue[0] == 'd') {
        return decodeBencodeDictionary(bencodedValue);
    } else {
        throw new Error("Only strings, numbers, lists and dictionaries are supported!");
    }
}

function decodeBencodeString(bencodedValue: string): [string, number] {
    const firstColonIndex = bencodedValue.indexOf(":");
    if (firstColonIndex === -1) {
        throw new Error("Invalid encoded value");
    }
    const lenStr = bencodedValue.substring(0, firstColonIndex);
    const len = parseInt(lenStr);
    return [bencodedValue.substring(firstColonIndex + 1, firstColonIndex + 1 + len), firstColonIndex + 1 + len];
}

function decodeBencodeNumber(bencodedValue: string): [number, number] {
    const firstEIndex = bencodedValue.indexOf("e");
    const numberStr = bencodedValue.substring(1, firstEIndex);
    const ans = parseInt(numberStr);
    return [ans, firstEIndex+1];
}

function decodeBencodeList(bencodedValue: string): [Array<any>, number] {
    const ans = new Array<any>;
    let index = 1;
    while(bencodedValue[index] != 'e'){
        const [parsedStr, len] = decodeBencode(bencodedValue.substring(index));
        ans.push(parsedStr);
        index += len;
    }
    return [ans, index+1];
}

function decodeBencodeDictionary(bencodedValue: string): [Record<string, any>, number] {
    let dictionary: Record<string, any> = {};
    let index = 1;
    while(bencodedValue[index] != 'e'){
        const [key, keyLength] = decodeBencode(bencodedValue.substring(index));
        index += keyLength;
        const [value, valueLength] = decodeBencode(bencodedValue.substring(index));
        index += valueLength;
        if(typeof key === 'string'){
            dictionary[key] = value;
        } else {
            throw new Error("Dictionary keys can only be strings!");
        }
    }
    return [dictionary, index+1];
}

function generateInfoHash(infoMap: Record<string, any>): string {
    const bencodedStr = bencode(infoMap);
    const buffer = Buffer.from(bencodedStr, "binary");
    const infoHash = createHash("sha1").update(buffer).digest("hex");
    return infoHash;
}

const args = process.argv;

if (args[2] === "decode") {
    const bencodedValue = args[3];
    try {
        const [decoded, _] = decodeBencode(bencodedValue);
        console.log(JSON.stringify(decoded));
    } catch (error) {
        if(error instanceof Error){
            console.error(error.message);
        }
    }
} else if (args[2] === "info") {
    const torrentFile = args[3];
    const contents = readFileSync(torrentFile).toString("binary");
    const [decoded, decodedLength] = decodeBencode(contents);
    if(isRecord(decoded)){
        const torrent = decoded;
        if(!("announce" in torrent) || !("info" in torrent)){
            throw new Error("Invalid Torrent File");
        }
        const pieceHashes = torrent["info"]["pieces"];
        let formattedPieceHashes = "";
        for (let i = 0; i < pieceHashes.length; i += 40) {
            formattedPieceHashes += pieceHashes.slice(i, i + 40) + "\n";
        }
        console.log(`   Tracker URL: ${torrent["announce"]}\n
                        Length: ${torrent["info"]["length"]}\n
                        Info Hash: ${generateInfoHash(torrent["info"])}\n
                        Piece Length: ${torrent["info"]["piece length"]}\n
                        Piece Hashes: \n${formattedPieceHashes}\n
                    `);
    }
}