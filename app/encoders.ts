export function isRecord(input: any): input is Record<string, any> {
    return (
        input !== null &&
        typeof input === 'object' &&
        !Array.isArray(input) &&
        Object.keys(input).every(key => typeof key === 'string')
    );
}

export function bencode(input: any): string {
    if(typeof input === 'string') {
        return encodeStr(input);
    } else if(typeof input === 'number') {
        return encodeInt(input);
    } else if(input instanceof Array) {
        return encodeList(input);
    } else if(isRecord(input)) {
        return encodeDict(input);
    } else {
        throw new Error("Only strings, numbers, lists and dictionaries can be bencoded!");
    }
}

function encodeDict(map: Record<string, any>): string {
    let bencodedStr = "d";
    for (const [key, value] of Object.entries(map)) {
        bencodedStr += encodeStr(key);
        bencodedStr += bencode(value);
    }
    bencodedStr += "e";
    return bencodedStr;
}

function encodeList(list: Array<any>): string {
    let bencodedStr = "l";
    list.forEach((item) => {
        bencodedStr += bencode(item);
    })
    bencodedStr += "e";
    return bencodedStr;
}

function encodeInt(num: number): string {
    let bencodedStr = "i";
    bencodedStr += num.toString();
    bencodedStr += "e";
    return bencodedStr;
}

function encodeStr(str: string): string {
    let bencodedStr = "";
    const len = str.length;
    bencodedStr += len.toString();
    bencodedStr += ":";
    bencodedStr += str;
    return bencodedStr;
}