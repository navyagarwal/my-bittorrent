import { readFileSync } from "fs";
import { bencode, isRecord } from "./encoders";
import { createHash } from "crypto";
import axios from "axios";
import { errorMonitor } from "events";

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

function decodeTorrentFile (torrentFile: string): Record<string, any> {
    const contents = readFileSync(torrentFile).toString("binary");
    const [decoded, decodedLength] = decodeBencode(contents);
    if(isRecord(decoded) && "announce" in decoded && "info" in decoded){
        return decoded;
    } else {
        throw new Error("Invalid Torrent File");
    }
}

function getPieceHashes(inputStr: string): string {
    const pieceHashesBuffer = Buffer.from(inputStr, "binary");
    let formattedPieceHashes = "";
    for (let i = 0; i < pieceHashesBuffer.length; i += 20) {
        const pieceHash = pieceHashesBuffer.subarray(i, i + 20).toString("hex");
        formattedPieceHashes += pieceHash + "\n";
    }
    return formattedPieceHashes;
}

async function getPeers(info_hash: string, peer_id: string = "1235678", port: string = "6881", uploaded: number = 0, downloaded: number = 0, left: number = 0, compact: number = 1): Promise<string> {
    try{
        const response = await axios.get('https://api.example.com/data', {
            params: {
                info_hash,
                peer_id,
                port,
                uploaded,
                downloaded,
                left,
                compact
            }
        }); 
        return response.data;
    } catch(error) {
        console.error(error);
        throw error;
    }
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
    const torrent = decodeTorrentFile(torrentFile);
    const formattedPieceHashes = getPieceHashes(torrent["info"]["pieces"]);
    console.log(`Tracker URL: ${torrent["announce"]}\nLength: ${torrent["info"]["length"]}\nInfo Hash: ${generateInfoHash(torrent["info"])}\nPiece Length: ${torrent["info"]["piece length"]}\nPiece Hashes: \n${formattedPieceHashes}`);
} else if (args[3] === "peers") {
    const torrentFile = args[3];
    const torrent = decodeTorrentFile(torrentFile);
    const infoHash = generateInfoHash(torrent["info"]);
    const peersResponse = await getPeers(infoHash);
    const peers = decodeBencode(peersResponse);
    if(isRecord(peers) && "peers" in peers){
        const peerList = peers.peers;
        if(peerList instanceof Array){
            peerList.forEach((element) => {
                console.log(element);
            })
        }} else {
            throw new Error("Not valid array of Peer IPs!");
        }
    } else {
        console.error("Peers is not a valid dictionary!");
}