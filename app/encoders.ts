export function bencode(input: any): string {
    if(typeof input === 'string') {
        return encodeStr(input);
    } else if(typeof input === 'number') {
        return encodeInt(input);
    } else if(input instanceof Array) {
        return encodeList(input);
    } else if(input instanceof Map) {
        return encodeDict(input);
    } else {
        throw new Error("Only strings, numbers, lists and dictionaries can be bencoded!");
    }
}

function encodeDict(map: Map<any, any>): string {
    let bencodedStr = "d";
    map.forEach((key, value) => {
        bencodedStr += bencode(key);
        bencodedStr += bencode(value);
    })
    return bencodedStr;
}

function encodeList(list: Array<any>): string {
    let bencodedStr = "l";
    list.forEach((item) => {
        bencodedStr += bencode(item);
    })
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