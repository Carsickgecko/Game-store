import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { getUser, isAdmin, isAuthenticated } from "../store/auth.js";
import PageSurface from "../components/common/PageSurface.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import {
  localizeGenre,
  localizePlatform,
} from "../utils/localizeStoreValue.js";
import {
  adminCreateGame,
  adminDeleteGame,
  adminDisableUser,
  adminEnableUser,
  adminFetchGames,
  adminFetchUsers,
  adminPermanentDeleteGame,
  adminUpdateGame,
  uploadGameImage,
} from "../api/admin.js";

const emptyForm = {
  name: "",
  price: "",
  oldPrice: "",
  rating: "",
  genre: "Action",
  platform: "PC",
  image: "",
  longDescription: "",
  isActive: true,
};

const shellClassName =
  "border-white/8 !bg-none !bg-[#262626] text-white shadow-[0_34px_70px_-42px_rgba(0,0,0,0.95)]";
const panelClassName =
  "rounded-[28px] border border-white/8 bg-[#1d1d1d] p-6 shadow-[0_24px_50px_-36px_rgba(0,0,0,0.95)]";
const labelClassName = "text-sm text-white/64";
const inputClassName =
  "mt-2 w-full rounded-2xl border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none placeholder:text-white/28";
const subtleButtonClassName =
  "rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10";
const accentButtonClassName =
  "rounded-2xl bg-[#dc2626] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_-22px_rgba(220,38,38,0.95)] transition hover:bg-[#ef4444]";
const dangerButtonClassName =
  "rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-100 transition hover:border-red-500 hover:bg-red-600 hover:text-white";

function GameRow({ game, onEdit, onDelete, onToggle, t }) {
  return (
    <div className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center">
      <img
        src={
          game.image
            ? game.image.startsWith("http")
              ? game.image
              : `http://localhost:5001${game.image}`
            : "/images/hero-bg.jpg"
        }
        alt={game.name}
        className="h-16 w-24 rounded-2xl border border-white/10 object-cover"
      />

      <div className="min-w-0 flex-1">
        <div className="line-clamp-1 font-semibold text-white">
          {game.name}
          {!game.isActive ? (
            <span className="ml-2 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] uppercase tracking-[0.18em] text-white/45">
              {t("admin.disabled")}
            </span>
          ) : null}
        </div>

        <div className="mt-1 text-xs text-white/58">
          {localizeGenre(game.genre, t)} · {localizePlatform(game.platform, t)} · $
          {Number(game.price).toFixed(2)}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onEdit(game)} className={accentButtonClassName}>
          {t("admin.edit")}
        </button>
        <button type="button" onClick={() => onDelete(game)} className={dangerButtonClassName}>
          {t("admin.delete")}
        </button>
        <button type="button" onClick={() => onToggle(game)} className={subtleButtonClassName}>
          {game.isActive ? t("admin.disable") : t("admin.enable")}
        </button>
      </div>
    </div>
  );
}

