import { Blob, File, NFTStorage } from 'nft.storage';

const NFT_STORAGE_TOKEN = process.env.NEXT_PUBLIC_NFT_STORAGE_TOKEN;

const dataURLtoBlob = (dataURL) => {
  var arr = dataURL.split(',');
  var mime = arr[0].match(/:(.*?);/)[1];

  var bstr = atob(arr[1]);
  var n = bstr.length;
  var u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

const retrieve = async (cid) => {
  const res = await fetch(`https://${cid}.ipfs.nftstorage.link`);
  if (!res.ok) {
    throw new Error(`failed to get ${cid}`);
  }

  // request succeeded! do something with the response object here...
  const data = await res.json();
  return data;
};

const uploadPNG = async (imgBase64Str) => {
  const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });
  const blob = dataURLtoBlob(imgBase64Str);
  const cid = await client.storeBlob(blob);
  return cid;
};

export { uploadPNG, retrieve };
