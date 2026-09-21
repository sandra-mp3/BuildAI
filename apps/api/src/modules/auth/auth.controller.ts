import { Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthenticatedRequest, FirebaseAuthGuard } from "./firebase-auth.guard";

@Controller("auth")
@UseGuards(FirebaseAuthGuard)
export class AuthController {
  constructor(private authService: AuthService) {}

  // Called once after client-side Firebase login to create/update the
  // corresponding User row. The uid always comes from the verified token.
  @Post("session")
  async createSession(@Req() req: AuthenticatedRequest) {
    const { uid, email, name } = req.firebaseUser;
    const user = await this.authService.syncUser(uid, email ?? "", name);
    return { user };
  }

  @Get("me")
  async me(@Req() req: AuthenticatedRequest) {
    return this.authService.getProfile(req.firebaseUser.uid);
  }
}
