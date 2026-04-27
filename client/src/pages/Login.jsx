import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { saveAuth } from "../store/auth.js";

export default function Login() {
  const { t } = useLanguage();
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
      navigate("/", { replace: true });
    } catch (e2) {
      setErr(e2?.response?.data?.message || t("login.failed"));
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="rounded-2xl border bg-white p-6 text-black">
        <h1 className="text-2xl font-bold">{t("login.title")}</h1>
        <p className="mt-1 text-sm text-black/60">{t("login.subtitle")}</p>

        {err && (
          <div className="mt-4 text-sm rounded-xl border px-3 py-2 bg-black text-white">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-black/70">{t("login.email")}</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full px-3 py-2 rounded-xl border bg-white text-black placeholder:text-slate-400 outline-none"
              placeholder={t("login.emailPlaceholder")}
            />
          </div>

          <div>
            <label className="text-sm text-black/70">{t("login.password")}</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full px-3 py-2 rounded-xl border bg-white text-black placeholder:text-slate-400 outline-none"
              placeholder={t("login.passwordPlaceholder")}
            />
          </div>

          <button className="w-full px-4 py-3 rounded-xl bg-black text-white">
            {t("login.submit")}
          </button>
        </form>

        <div className="mt-4 text-sm text-black/60">
          {t("login.noAccount")}{" "}
          <Link className="underline" to="/register">
            {t("login.register")}
          </Link>
        </div>
      </div>
    </div>
  );
}
