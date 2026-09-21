/**
 * FIREBASE-AUTH.GUARD.TS
 * ------------------------
 * A "guard" in NestJS is a small piece of code that runs *before* a
 * request is allowed to reach its controller, and decides: should this
 * request even be allowed through? This particular guard answers one
 * question — "who is making this request, really?" — and it's arguably
 * the single most important security file in the whole backend, so I want
 * to explain it carefully.
 *
 * THE PROBLEM THIS SOLVES
 * -------------------------
 * When someone logs into BuildAI in their browser, Firebase (the
 * authentication service — see the product notes on Firebase in the
 * README) gives their browser a signed "ID token": a piece of text that
 * proves who they are, similar in spirit to a wristband at a concert.
 *
 * The tempting-but-dangerous shortcut would be to just have the browser
 * send its user ID directly with each request — e.g. "I am user #42,
 * please show me user #42's projects." The problem is that anyone can open
 * their browser's developer tools and change that number to "43" and ask
 * for someone else's projects instead. A request like that would look
 * completely normal to a server that isn't checking anything.
 *
 * THE FIX
 * --------
 * Every request that needs to know "who's asking" goes through this guard
 * first. Instead of trusting whatever ID the browser claims, the guard
 * takes the signed token Firebase issued, and asks Firebase's own servers
 * (through the Admin SDK) to verify: "is this token real, unexpired, and
 * who does it actually belong to?" Only Firebase's private signing key can
 * produce a token that passes this check, so nobody can forge one — not
 * even by editing requests in dev tools. The verified identity is then
 * attached to the request as `req.firebaseUser`, and every controller
 * downstream uses *that* — never a value the client just typed in.
 *
 * This single pattern is what makes it possible to guarantee, elsewhere in
 * the code (see projects.service.ts's `assertOwnership`), that User A can
 * never read or modify User B's projects just by changing an ID in a
 * request — a category of bug called "broken access control," and one of
 * the most common real-world security issues in web apps.
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { getFirebaseAdmin } from "../../common/firebase-admin";

export interface AuthenticatedRequest extends Request {
  firebaseUser: {
    uid: string;
    email: string | undefined;
    name: string | undefined;
  };
}

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = req.headers.authorization;

    // A request with no "Authorization: Bearer <token>" header at all is
    // rejected immediately — there's nothing to even try to verify.
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token.");
    }

    const idToken = header.slice("Bearer ".length);

    try {
      // This is the one line doing the real security work: it asks
      // Firebase to cryptographically verify the token's signature and
      // expiry. If it's valid, `decoded` contains the *real* user id —
      // not anything the client could have typed in themselves.
      const decoded = await getFirebaseAdmin().auth().verifyIdToken(idToken);
      req.firebaseUser = {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name,
      };
      return true;
    } catch {
      // Deliberately vague on purpose: whether the token was missing,
      // expired, tampered with, or simply fake, the person on the other
      // end gets the same generic error. Giving different error messages
      // for each case would hand an attacker useful clues about which
      // approach is getting closer to working.
      throw new UnauthorizedException("Invalid or expired token.");
    }
  }
}
