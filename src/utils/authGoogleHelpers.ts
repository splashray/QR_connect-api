/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from "dotenv";
dotenv.config();
import { google } from "googleapis";
import { BadRequest} from  "../errors/httpErrors";
import Buyer, { IBuyer } from "../db/models/buyer.model";
import Business, { IBusiness } from "../db/models/business.model";


const baseUrl = process.env.BASE_URL;
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;


class GoogleService {
  public SCOPES: string[] = [
    "email",
    "profile",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
    "openid",
  ];
  
  async generateClient(): google.auth.OAuth2 {
    const redirectUrl = `${baseUrl}/auth/callback/googleAuth`;
    return new google.auth.OAuth2(clientId, clientSecret, redirectUrl);
  }
  
  async getAccessToken(code: string, client: google.auth.OAuth2): Promise<string> {
    const { tokens } = await client.getToken(code);
    return tokens.id_token as string;
  }
  
  async verify(token: string, client: google.auth.OAuth2): Promise<any> {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    return payload;
  }
  
  async findBuyerByEmail(email: string): Promise<IBuyer | null> {
    const buyer = await Buyer.findOne({ email });
    return buyer || null;
  }
  
  async findBusinessByEmail(email: string): Promise<IBusiness | null> {
    const business = await Business.findOne({ email });
    return business || null;
  }
  
  async buyerGoogleSignup(code: string, client: google.auth.OAuth2, payload: any): Promise<IBuyer | null> {
    let tokenId: string;
    if (!payload) {
      tokenId = await this.getAccessToken(code, client);
      payload = await this.verify(tokenId, client);
    }
  
    const buyer = await this.findBuyerByEmail(payload.email);
    if (buyer) return buyer;
  
    try {
      const createdBuyer = await Buyer.create({
        firstName: payload.given_name,
        lastName: payload.family_name,
        email: payload.email,
        authMethod: "Google",
        accountType: "Buyer",
        userType: "Buyer",
        authType: {
          googleUuid: payload.sub,
        },
        profilePicture: payload.picture || "https://res.cloudinary.com/dsffatdpd/image/upload/v1685691602/baca/logo_aqssg3.jpg",
        addressBook: payload.address || "",
        phoneNumber: payload.phone_number || "",
      });
      return createdBuyer;
    } catch (error: any) {
      throw new BadRequest(error.message, "INVALID_REQUEST_PARAMETERS");
    }
  }
  
  async businessGoogleSignup(code: string, client: google.auth.OAuth2, payload: any): Promise<IBusiness | null> {
    let tokenId: string;
    if (!payload) {
      tokenId = await this.getAccessToken(code, client);
      payload = await this.verify(tokenId, client);
    }
  
    const business = await this.findBusinessByEmail(payload.email);
    if (business) return business;
  
    try {
      const createdBusiness = await Business.create({
        firstName: payload.given_name,
        lastName: payload.family_name,
        email: payload.email,
        authMethod: "Google",
        accountType: "Business",
        userType: "Business",
        authType: {
          googleUuid: payload.sub,
        },
        profilePicture: payload.picture || "https://res.cloudinary.com/dsffatdpd/image/upload/v1685691602/baca/logo_aqssg3.jpg",
        phoneNumber: payload.phone_number || "",
        // businessName
        // businessSlug
        // industry
        // qrcode
      });
      return createdBusiness;
    } catch (error: any) {
      throw new BadRequest(error.message, "INVALID_REQUEST_PARAMETERS");
    }
  }
}
  
export default new GoogleService();
  
