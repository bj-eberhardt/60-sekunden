const ulidEncoding = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function createCatalogId(now = Date.now()) {
  return `${encodeTime(now)}${encodeRandom()}`;
}

function encodeTime(now: number) {
  let value = Math.floor(now);
  let output = '';

  for (let index = 0; index < 10; index += 1) {
    output = ulidEncoding[value % 32] + output;
    value = Math.floor(value / 32);
  }

  return output;
}

function encodeRandom() {
  const randomValues = new Uint8Array(16);
  crypto.getRandomValues(randomValues);

  let output = '';

  for (let index = 0; index < 16; index += 1) {
    output += ulidEncoding[randomValues[index] % 32];
  }

  return output;
}
