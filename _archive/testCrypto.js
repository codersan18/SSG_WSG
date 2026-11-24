require('dotenv').config();
const { encrypt, decrypt } = require('./services/ssgCrypto');

const plain = JSON.stringify({ course: { courseReferenceNumber: 'TGS-202600001' } });
const enc = encrypt(plain);

console.log('Encrypted:', enc);
console.log('Decrypted:', decrypt(enc));
console.log('Round trip OK:', decrypt(enc) === plain);