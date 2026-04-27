import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { saveAuth } from "../store/auth.js";

const PASSWORD_RULE =
  /^(?=.*[A-Z])(?=.*\d).{8,}$/; // >=8 chars, 1 uppercase, 1 number

export default function Register() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    fullName: "",
    password: "",
    confirmPassword: "",
  });
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!PASSWORD_RULE.test(form.password)) {
      setErr(t("register.passwordRule"));
      return;
    }
    if (form.password !== form.confirmPassword) {
      setErr(t("register.confirmMismatch"));
      return;
    }

    try {
      // ✅ gọi đúng 1 lần /api/v1
      await api.post("/api/v1/auth/register", {
        username: form.username,
        email: form.email,
        fullName: form.fullName,
        password: form.password,
      });

      // auto login ngay sau register
      const res = await api.post("/api/v1/auth/login", {
        email: form.email,
        password: form.password,
      });

      saveAuth(res.data.token, res.data.user);
      navigate("/account");
    } catch (e2) {
      setErr(e2?.response?.data?.message || t("register.failed"));
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="rounded-2xl border bg-white p-6 text-black">
        <h1 className="text-2xl font-bold">{t("register.title")}</h1>
        <p className="mt-1 text-sm text-black/60">{t("register.subtitle")}</p>

        {err && (
          <div className="mt-4 text-sm rounded-xl border px-3 py-2 bg-black text-white">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-black/70">{t("register.username")}</label>
            <input
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="mt-2 w-full px-3 py-2 rounded-xl border bg-white text-black placeholder:text-slate-400 outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-black/70">{t("register.email")}</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-2 w-full px-3 py-2 rounded-xl border bg-white text-black placeholder:text-slate-400 outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-black/70">{t("register.fullName")}</label>
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="mt-2 w-full px-3 py-2 rounded-xl border bg-white text-black placeholder:text-slate-400 outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-black/70">{t("register.password")}</label>
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-2 w-full px-3 py-2 rounded-xl border bg-white text-black placeholder:text-slate-400 outline-none"
            />
            <div className="mt-1 text-xs text-black/60">
              {t("register.passwordHint")}
            </div>
          </div>

          <div>
            <label className="text-sm text-black/70">
              {t("register.confirmPassword")}
            </label>
            <input
              required
              type="password"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              className="mt-2 w-full px-3 py-2 rounded-xl border bg-white text-black placeholder:text-slate-400 outline-none"
            />
          </div>

          <button className="w-full px-4 py-3 rounded-xl bg-black text-white">
            {t("register.submit")}
          </button>
        </form>

        <div className="mt-4 text-sm text-black/60">
          {t("register.alreadyHave")}{" "}
          <Link className="underline" to="/login">
            {t("register.login")}
          </Link>
        </div>
      </div>
    </div>
  );
}
