export function arrayToString(array) {
  return String.fromCharCode.apply(null, new Uint16Array(array.buffer));
}

export function base64DecodeUint8Array(input) {
  const raw = window.atob(input);

  const rawLength = raw.length;

  const array = new Uint8Array(new ArrayBuffer(rawLength));

  for (let i = 0; i < rawLength; i++) {
    array[i] = raw.charCodeAt(i);
  }

  return array;
}

export function base64EncodeUint8Array(input) {
  const keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let chr1;
  let chr2;
  let chr3;
  let enc1;
  let enc2;
  let enc3;
  let enc4;
  let i = 0;
  let output = '';

  while (i < input.length) {
    chr1 = input[i++];
    chr2 = i < input.length ? input[i++] : Number.NaN; // Not sure if the index
    chr3 = i < input.length ? input[i++] : Number.NaN; // checks are needed here

    enc1 = chr1 >> 2;
    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    enc4 = chr3 & 63;

    if (isNaN(chr2)) {
      enc3 = enc4 = 64;
    } else if (isNaN(chr3)) {
      enc4 = 64;
    }

    output += keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
  }

  return output;
}

export function concatInitDataIdAndCertificate(initData, id, certificate) {
  if (typeof id === 'string') {
    id = stringToArray(id);
  }

  // Format:
  // [initData]
  // [4 byte: idLength]
  // [idLength byte: id]
  // [4 byte:certificateLength]
  // [certificateLength byte: certificate]

  const size = initData.byteLength + 4 + id.byteLength + 4 + certificate.byteLength;
  let offset = 0;

  const buffer = new ArrayBuffer(size);

  const dataView = new DataView(buffer);

  const initDataArray = new Uint8Array(buffer, offset, initData.byteLength);
  initDataArray.set(initData);
  offset += initData.byteLength;

  dataView.setUint32(offset, id.byteLength, true);
  offset += 4;

  const idArray = new Uint16Array(buffer, offset, id.length);
  idArray.set(id);
  offset += idArray.byteLength;

  dataView.setUint32(offset, certificate.byteLength, true);
  offset += 4;

  const certificateArray = new Uint8Array(buffer, offset, certificate.byteLength);
  certificateArray.set(certificate);

  return new Uint8Array(buffer, 0, buffer.byteLength);
}

export function stringToArray(string) {
  const length = string.length;

  // 2 bytes for each char
  const buffer = new ArrayBuffer(length * 2);

  const array = new Uint16Array(buffer);

  for (let i = 0; i < length; i++) {
    array[i] = string.charCodeAt(i);
  }

  return array;
}

export function getHostnameFromURI(uri) {
  const link = document.createElement('a');

  link.href = uri;

  return link.hostname;
}
