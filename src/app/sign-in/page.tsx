import { hasGoogleAuthConfig } from "@/lib/env";
import { SignInForm } from "./SignInForm";

export default function SignInPage() {
  return <SignInForm hasGoogleAuth={hasGoogleAuthConfig} />;
}
