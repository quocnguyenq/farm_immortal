"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, displayName }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Đăng ký thất bại");
      return;
    }
    window.location.href = "/play";
  }

  return (
    <div className="farm-sky grid min-h-screen place-items-center p-4">
      <form onSubmit={onSubmit} className="modal-card w-full max-w-md p-8">
        <h1 className="text-center text-3xl font-black text-lime-800">Tạo nông hộ</h1>
        <label className="mt-6 block text-sm font-bold">Tài khoản</label>
        <input
          className="mt-1 w-full rounded-xl border-2 border-amber-700 bg-white px-3 py-2"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="nongdan01"
        />
        <label className="mt-3 block text-sm font-bold">Tên hiển thị</label>
        <input
          className="mt-1 w-full rounded-xl border-2 border-amber-700 bg-white px-3 py-2"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Nông Dân"
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
          {loading ? "Đang tạo..." : "Đăng ký"}
        </button>
        <p className="mt-4 text-center text-sm">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-extrabold text-lime-800">
            Đăng nhập
          </Link>
        </p>
      </form>
    </div>
  );
}
