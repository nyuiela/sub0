import type { Metadata } from "next";
import "./register.css";

export const metadata: Metadata = {
  title: "Register | sub0",
  description: "Create your sub0 agent and start trading.",
};

export default function RegisterLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <main className="register-page" data-register-layout>
      {children}
    </main>
  );
}
