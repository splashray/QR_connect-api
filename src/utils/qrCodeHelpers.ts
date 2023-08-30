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
