import { SubscriptMap} from "../model/types";


const SUBSCRIPT_MAP: SubscriptMap = {
    "0": "\u2080",
    "1": "\u2081",
    "2": "\u2082",
    "3": "\u2083",
    "4": "\u2084",
    "5": "\u2085",
    "6": "\u2086",
    "7": "\u2087",
    "8": "\u2088",
    "9": "\u2089",
  };

export const formatDecimals = (num: number, roundedNumber: number) => {
    if (
      (Number(num.toString().replace(",", ".")) > 0 &&
      Number(num.toString().replace(",", ".")) < 1) ||
      (Number(num.toString().replace(",", ".")) < 0 &&
      Number(num.toString().replace(",", ".")) > -1) 
    ) {
      let numStr = num.toString().replace(",", ".");
      if (numStr.indexOf("e") !== -1) {
        const parts = numStr.split("e");
        const exponentPart = parts[1];
        const exponent = Math.abs(parseInt(exponentPart, 10));
        const result = num.toFixed(exponent);
        numStr = result;
      }
      
      const parts = numStr.split(".");
      if (parts.length < 2) return roundedNumber.toString();
      const decimalPart = parts[1];
      const totalLeadingZeros = (decimalPart.match(/^0+/)?.[0].length || 0);

      // We use subscript notation when there are 3+ leading zeros
      // The subscript shows: total leading zeros - 1
      // Example: 0.00001 has 4 leading zeros → subscript ₃
      if (totalLeadingZeros >= 3) {
        const leadingZeros = totalLeadingZeros - 1;
        const trimmedDecimals = decimalPart.replace(/^0+/, "");
        const noTrailingZeros = trimmedDecimals.replace(/0+$/, "");
        const firstDigits = noTrailingZeros.slice(0, 2);
  
        const subscriptZeros = leadingZeros
          .toString()
          .split("")
          .map((digit: string) => SUBSCRIPT_MAP[digit as keyof SubscriptMap])
          .join("");
  
        return `0.0${subscriptZeros} ${firstDigits}`;
      }
    }
    return roundedNumber.toString();
  };


/**
 * The formatCurrency function formats a random number into en-US currency format.
 * @param number
 * @returns Currency value  based on US format rules.
 */
export const formatCurrency = (number: number | null): string => {
    if (isNaN(Number(number)) || number === null) {
      return "--";
    }
  
    const num = Number(number?.toString().replace(",", "."));
    const roundedNumber = Number(num.toFixed(2));
  
    if ((num > 0 && num < 1 )|| (num < 0 && num > -1)) {
      const formattedDecimals = formatDecimals(num, roundedNumber);
      return `$${formattedDecimals}`;
    }
  
    const formattedCurrency = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(num));
    return formattedCurrency;
  };


  /**
 * Use this function to return any value, which should have not more than two digits.
 * @param number
 * @returns A value with a maximum of two digits.
 */
export const formatValue = (number: number): string | undefined => {
    if (isNaN(Number(number.toString().replace(",", ".")))) {
      return "--";
    }
  
    const num = Number(number.toString().replace(",", "."));
    let roundedNumber = Number(num.toFixed(2));
  
    if ((num > 0 && num < 1) || (num < 0 && num > -1)) {
      roundedNumber = Number(num.toFixed(4));
      const formattedDecimals = formatDecimals(num, roundedNumber);
      return formattedDecimals;
    }

    if (Math.abs(roundedNumber) < 1000000) {
      return roundedNumber.toFixed(2);
    } else if (Math.abs(roundedNumber) < 1000000000) {
      return `${(roundedNumber / 1000000).toFixed(2)} M`;
    } else if (Math.abs(roundedNumber) < 1000000000000) {
      return `${(roundedNumber / 1000000000).toFixed(2)} B`;
    } else {
      return `${(roundedNumber / 1000000000000).toFixed(2)} T`;
    }
  };