function UserRow({ user, isMe, onDisable, onEnable, t }) {
  return (
    <div className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center">
      <div className="min-w-0 flex-1">
        <div className="line-clamp-1 font-semibold text-white">
          {user.username}
          {!user.isActive ? (
            <span className="ml-2 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] uppercase tracking-[0.18em] text-white/45">
              {t("admin.disabled")}
            </span>
          ) : null}
          {isMe ? (
            <span className="ml-2 rounded-full border border-[#dc2626]/30 bg-[#dc2626]/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.18em] text-[#fca5a5]">
              {t("admin.you")}
            </span>
          ) : null}
        </div>

        <div className="mt-1 text-xs text-white/58">
          {user.email} · {t("admin.roleId")}: {user.roleId} · {t("admin.id")}:{" "}
          {user.id}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {user.isActive ? (
          <button
            type="button"
            disabled={isMe}
            onClick={() => onDisable(user)}
            className={`${subtleButtonClassName} ${
              isMe ? "cursor-not-allowed opacity-40" : ""
            }`}
          >
            {t("admin.disable")}
          </button>
        ) : (
          <button type="button" onClick={() => onEnable(user)} className={accentButtonClassName}>
            {t("admin.enable")}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Admin() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [tab, setTab] = useState("games");

  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [errGames, setErrGames] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errUsers, setErrUsers] = useState("");

  const me = getUser();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    if (!isAdmin()) {
      navigate("/");
    }
  }, [navigate]);

  const loadGames = useCallback(async () => {
    setLoadingGames(true);
    setErrGames("");

    try {
      const list = await adminFetchGames();
      setGames(Array.isArray(list) ? list : []);
    } catch (error) {
      setErrGames(error?.response?.data?.message || t("admin.failedLoadGames"));
    } finally {
      setLoadingGames(false);
    }
  }, [t]);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setErrUsers("");

    try {
      const list = await adminFetchUsers();
      setUsers(Array.isArray(list) ? list : []);
    } catch (error) {
      setErrUsers(error?.response?.data?.message || t("admin.failedLoadUsers"));
    } finally {
      setLoadingUsers(false);
    }
  }, [t]);

  useEffect(() => {
    loadGames();
    loadUsers();
  }, [loadGames, loadUsers]);

  const onPickEdit = (game) => {
    setEditingId(game.id);
    setForm({
      name: game.name || "",
      price: game.price ?? "",
      oldPrice: game.oldPrice ?? "",
      rating: game.rating ?? "",
      genre: game.genre || "Action",
      platform: game.platform || "PC",
      image: game.image || "",
      longDescription: game.longDescription || "",
      isActive: game.isActive !== false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onReset = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const onUpload = async (file) => {
    if (!file) return;

    setUploading(true);
    setErrGames("");

    try {
      const url = await uploadGameImage(file);
      setForm((current) => ({ ...current, image: url }));
    } catch (error) {
      setErrGames(error?.response?.data?.message || t("admin.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const onSubmitGame = async (event) => {
    event.preventDefault();
    setErrGames("");

    const payload = {
      ...form,
      price: Number(form.price),
      oldPrice: form.oldPrice === "" ? null : Number(form.oldPrice),
      rating: form.rating === "" ? null : Number(form.rating),
      isActive: form.isActive ? 1 : 0,
    };

    try {
      if (editingId) {
        await adminUpdateGame(editingId, payload);
      } else {
        await adminCreateGame(payload);
      }

      await loadGames();
      onReset();
    } catch (error) {
      setErrGames(error?.response?.data?.message || t("admin.saveGameFailed"));
    }
  };

  const onToggleGameActive = async (game) => {
    setErrGames("");

    try {
      if (game.isActive) {
        if (!confirm(t("admin.disableConfirm"))) return;
        await adminDeleteGame(game.id);
      } else {
        await adminUpdateGame(game.id, { ...game, isActive: 1 });
      }

      await loadGames();
    } catch (error) {
      setErrGames(error?.response?.data?.message || t("admin.actionFailed"));
    }
  };

  const onPermanentDeleteGame = async (game) => {
    if (!confirm(t("admin.deleteConfirm", { name: game.name }))) {
      return;
    }

    setErrGames("");

    try {
      await adminPermanentDeleteGame(game.id);
      await loadGames();

      if (Number(editingId) === Number(game.id)) {
        onReset();
      }
    } catch (error) {
      setErrGames(error?.response?.data?.message || t("admin.deleteGameFailed"));
    }
  };

  const onDisableUser = async (user) => {
    if (!confirm(t("admin.disableUserConfirm", { name: user.username }))) {
      return;
    }

    setErrUsers("");

    try {
      await adminDisableUser(user.id);
      await loadUsers();
    } catch (error) {
      setErrUsers(
        error?.response?.data?.message || t("admin.disableUserFailed"),
      );
    }
  };

  const onEnableUser = async (user) => {
    if (!confirm(t("admin.enableUserConfirm", { name: user.username }))) {
      return;
    }

    setErrUsers("");

    try {
      await adminEnableUser(user.id);
      await loadUsers();
    } catch (error) {
      setErrUsers(error?.response?.data?.message || t("admin.enableUserFailed"));
    }
  };

  const activeCount = useMemo(
    () => games.filter((game) => game.isActive).length,
    [games],
  );
  const userActiveCount = useMemo(
    () => users.filter((user) => user.isActive).length,
    [users],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageSurface className={shellClassName}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate("/account")}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/78 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <FiArrowLeft className="size-4" />
              {t("admin.backToAdminHome")}
            </button>
            <h1 className="mt-3 text-3xl font-bold text-white">{t("admin.title")}</h1>
            <p className="mt-2 text-sm text-white/60">
              {t("admin.subtitle", {
                gamesActive: activeCount,
                gamesTotal: games.length,
                usersActive: userActiveCount,
                usersTotal: users.length,
              })}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab("games")}
              className={`rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
                tab === "games"
                  ? "border-[#dc2626] bg-[#dc2626] text-white shadow-[0_18px_34px_-22px_rgba(220,38,38,0.95)]"
                  : "border-white/10 bg-white/5 text-white/78 hover:border-white/20 hover:bg-white/10 hover:text-white"
              }`}
            >
              {t("admin.manageGames")}
            </button>

            <button
              type="button"
              onClick={() => setTab("users")}
              className={`rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
                tab === "users"
                  ? "border-[#dc2626] bg-[#dc2626] text-white shadow-[0_18px_34px_-22px_rgba(220,38,38,0.95)]"
                  : "border-white/10 bg-white/5 text-white/78 hover:border-white/20 hover:bg-white/10 hover:text-white"
              }`}
            >
              {t("admin.manageUsers")}
            </button>
          </div>
        </div>

        {tab === "games" ? (
          <>
            {errGames ? (
              <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {errGames}
              </div>
            ) : null}

            <section className={`mt-6 ${panelClassName}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-white/42">
                    Game editor
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-white">
                    {editingId
                      ? t("admin.editGame", { id: editingId })
                      : t("admin.addNewGame")}
                  </div>
                  <p className="mt-2 text-sm text-white/58">
                    Build and update store entries with the same dark dashboard style.
                  </p>
                </div>

                {editingId ? (
                  <button type="button" onClick={onReset} className={subtleButtonClassName}>
                    {t("admin.cancelEdit")}
                  </button>
                ) : null}
              </div>

              <form
                onSubmit={onSubmitGame}
                className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2"
              >
                <div className="md:col-span-2">
                  <label className={labelClassName}>{t("admin.name")}</label>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className={inputClassName}
                    required
                  />
                </div>

                <div>
                  <label className={labelClassName}>{t("admin.price")}</label>
                  <input
                    value={form.price}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        price: event.target.value,
                      }))
                    }
                    className={inputClassName}
                    inputMode="decimal"
                    required
                  />
                </div>

                <div>
                  <label className={labelClassName}>{t("admin.oldPrice")}</label>
                  <input
                    value={form.oldPrice}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        oldPrice: event.target.value,
                      }))
                    }
                    className={inputClassName}
                    inputMode="decimal"
                  />
                </div>

                <div>
                  <label className={labelClassName}>{t("admin.rating")}</label>
                  <input
                    value={form.rating}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        rating: event.target.value,
                      }))
                    }
                    className={inputClassName}
                    inputMode="decimal"
                  />
                </div>

                <div>
                  <label className={labelClassName}>{t("admin.genre")}</label>
                  <input
                    value={form.genre}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        genre: event.target.value,
                      }))
                    }
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label className={labelClassName}>{t("admin.platform")}</label>
                  <input
                    value={form.platform}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        platform: event.target.value,
                      }))
                    }
                    className={inputClassName}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClassName}>{t("admin.description")}</label>
                  <textarea
                    value={form.longDescription}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        longDescription: event.target.value,
                      }))
                    }
                    className={`${inputClassName} min-h-[140px]`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClassName}>{t("admin.image")}</label>
                  <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center">
                    <input
                      value={form.image}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          image: event.target.value,
                        }))
                      }
                      className={`flex-1 ${inputClassName.replace("mt-2 ", "")}`}
                      placeholder={t("admin.imagePlaceholder")}
                    />

                    <label className="w-fit cursor-pointer rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10">
                      {uploading ? t("admin.uploading") : t("admin.uploadFile")}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => onUpload(event.target.files?.[0])}
                      />
                    </label>
                  </div>

                  {form.image ? (
                    <img
                      src={
                        form.image.startsWith("http")
                          ? form.image
                          : `http://localhost:5001${form.image}`
                      }
                      alt={t("admin.previewAlt")}
                      className="mt-4 h-44 w-full rounded-2xl border border-white/10 object-cover"
                    />
                  ) : null}
                </div>

                <div className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <input
                    id="active"
                    type="checkbox"
                    checked={!!form.isActive}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isActive: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-[#dc2626]"
                  />
                  <label htmlFor="active" className="text-sm text-white/70">
                    {t("admin.active")}
                  </label>
                </div>

                <button className={`md:col-span-2 w-full ${accentButtonClassName}`}>
                  {editingId ? t("admin.saveChanges") : t("admin.addGame")}
                </button>
              </form>
            </section>

            <section className={`mt-8 ${panelClassName}`}>
              <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-4">
                <div className="font-semibold text-white">{t("admin.gamesList")}</div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/55">
                  {games.length}
                </span>
              </div>

              {loadingGames ? (
                <div className="py-4 text-white/60">{t("admin.loading")}</div>
              ) : games.length === 0 ? (
                <div className="py-4 text-white/60">{t("admin.noGames")}</div>
              ) : (
                <div className="mt-2 divide-y divide-white/8">
                  {games.map((game) => (
                    <GameRow
                      key={game.id}
                      game={game}
                      onEdit={onPickEdit}
                      onDelete={onPermanentDeleteGame}
                      onToggle={onToggleGameActive}
                      t={t}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            {errUsers ? (
              <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {errUsers}
              </div>
            ) : null}

            <section className={`mt-6 ${panelClassName}`}>
              <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-4">
                <div className="font-semibold text-white">{t("admin.usersList")}</div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/55">
                  {users.length}
                </span>
              </div>

              {loadingUsers ? (
                <div className="py-4 text-white/60">{t("admin.loading")}</div>
              ) : users.length === 0 ? (
                <div className="py-4 text-white/60">{t("admin.noUsers")}</div>
              ) : (
                <div className="mt-2 divide-y divide-white/8">
                  {users.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      isMe={Number(me?.id) === Number(user.id)}
                      onDisable={onDisableUser}
                      onEnable={onEnableUser}
                      t={t}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </PageSurface>
    </div>
  );
}
