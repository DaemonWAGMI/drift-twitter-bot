export async function delay(ms: number): Promise<number> {
  return new Promise(res => setTimeout(res, ms));
}

export function groupBy(data: Array<any>, key: string): { [key: string]: Array<any> } {
  return data.reduce((storage, item) => {
    const group = item[key];

    storage[group] = storage[group] || [];
    storage[group].push(item);

    return storage;
  }, {});
}

export function maskedAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(address.length - 6, address.length )}`;
}

export function sliceSlottedArray(previousHead: number, currentHead: number, slottedArray: any[]): any[] {
  if (previousHead >= currentHead) {
    return slottedArray.slice(previousHead).concat(slottedArray.slice(0, currentHead));
  } else {
    return slottedArray.slice(previousHead, currentHead);
  }
}

export function toTitleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
