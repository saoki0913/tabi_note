import { hasGoogleAuthConfig } from "@/lib/env";
import { SignUpForm } from "./SignUpForm";

export default function SignUpPage() {
  return <SignUpForm hasGoogleAuth={hasGoogleAuthConfig} />;
}
