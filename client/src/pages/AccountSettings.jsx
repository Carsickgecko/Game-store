import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { uploadImageFile } from "../api/uploads.js";
import {
  getUser,
  isAdmin,
  isAuthenticated,
  updateProfile,
  changePassword,
} from "../store/auth.js";
import AccountShell from "../components/account/AccountShell.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { toImageUrl } from "../utils/image.js";

export default function AccountSettings() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const adminView = isAdmin();
  const [name, setName] = useState(user?.name || user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordErr, setPasswordErr] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    const onAuthChanged = () => {
      const nextUser = getUser();
      setUser(nextUser);
      setName(nextUser?.name || nextUser?.fullName || "");
      setEmail(nextUser?.email || "");
      setAvatarUrl(nextUser?.avatarUrl || "");
    };

    window.addEventListener("auth:changed", onAuthChanged);
    return () => window.removeEventListener("auth:changed", onAuthChanged);
  }, [navigate]);

  if (!user) return null;
  const adminBackAction = adminView ? (
    <button
      type="button"
      onClick={() => navigate("/account")}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10"
    >
      <FiArrowLeft className="size-4" />
      {t("admin.backToAdminHome")}
    </button>
  ) : null;

  const onSaveProfile = async (e) => {
    e.preventDefault();
    setProfileErr("");
    setProfileMsg("");

    if (!name.trim() || !email.trim()) {
      setProfileErr(t("accountSettings.required"));
      return;
    }

    try {
      setSavingProfile(true);
      await updateProfile({ name, fullName: name, email, avatarUrl });
      setProfileMsg(t("accountSettings.profileUpdated"));
    } catch (error) {
      setProfileErr(
        error?.response?.data?.message || t("accountSettings.updateFailed"),
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const onUploadAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProfileErr("");
    setProfileMsg("");

    try {
      setUploadingAvatar(true);
      const uploadedUrl = await uploadImageFile(file);
      if (uploadedUrl) {
        setAvatarUrl(uploadedUrl);
      }
    } catch (error) {
      setProfileErr(
        error?.response?.data?.message || t("accountSettings.avatarUploadFailed"),
      );
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    setPasswordErr("");
    setPasswordMsg("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordErr(t("accountSettings.passwordFields"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErr(t("accountSettings.confirmMismatch"));
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordErr(t("accountSettings.samePassword"));
      return;
    }

    if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword)) {
      setPasswordErr(t("accountSettings.passwordRule"));
      return;
    }

    try {
      setChangingPassword(true);
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMsg(t("accountSettings.passwordChanged"));
    } catch (error) {
      setPasswordErr(
        error?.response?.data?.message || t("accountSettings.changeFailed"),
      );
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <AccountShell
      title={t("accountSettings.title")}
      description={t("accountSettings.description")}
      showTabs={!adminView}
      actions={adminBackAction}
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <form
          onSubmit={onSaveProfile}
          className="rounded-[28px] border border-white/8 bg-[#1d1d1d] p-6"
        >
          <div className="text-xs uppercase tracking-[0.28em] text-white/42">
            {t("accountSettings.profile")}
          </div>
          <div className="mt-3 text-2xl font-semibold text-white">
            {t("accountSettings.publicDetails")}
          </div>

          {profileErr ? (
            <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {profileErr}
            </div>
          ) : null}

          {profileMsg ? (
            <div className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {profileMsg}
            </div>
          ) : null}

          <div className="mt-6 space-y-5">
            <div>
              <label className="text-sm text-white/64">
                {t("accountSettings.avatar")}
              </label>
              <div className="mt-3 flex items-center gap-4">
                {avatarUrl ? (
                  <img
                    src={toImageUrl(avatarUrl)}
                    alt={name || user?.username || "Avatar"}
                    className="h-20 w-20 rounded-full border border-white/10 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#dc2626] text-2xl font-bold text-white">
                    {(name || user?.username || "U").trim().charAt(0).toUpperCase() || "U"}
                  </div>
                )}

                <div className="flex-1">
                  <label className="inline-flex cursor-pointer items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onUploadAvatar}
                    />
                    {uploadingAvatar
                      ? t("accountSettings.uploadingAvatar")
                      : t("accountSettings.uploadAvatar")}
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm text-white/64">{t("accountSettings.name")}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none placeholder:text-white/28"
                placeholder={t("accountSettings.namePlaceholder")}
              />
            </div>

            <div>
              <label className="text-sm text-white/64">{t("accountSettings.email")}</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none placeholder:text-white/28"
                placeholder={t("accountSettings.emailPlaceholder")}
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full rounded-2xl bg-[#dc2626] px-4 py-3 font-semibold text-white shadow-[0_18px_34px_-22px_rgba(220,38,38,0.95)] transition hover:bg-[#ef4444] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {t("accountSettings.saveProfile")}
            </button>
          </div>
        </form>

        <form
          onSubmit={onChangePassword}
          className="rounded-[28px] border border-white/8 bg-[#1d1d1d] p-6"
        >
          <div className="text-xs uppercase tracking-[0.28em] text-white/42">
            {t("accountSettings.security")}
          </div>
          <div className="mt-3 text-2xl font-semibold text-white">
            {t("accountSettings.changePassword")}
          </div>

          {passwordErr ? (
            <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {passwordErr}
            </div>
          ) : null}

          {passwordMsg ? (
            <div className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {passwordMsg}
            </div>
          ) : null}

          <div className="mt-6 space-y-5">
            <div>
              <label className="text-sm text-white/64">
                {t("accountSettings.currentPassword")}
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none placeholder:text-white/28"
                placeholder={t("accountSettings.currentPasswordPlaceholder")}
              />
            </div>

            <div>
              <label className="text-sm text-white/64">{t("accountSettings.newPassword")}</label>
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none placeholder:text-white/28"
                placeholder={t("accountSettings.newPasswordPlaceholder")}
              />
            </div>

            <div>
              <label className="text-sm text-white/64">
                {t("accountSettings.confirmPassword")}
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none placeholder:text-white/28"
                placeholder={t("accountSettings.confirmPasswordPlaceholder")}
              />
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="w-full rounded-2xl border border-[#dc2626]/35 bg-[#dc2626]/12 px-4 py-3 font-semibold text-white transition hover:border-[#dc2626]/60 hover:bg-[#dc2626]/20 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {changingPassword
                ? t("accountSettings.changingPassword")
                : t("accountSettings.changePassword")}
            </button>

            <p className="text-xs leading-6 text-white/44">
              {t("accountSettings.passwordHint")}
            </p>
          </div>
        </form>
      </div>
    </AccountShell>
  );
}
