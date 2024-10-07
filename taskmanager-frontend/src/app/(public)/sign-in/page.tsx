"use client";
// pages/signin.js or pages/signin.tsx
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SignInPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  useEffect(() => {
    if (session) router.push("/"); // Redirect if already signed in
  }, [session, router, callbackUrl]);

  return (
    <div>
      <h1>Sign In</h1>
      <button onClick={() => signIn("cognito")}>Sign In with Cognito</button>
    </div>
  );
}
