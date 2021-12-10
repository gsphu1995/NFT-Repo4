import Arweave from "arweave";

const initOptions = {
  host: "arweave.net", // Hostname or IP address for a Arweave host
  port: 443, // Port
  protocol: "https", // Network protocol http or https
  timeout: 20000, // Network request timeouts in milliseconds
  logging: false, // Enable network request logging
};

let key = null;
const arweave = Arweave.init(initOptions);

const runUpload = async (data, tags, isUploadByChunk = false) => {
  const tx = await arweave.createTransaction({ data: data }, key);

  Object.entries(tags).forEach(([key, value]) => {
    tx.addTag(key, value);
  })

  console.log("tx", tx)
  await arweave.transactions.sign(tx, key);

  if (isUploadByChunk) {
    const uploader = await arweave.transactions.getUploader(tx);

    while (!uploader.isComplete) {
      await uploader.uploadChunk();
      console.log(
        `${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`
      );
    }
  }

  //   Do we need to post with uploader?
  await arweave.transactions.post(tx);

  return tx;
}

export default async function uploader(files, metadata, mintKey) {
  key = await arweave.wallets.generate();

  for (const file in files) {
    let tags = {
      'Content-Type': file.type,
      'mint': mintKey,
    };
    const { id } = await runUpload(file, tags, true);
    const imageUrl = id ? `https://arweave.net/${id}` : undefined;
    console.log("imageUrl", imageUrl);

    // console.log(metadata);
    tags = {
      'Content-Type': 'application/json',
      'mint': mintKey,
    };
    const { id: metadataId } = await runUpload(metadata, tags);
    
    const metadataUrl = id ? `https://arweave.net/${metadataId}` : undefined;
    return metadataUrl
  }
};
