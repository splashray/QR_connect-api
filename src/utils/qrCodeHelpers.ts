import qrcode from "qrcode";

export async function generateQRCode(
  data: string,
  options: qrcode.QRCodeToDataURLOptions,
): Promise<string> {
  try {
    const qrCodeImage = await qrcode.toDataURL(data, options);
    return qrCodeImage;
  } catch (error) {
    throw new Error("QR code generation failed.");
  }
}

const meaningfulWords = [
  "buy", "sale", "shop", "cart", "deal", "save", "sale", "promo",
  "free", "deal", "gift", "fast", "easy", "hot", "new", "best",
  "top", "bonus", "win", "offer", "mega", "big", "now", "flash"
];


export function generateRandomString() {
  const randomIndex = Math.floor(Math.random() * meaningfulWords.length);
  return meaningfulWords[randomIndex];
}
