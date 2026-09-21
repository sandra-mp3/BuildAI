import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async syncUser(firebaseUid: string, email: string, name?: string) {
    return this.prisma.user.upsert({
      where: { firebaseUid },
      update: { email, name },
      create: { firebaseUid, email, name },
    });
  }

  async getProfile(firebaseUid: string) {
    return this.prisma.user.findUnique({ where: { firebaseUid } });
  }
}
