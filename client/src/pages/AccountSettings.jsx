import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getUser,
  isAuthenticated,
  updateProfile,
  changePassword,
} from "../store/auth.js";

export default function AccountSettings() {
  const navigate = useNavigate();

  const [user, setUser] = useState(getUser());
  const [name, setName] = useState(user?.name || user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    const onAuthChanged = () => {
      const u = getUser();
      setUser(u);
      setName(u?.name || u?.fullName || "");
      setEmail(u?.email || "");
    };

    window.addEventListener("auth:changed", onAuthChanged);
    return () => window.removeEventListener("auth:changed", onAuthChanged);
  }, [navigate]);

  if (!user) return null;

  const onSaveProfile = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!name.trim() || !email.trim()) {
      setErr("Name and email are required.");
      return;
    }

    try {
      // backend thường nhận fullName hoặc name -> gửi cả 2 để chắc chắn
      await updateProfile({ name, fullName: name, email });
      setMsg("Profile updated.");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Update failed.");
    }
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!currentPassword || !newPassword) {
      setErr("Please fill both password fields.");
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setMsg("Password changed.");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Change password failed.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Account settings</h1>
          <p className="text-sm text-black/60">Update profile & password</p>
        </div>

        <Link to="/account" className="text-sm underline">
          Back to account
        </Link>
      </div>

      {err && (
        <div className="mt-4 rounded-xl border px-4 py-3 text-sm bg-black text-white">
          {err}
        </div>
      )}
      {msg && (
        <div className="mt-4 rounded-xl border px-4 py-3 text-sm bg-white">
          {msg}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <form
          onSubmit={onSaveProfile}
          className="rounded-2xl border bg-white p-6"
        >
          <div className="font-semibold">Profile</div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm text-black/70">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full px-3 py-2 rounded-xl border outline-none"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="text-sm text-black/70">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full px-3 py-2 rounded-xl border outline-none"
                placeholder="you@email.com"
              />
            </div>

            <button className="w-full px-4 py-3 rounded-xl bg-black text-white">
              Save profile
            </button>
          </div>
        </form>

        {/* Password */}
        <form
          onSubmit={onChangePassword}
          className="rounded-2xl border bg-white p-6"
        >
          <div className="font-semibold">Change password</div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm text-black/70">Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-2 w-full px-3 py-2 rounded-xl border outline-none"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="text-sm text-black/70">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-2 w-full px-3 py-2 rounded-xl border outline-none"
                placeholder="••••••••"
              />
            </div>

            <button className="w-full px-4 py-3 rounded-xl bg-black text-white">
              Change password (demo)
            </button>

            <p className="text-xs text-black/60">
              Demo only — later you will connect backend API.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
