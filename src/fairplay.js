import { stringToArray } from './util';

export default function concatInitDataIdAndCertificate(initData, id, certificate) {
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
  offset += initDataArray.byteLength;

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
