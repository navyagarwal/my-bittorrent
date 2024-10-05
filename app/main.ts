import fs from "fs";

function decodeBencode(bencodedValue: string): [string | number | Array<any> | Map<any, any>, number] {
    if (!isNaN(parseInt(bencodedValue[0]))) {
        return decodeBencodeString(bencodedValue);
    } else if (bencodedValue[0] == 'i' && bencodedValue[bencodedValue.length-1] == 'e') {
        return decodeBencodeNumber(bencodedValue);
    } else if (bencodedValue[0] == 'l' && bencodedValue[bencodedValue.length-1] == 'e') {
        return decodeBencodeList(bencodedValue);
    } else if (bencodedValue[0] == 'd' && bencodedValue[bencodedValue.length-1] == 'e') {
        return decodeBencodeDictionary(bencodedValue);
    } else {
        throw new Error("Only strings and numbers are supported at this moment.");
    }
}

function decodeBencodeString(bencodedValue: string): [string, number] {
    const firstColonIndex = bencodedValue.indexOf(":");
    if (firstColonIndex === -1) {
        throw new Error("Invalid encoded value");
    }
    const lenStr = bencodedValue.substring(0, firstColonIndex);
    const len = parseInt(lenStr);
    return [bencodedValue.substring(firstColonIndex + 1, firstColonIndex + 1 + len), len];
}

function decodeBencodeNumber(bencodedValue: string): [number, number] {
    const firstEIndex = bencodedValue.indexOf("e");
    const numberStr = bencodedValue.substring(1, firstEIndex);
    const ans = parseInt(numberStr);
    return [ans, firstEIndex-1];
}

function decodeBencodeList(bencodedValue: string): [Array<any>, number] {
    const ans = new Array<any>;
    let index = 1;
    while(bencodedValue[index] != 'e'){
        bencodedValue = bencodedValue.substring(index);
        const [parsedStr, len] = decodeBencode(bencodedValue);
        index += len;
    }
    return [ans, index+1];
}

function decodeBencodeDictionary(bencodedValue: string): [Map<any, any>, number] {
    let dictionary = new Map<any, any>;
    let index = 1;
    while(bencodedValue[index] != 'e'){
        const [key, keyLength] = decodeBencode(bencodedValue.substring(index));
        index += keyLength;
        const [value, valueLength] = decodeBencode(bencodedValue.substring(index));
        index += valueLength;
    }
    return [dictionary, index+1];
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
    const contents = fs.readFileSync(torrentFile, "utf-8");
    const [decoded, decodedLength] = decodeBencode(contents);
    if(decoded instanceof Map){
        const torrent = decoded;
        if(!torrent.has("announce") || !torrent.has("info")){
            throw new Error("Invalid Torrent File");
        }
        console.log(`Tracker URL: ${torrent.get("announce")}\nLength: ${torrent.get("info").get("length")}`);
    }
}