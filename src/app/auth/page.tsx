"use client";

import { useState } from "react";
import Login from "@/components/Login";
import Signup from "@/components/Signup";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div>
      {isLogin ? (
        <Login onSwitchToSignup={() => setIsLogin(false)} />
      ) : (
        <Signup onSwitchToLogin={() => setIsLogin(true)} />
      )}
    </div>
  );
}
