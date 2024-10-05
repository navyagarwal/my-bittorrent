function decodeBencode(bencodedValue: string): string | number | Array<any> {
    if (!isNaN(parseInt(bencodedValue[0]))) {
        return decodeBencodeString(bencodedValue);
    } else if (bencodedValue[0] == 'i' && bencodedValue[bencodedValue.length-1] == 'e') {
        return decodeBencodeNumber(bencodedValue);
    } else if (bencodedValue[0] == 'l' && bencodedValue[bencodedValue.length-1] == 'e') {
        return decodeBencodeList(bencodedValue);
    } else {
        throw new Error("Only strings and numbers are supported at this moment.");
    }
}

function decodeBencodeString(bencodedValue: string): string {
    const firstColonIndex = bencodedValue.indexOf(":");
    if (firstColonIndex === -1) {
        throw new Error("Invalid encoded value");
    }
    const lenStr = bencodedValue.substring(0, firstColonIndex);
    const len = parseInt(lenStr);
    return bencodedValue.substring(firstColonIndex + 1, len);
}

function decodeBencodeNumber(bencodedValue: string): number {
    const numberStr = bencodedValue.substring(1, bencodedValue.length - 2);
    const ans = parseInt(numberStr);
    return ans;
}

function decodeBencodeList(bencodedValue: string): Array<any> {
    const ans = new Array<any>;
    let listStr = bencodedValue.substring(1, bencodedValue.length - 2);
    while(listStr.length > 0){
        if(!isNaN(parseInt(listStr[0]))){
            const lenStr = bencodedValue.substring(0, listStr.indexOf(":"));
            ans.push(decodeBencodeString(listStr));
            listStr = listStr.substring(parseInt(lenStr)+lenStr.length+1);
        } else {
            const first_e_index = listStr.indexOf("e");
            if(listStr[0] == 'i'){
                ans.push(decodeBencodeNumber(listStr.substring(0, first_e_index+1)));
            } else {
                ans.push(decodeBencodeList(listStr.substring(0, first_e_index+1)));
            }
            listStr = listStr.substring(first_e_index+1);
        }
    }
    return ans;
}

function decodeBencodeDictionary(bencodedValue: string): Map<any, any> {
    let dictionary = new Map<any, any>;
    const list = decodeBencodeList(bencodedValue);
    if(list.length%2 == 0){
        let i = 0;
        while(i < list.length){
            dictionary.set(list[i], list[i+1]);
            i += 2;
        }
    }
    return dictionary;
}

const args = process.argv;
const bencodedValue = args[3];

if (args[2] === "decode") {
    try {
        const decoded = decodeBencode(bencodedValue);
        console.log(JSON.stringify(decoded));
    } catch (error) {
        if(error instanceof Error){
            console.error(error.message);
        }
    }
}
