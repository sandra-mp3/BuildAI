import { UnauthorizedException } from "@nestjs/common";
import { FirebaseAuthGuard } from "../src/modules/auth/firebase-auth.guard";

function mockContext(headers: Record<string, string>) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as any;
}

describe("FirebaseAuthGuard", () => {
  it("rejects requests with no Authorization header", async () => {
    const guard = new FirebaseAuthGuard();
    await expect(guard.canActivate(mockContext({}))).rejects.toThrow(UnauthorizedException);
  });

  it("rejects requests that are not Bearer tokens", async () => {
    const guard = new FirebaseAuthGuard();
    await expect(
      guard.canActivate(mockContext({ authorization: "Basic abc123" }))
    ).rejects.toThrow(UnauthorizedException);
  });
});
