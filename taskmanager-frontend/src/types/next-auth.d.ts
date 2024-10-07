import "next-auth";

declare module "next-auth" {
  /**
   * Extends the built-in session types to include custom properties
   */
  interface Session {
    accessToken?: string;
  }
}
