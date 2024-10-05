// Examples:
// - decodeBencode("5:hello") -> "hello"
// - decodeBencode("10:hello12345") -> "hello12345"
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
    /* This function is used to decode a bencoded string
    The bencoded string is a string that is prefixed by the length of the string
    **/
    const firstColonIndex = bencodedValue.indexOf(":");
    if (firstColonIndex === -1) {
        throw new Error("Invalid encoded value");
    }
    return bencodedValue.substring(firstColonIndex + 1);
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
            ans.push(decodeBencodeString(listStr.substring(0, parseInt(listStr[0])+2)));
            listStr = listStr.substring(parseInt(listStr[0])+3);
        } else {
            const first_e_index = bencodedValue.indexOf("e");
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
