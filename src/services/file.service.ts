import { s3Client, s3Bucket } from "../config/s3.config";
import { randomUUID } from "crypto";
import {
  PutObjectCommand,
  DeleteObjectCommand,
//   GetObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs/promises";
import url from "url";
import sharp from "sharp"; 
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";


async function uploadPicture( file: string, folderName: string, fileExtension: string): Promise<string> {
  const bucketParams = {
    Bucket: s3Bucket,
    Key: folderName + "/" + randomUUID() + fileExtension,
    Body: await fs.readFile(file),
  };

  await s3Client.send(new PutObjectCommand(bucketParams));
  return bucketParams.Key;
}
// To use uploadPicture for example:
// const path = require("path");
// const fileExtension = path.extname(file.originalname);

// const uploadedKey = await uploadPicture(req.file.path, folderName, fileExtension);
// await fs.unlink(req.file.path);
// console.log("Uploaded key:", uploadedKey);


async function deleteImage(key: string): Promise<void> {
  const parsedUrl = url.parse(key);
  const objectKey = parsedUrl.pathname?.substring(1); 

  const bucketParams = {
    Bucket: s3Bucket,
    Key: objectKey,
  };
  try {
    await s3Client.send(new DeleteObjectCommand(bucketParams));
    console.log("Image  deleted from AWS.");
  } catch (error) {
    console.error(`Failed to delete image  from AWS: ${error}`);
  }

}
// To use deleteImage for example:
// const imageKey = "path/to/image.jpg";
// await deleteImage(imageKey);
// console.log("Image deleted successfully.");


// Define the function to delete images from AWS (replace with your implementation)
async function deleteImagesFromAWS(imageUrls: string[]) {
  for (const imageUrl of imageUrls) {
    // Parse the URL to get the pathname, which represents the object key
    const parsedUrl = url.parse(imageUrl);
    const objectKey = parsedUrl.pathname?.substring(1); // Remove the leading slash
    if (objectKey) {
      const bucketParams = {
        Bucket: s3Bucket,
        Key: objectKey,
      };


      try {
        await s3Client.send(new DeleteObjectCommand(bucketParams));
        console.log(`Image '${objectKey}' deleted from AWS.`);
      } catch (error) {
        console.error(`Failed to delete image '${objectKey}' from AWS: ${error}`);
      }
    } else {
      console.error(`Invalid image URL: ${imageUrl}`);
    }
  }
}



// async function getImageUrl(key: string): Promise<string> {
//   const bucketParams = {
//     Bucket: s3Bucket,
//     Key: key,
//   };

//   return await getSignedUrl(s3Client, new GetObjectCommand(bucketParams));
// }

async function reduceImageSize(filePath: string): Promise<string> {
  const resizedImagePath = `${filePath}-resized`;

  await sharp(filePath)
    .resize({ width: 1000, height: 1000 })
    .toFile(resizedImagePath);

  return resizedImagePath;
}

// async function resizeAndAddWatermark(
//   imagePath: string,
//   watermarkText: string
// ): Promise<string> {
//   const image = await Jimp.read(imagePath);

//   const targetSize = 1024 * 1024;
//   const resizedImage = image.scaleToFit(1024, 1024).quality(80);
//   while (resizedImage.bitmap.byteLength > targetSize) {
//     resizedImage.quality(resizedImage._quality - 5);
//   }

//   const font = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
//   const watermarkX =
//     resizedImage.bitmap.width - (Jimp.measureText(font, watermarkText) + 20);
//   const watermarkY = resizedImage.bitmap.height - 80;
//   resizedImage.print(font, watermarkX, watermarkY, {
//     text: watermarkText,
//     alignmentX: Jimp.HORIZONTAL_ALIGN_RIGHT,
//     alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM,
//   });

//   const resizedPath = `${imagePath}_resized.jpg`;
//   await resizedImage.writeAsync(resizedPath);

//   return resizedPath;
// }

export {
  uploadPicture,
  deleteImage,
  deleteImagesFromAWS,
  reduceImageSize,
//   getImageUrl,
//   resizeAndAddWatermark,
};


// "https://ravebooking.s3.amazonaws.com/Product-images/0ec0213c-0efd-4f67-949c-08fa4188360d.jpg","https://ravebooking.s3.amazonaws.com/Product-images/6c1b4be1-4d5b-46da-aedc-54a413427025.jpg","https://ravebooking.s3.amazonaws.com/Product-images/eec3fd22-e40c-41ce-be25-ff32bd325419.jpg"