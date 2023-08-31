import { s3Client, s3Bucket } from "../config/s3.config";
import { randomUUID } from "crypto";
import {
  PutObjectCommand,
  DeleteObjectCommand,
//   GetObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs/promises";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";


async function uploadPicture(
  file: string,
  folderName: string,
  fileExtension: string
): Promise<string> {
  const bucketParams = {
    Bucket: s3Bucket,
    Key: folderName + "/" + randomUUID() + fileExtension,
    Body: await fs.readFile(file),
  };

  await s3Client.send(new PutObjectCommand(bucketParams));
  return bucketParams.Key;
}

async function deleteImage(key: string): Promise<void> {
  const bucketParams = {
    Bucket: s3Bucket,
    Key: key,
  };
  await s3Client.send(new DeleteObjectCommand(bucketParams));
}

// async function getImageUrl(key: string): Promise<string> {
//   const bucketParams = {
//     Bucket: s3Bucket,
//     Key: key,
//   };

//   return await getSignedUrl(s3Client, new GetObjectCommand(bucketParams));
// }

// async function reduceImageSize(filePath: string): Promise<string> {
//   const resizedImagePath = `${filePath}-resized`;

//   await sharp(filePath)
//     .resize({ width: 800, height: 600 })
//     .toFile(resizedImagePath);

//   await fs.unlink(filePath);

//   return resizedImagePath;
// }

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
//   getImageUrl,
//   reduceImageSize,
//   resizeAndAddWatermark,
};
