"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Routes } from "@/types/Routes";
import { GoogleOAuthProvider } from "@react-oauth/google";

type Props = {
  children: React.ReactNode;
};

const AuthLayout = ({ children }: Props) => {
  const router = useRouter();
  const pathname = usePathname();

  const registerPage = pathname.includes(Routes.Register);
  const loginPage = pathname.includes(Routes.Login);

  // redirect to app if already logged in or has access token
  useEffect(() => {
    const accessToken = window.localStorage.getItem("access-token");

    // redirect if on register or login page, otherwise do nothing
    if (accessToken && (registerPage || loginPage)) {
      router.push(Routes.App);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_CLIENT_ID as string}>
      <div className="min-h-screen w-screen lg:grid lg:place-items-center">
        {children}
      </div>
    </GoogleOAuthProvider>
  );
};

export default AuthLayout;