import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { saveAuth } from "../store/auth.js";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      const res = await api.post("/api/v1/auth/login", { email, password });
      saveAuth(res.data.token, res.data.user);
      navigate("/account");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Login failed.");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="rounded-2xl border bg-white p-6">
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="mt-1 text-sm text-black/60">Login with backend</p>

        {err && (
          <div className="mt-4 text-sm rounded-xl border px-3 py-2 bg-black text-white">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-black/70">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full px-3 py-2 rounded-xl border outline-none"
              placeholder="you@email.com"
            />
          </div>

          <div>
            <label className="text-sm text-black/70">Password</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full px-3 py-2 rounded-xl border outline-none"
              placeholder="Your password"
            />
          </div>

          <button className="w-full px-4 py-3 rounded-xl bg-black text-white">
            Login
          </button>
        </form>

        <div className="mt-4 text-sm text-black/60">
          No account?{" "}
          <Link className="underline" to="/register">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
