import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, isAdmin, getUser } from "../store/auth.js";
import {
  adminFetchGames,
  adminCreateGame,
  adminUpdateGame,
  adminDeleteGame,
  uploadGameImage,
  adminFetchUsers,
  adminDisableUser,
  adminEnableUser,
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

export default function Admin() {
  const navigate = useNavigate();

  // ====== Tabs ======
  const [tab, setTab] = useState("games"); // "games" | "users"

  // ====== Games state ======
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [errGames, setErrGames] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  // ====== Users state ======
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errUsers, setErrUsers] = useState("");

  const me = getUser(); // để tránh disable chính mình

  // guard
  useEffect(() => {
    if (!isAuthenticated()) return navigate("/login");
    if (!isAdmin()) return navigate("/");
  }, [navigate]);

  // ====== Load games ======
  const loadGames = useCallback(async () => {
    setLoadingGames(true);
    setErrGames("");
    try {
      const list = await adminFetchGames();
      setGames(Array.isArray(list) ? list : []);
    } catch (e) {
      setErrGames(e?.response?.data?.message || "Failed to load admin games.");
    } finally {
      setLoadingGames(false);
    }
  }, []);

  // ====== Load users ======
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setErrUsers("");
    try {
      const list = await adminFetchUsers();
      setUsers(Array.isArray(list) ? list : []);
    } catch (e) {
      setErrUsers(e?.response?.data?.message || "Failed to load users.");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    // load mặc định cho tab games + users (đỡ phải reload khi chuyển tab)
    loadGames();
    loadUsers();
  }, [loadGames, loadUsers]);

  // ====== Games helpers ======
  const onPickEdit = (g) => {
    setEditingId(g.id);
    setForm({
      name: g.name || "",
      price: g.price ?? "",
      oldPrice: g.oldPrice ?? "",
      rating: g.rating ?? "",
      genre: g.genre || "Action",
      platform: g.platform || "PC",
      image: g.image || "",
      longDescription: g.longDescription || "",
      isActive: g.isActive !== false,
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
      setForm((s) => ({ ...s, image: url }));
    } catch (e) {
      setErrGames(e?.response?.data?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const onSubmitGame = async (e) => {
    e.preventDefault();
    setErrGames("");

    const payload = {
      ...form,
      price: Number(form.price),
      oldPrice: form.oldPrice === "" ? null : Number(form.oldPrice),
      rating: form.rating === "" ? null : Number(form.rating),
      isActive: form.isActive ? 1 : 0,
    };

    try {
      if (editingId) await adminUpdateGame(editingId, payload);
      else await adminCreateGame(payload);

      await loadGames();
      onReset();
    } catch (e2) {
      setErrGames(e2?.response?.data?.message || "Save game failed.");
    }
  };

  // Soft disable/enable game (tái dùng endpoint delete nếu backend bạn làm kiểu đó)
  const onToggleGameActive = async (g) => {
    setErrGames("");
    try {
      if (g.isActive) {
        if (!confirm("Disable this game (soft delete)?")) return;
        await adminDeleteGame(g.id);
      } else {
        // nếu backend bạn có endpoint enable game riêng thì thay ở đây
        // tạm thời: edit game và bật active lại
        await adminUpdateGame(g.id, { ...g, isActive: 1 });
      }
      await loadGames();
    } catch (e) {
      setErrGames(e?.response?.data?.message || "Action failed.");
    }
  };

  const activeCount = useMemo(
    () => games.filter((g) => g.isActive).length,
    [games],
  );

  // ====== Users helpers ======
  const onDisableUser = async (u) => {
    if (!confirm(`Disable user "${u.username}"?`)) return;
    setErrUsers("");
    try {
      await adminDisableUser(u.id);
      await loadUsers();
    } catch (e) {
      setErrUsers(e?.response?.data?.message || "Disable user failed.");
    }
  };

  const onEnableUser = async (u) => {
    if (!confirm(`Enable user "${u.username}"?`)) return;
    setErrUsers("");
    try {
      await adminEnableUser(u.id);
      await loadUsers();
    } catch (e) {
      setErrUsers(e?.response?.data?.message || "Enable user failed.");
    }
  };

  const userActiveCount = useMemo(
    () => users.filter((u) => u.isActive).length,
    [users],
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-black/60">
            Manage application • Games Active: <b>{activeCount}</b> /{" "}
            {games.length} • Users Active: <b>{userActiveCount}</b> /{" "}
            {users.length}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab("games")}
            className={`px-4 py-2 rounded-xl border text-sm transition ${
              tab === "games" ? "bg-black text-white border-black" : "bg-white"
            }`}
          >
            Manage games
          </button>
          <button
            onClick={() => setTab("users")}
            className={`px-4 py-2 rounded-xl border text-sm transition ${
              tab === "users" ? "bg-black text-white border-black" : "bg-white"
            }`}
          >
            Manage users
          </button>
        </div>
      </div>

      {/* =======================
          TAB: GAMES
         ======================= */}
      {tab === "games" && (
        <>
          {errGames && (
            <div className="mt-4 rounded-xl border px-4 py-3 text-sm bg-black text-white">
              {errGames}
            </div>
          )}

          {/* Form add/edit */}
          <div className="mt-6 rounded-2xl border bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="font-semibold">
                {editingId ? `Edit game #${editingId}` : "Add new game"}
              </div>
              {editingId && (
                <button onClick={onReset} className="text-sm underline">
                  Cancel edit
                </button>
              )}
            </div>

            <form
              onSubmit={onSubmitGame}
              className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="md:col-span-2">
                <label className="text-sm text-black/70">Name</label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, name: e.target.value }))
                  }
                  className="mt-2 w-full px-3 py-2 rounded-xl border outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-black/70">Price</label>
                <input
                  value={form.price}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, price: e.target.value }))
                  }
                  className="mt-2 w-full px-3 py-2 rounded-xl border outline-none"
                  inputMode="decimal"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-black/70">Old price</label>
                <input
                  value={form.oldPrice}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, oldPrice: e.target.value }))
                  }
                  className="mt-2 w-full px-3 py-2 rounded-xl border outline-none"
                  inputMode="decimal"
                />
              </div>

              <div>
                <label className="text-sm text-black/70">Rating (0-5)</label>
                <input
                  value={form.rating}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, rating: e.target.value }))
                  }
                  className="mt-2 w-full px-3 py-2 rounded-xl border outline-none"
                  inputMode="decimal"
                />
              </div>

              <div>
                <label className="text-sm text-black/70">Genre</label>
                <input
                  value={form.genre}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, genre: e.target.value }))
                  }
                  className="mt-2 w-full px-3 py-2 rounded-xl border outline-none"
                />
              </div>

              <div>
                <label className="text-sm text-black/70">Platform</label>
                <input
                  value={form.platform}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, platform: e.target.value }))
                  }
                  className="mt-2 w-full px-3 py-2 rounded-xl border outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-black/70">Description</label>
                <textarea
                  value={form.longDescription}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, longDescription: e.target.value }))
                  }
                  className="mt-2 w-full px-3 py-2 rounded-xl border outline-none min-h-[120px]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-black/70">Image</label>
                <div className="mt-2 flex flex-col md:flex-row gap-3 md:items-center">
                  <input
                    value={form.image}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, image: e.target.value }))
                    }
                    className="flex-1 px-3 py-2 rounded-xl border outline-none"
                    placeholder="/uploads/xxx.jpg or https://..."
                  />
                  <label className="px-4 py-2 rounded-xl border cursor-pointer text-sm w-fit">
                    {uploading ? "Uploading..." : "Upload file"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onUpload(e.target.files?.[0])}
                    />
                  </label>
                </div>

                {form.image && (
                  <img
                    src={
                      form.image.startsWith("http")
                        ? form.image
                        : `http://localhost:5001${form.image}`
                    }
                    alt="preview"
                    className="mt-3 h-40 w-full object-cover rounded-xl border"
                  />
                )}
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <input
                  id="active"
                  type="checkbox"
                  checked={!!form.isActive}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, isActive: e.target.checked }))
                  }
                />
                <label htmlFor="active" className="text-sm text-black/70">
                  Active (show in store)
                </label>
              </div>

              <button className="md:col-span-2 w-full px-4 py-3 rounded-xl bg-black text-white">
                {editingId ? "Save changes" : "Add game"}
              </button>
            </form>
          </div>

          {/* List */}
          <div className="mt-8 rounded-2xl border bg-white overflow-hidden">
            <div className="p-4 font-semibold">Games list</div>

            {loadingGames ? (
              <div className="p-4 text-black/60">Loading...</div>
            ) : games.length === 0 ? (
              <div className="p-4 text-black/60">No games.</div>
            ) : (
              <div className="divide-y">
                {games.map((g) => (
                  <div key={g.id} className="p-4 flex items-center gap-4">
                    <img
                      src={
                        g.image
                          ? g.image.startsWith("http")
                            ? g.image
                            : `http://localhost:5001${g.image}`
                          : "/images/hero-bg.jpg"
                      }
                      alt={g.name}
                      className="w-20 h-14 rounded-xl border object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold line-clamp-1">
                        {g.name}{" "}
                        {!g.isActive && (
                          <span className="text-xs text-black/50">
                            (disabled)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-black/60">
                        {g.genre} • {g.platform} • ${Number(g.price).toFixed(2)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onPickEdit(g)}
                        className="px-3 py-2 rounded-xl border text-sm hover:bg-black hover:text-white transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onToggleGameActive(g)}
                        className="px-3 py-2 rounded-xl border text-sm hover:bg-black hover:text-white transition"
                      >
                        {g.isActive ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* =======================
          TAB: USERS
         ======================= */}
      {tab === "users" && (
        <>
          {errUsers && (
            <div className="mt-4 rounded-xl border px-4 py-3 text-sm bg-black text-white">
              {errUsers}
            </div>
          )}

          <div className="mt-6 rounded-2xl border bg-white overflow-hidden">
            <div className="p-4 font-semibold">Users list</div>

            {loadingUsers ? (
              <div className="p-4 text-black/60">Loading...</div>
            ) : users.length === 0 ? (
              <div className="p-4 text-black/60">No users.</div>
            ) : (
              <div className="divide-y">
                {users.map((u) => {
                  const isMe = Number(me?.id) === Number(u.id);
                  return (
                    <div key={u.id} className="p-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold line-clamp-1">
                          {u.username}{" "}
                          {!u.isActive && (
                            <span className="text-xs text-black/50">
                              (disabled)
                            </span>
                          )}
                          {isMe && (
                            <span className="ml-2 text-xs bg-black text-white px-2 py-0.5 rounded-full">
                              you
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-black/60">
                          {u.email} • roleId: {u.roleId} • id: {u.id}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {u.isActive ? (
                          <button
                            disabled={isMe}
                            onClick={() => onDisableUser(u)}
                            className={`px-3 py-2 rounded-xl border text-sm transition ${
                              isMe
                                ? "opacity-40 cursor-not-allowed"
                                : "hover:bg-black hover:text-white"
                            }`}
                          >
                            Disable
                          </button>
                        ) : (
                          <button
                            onClick={() => onEnableUser(u)}
                            className="px-3 py-2 rounded-xl border text-sm hover:bg-black hover:text-white transition"
                          >
                            Enable
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 text-xs text-black/60"></div>
        </>
      )}
    </div>
  );
}
