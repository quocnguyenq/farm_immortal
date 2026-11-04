"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("nongdan");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Đăng nhập thất bại");
      return;
    }
    window.location.href = data.isAdmin ? "/play" : "/play";
  }

  return (
    <div className="farm-sky grid min-h-screen place-items-center p-4">
      <form onSubmit={onSubmit} className="modal-card w-full max-w-md p-8">
        <h1 className="pixel-title text-center text-3xl font-black text-lime-800">Nông Trại Tiên Duyên</h1>
        <p className="mt-2 text-center text-sm text-amber-900">Gieo trồng, tích trữ, mở đường tu tiên</p>
        <label className="mt-6 block text-sm font-bold">Tài khoản</label>
        <input
          className="mt-1 w-full rounded-xl border-2 border-amber-700 bg-white px-3 py-2"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <label className="mt-3 block text-sm font-bold">Mật khẩu</label>
        <input
          type="password"
          className="mt-1 w-full rounded-xl border-2 border-amber-700 bg-white px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="mt-3 text-sm font-bold text-red-700">{error}</p>}
        <button disabled={loading} className="wood-sign mt-5 w-full rounded-xl py-3 text-lg">
          {loading ? "Đang vào trại..." : "Đăng nhập"}
        </button>
        <p className="mt-4 text-center text-sm">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-extrabold text-lime-800">
            Đăng ký
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-amber-800">
          Thử: nongdan / 123456 · admin / 12345678
        </p>
      </form>
    </div>
  );
}
