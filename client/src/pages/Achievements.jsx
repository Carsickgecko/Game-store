import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiAward,
  FiBookOpen,
  FiCheckCircle,
  FiHeart,
  FiShoppingCart,
  FiStar,
  FiTarget,
  FiUser,
  FiZap,
} from "react-icons/fi";
import AccountShell from "../components/account/AccountShell.jsx";
import { isAuthenticated } from "../store/auth.js";
import { fetchMyAchievements } from "../api/achievements.js";
import { useLanguage } from "../contexts/LanguageContext.jsx";

const iconMap = {
  spark: FiStar,
  user: FiUser,
  heart: FiHeart,
  target: FiTarget,
  book: FiBookOpen,
  trophy: FiAward,
  cart: FiShoppingCart,
  bolt: FiZap,
};

function AchievementCard({ achievement, language, t }) {
  const Icon = iconMap[achievement.icon] || FiAward;
  const title = language === "vi" ? achievement.titleVi : achievement.titleEn;
  const description =
    language === "vi"
      ? achievement.descriptionVi
      : achievement.descriptionEn;
  const locale = language === "vi" ? "vi-VN" : "en-US";
  const unlockedAt = achievement.unlockedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
        new Date(achievement.unlockedAt),
      )
    : null;

  return (
    <article className="rounded-[28px] border border-white/8 bg-[#1d1d1d] p-6">
      <div className="flex items-start justify-between gap-4">
        <div
          className="inline-flex rounded-2xl p-3"
          style={{
            color: achievement.accentColor || "#dc2626",
            backgroundColor: `${achievement.accentColor || "#dc2626"}22`,
          }}
        >
          <Icon className="size-6" />
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
            achievement.unlocked
              ? "border-emerald-300/20 bg-emerald-400/15 text-emerald-200"
              : "border-white/10 bg-white/5 text-white/55"
          }`}
        >
          {achievement.unlocked
            ? t("achievements.unlocked")
            : t("achievements.inProgress")}
        </span>
      </div>

      <h2 className="mt-5 text-xl font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-white/62">{description}</p>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-white/45">
          <span>{t("achievements.progress")}</span>
          <span>
            {t("achievements.criteriaValue", {
              current: achievement.currentValue,
              target: achievement.thresholdValue,
            })}
          </span>
        </div>

        <div className="h-2.5 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${achievement.progressPercent}%`,
              backgroundColor: achievement.accentColor || "#dc2626",
            }}
          />
        </div>
      </div>

      <div className="mt-5 space-y-2 text-sm text-white/62">
        <div className="flex items-center justify-between gap-4">
          <span>{t("achievements.requirement")}</span>
          <span className="font-medium text-white/80">
            {t("achievements.criteriaValue", {
              current: achievement.currentValue,
              target: achievement.thresholdValue,
            })}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span>{t("achievements.nextGoal")}</span>
          <span className="font-medium text-white/80">
            {achievement.unlocked
              ? t("achievements.completed")
              : t("achievements.keepGoing")}
          </span>
        </div>

        {unlockedAt ? (
          <div className="flex items-center justify-between gap-4">
            <span>{t("achievements.unlockedOn")}</span>
            <span className="font-medium text-white/80">{unlockedAt}</span>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function Achievements() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState([]);
  const [summary, setSummary] = useState({
    unlockedCount: 0,
    totalCount: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");
        const data = await fetchMyAchievements();
        if (!alive) return;

        setAchievements(Array.isArray(data?.data) ? data.data : []);
        setSummary({
          unlockedCount: Number(data?.summary?.unlockedCount || 0),
          totalCount: Number(data?.summary?.totalCount || 0),
          completionRate: Number(data?.summary?.completionRate || 0),
        });
      } catch (error) {
        if (!alive) return;
        setErr(error?.response?.data?.message || t("achievements.failedLoad"));
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [navigate, t]);

  const nextGoal = useMemo(() => {
    return [...achievements]
      .filter((item) => !item.unlocked)
      .sort((a, b) => b.progressPercent - a.progressPercent)[0];
  }, [achievements]);

  const nextGoalTitle = nextGoal
    ? language === "vi"
      ? nextGoal.titleVi
      : nextGoal.titleEn
    : null;

  return (
    <AccountShell
      title={t("achievements.title")}
      description={t("achievements.description")}
    >
      {loading ? <div className="text-white/60">{t("achievements.loading")}</div> : null}

      {err ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {err}
        </div>
      ) : null}

      {!loading && !err ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/8 bg-[#1d1d1d] p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-white/45">
                {t("achievements.earned")}
              </div>
              <div className="mt-4 text-3xl font-bold text-white">
                {summary.unlockedCount}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/8 bg-[#1d1d1d] p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-white/45">
                {t("achievements.total")}
              </div>
              <div className="mt-4 text-3xl font-bold text-white">
                {summary.totalCount}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/8 bg-[#1d1d1d] p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-white/45">
                {t("achievements.completion")}
              </div>
              <div className="mt-4 text-3xl font-bold text-white">
                {summary.completionRate}%
              </div>
            </div>
          </div>

          {nextGoalTitle ? (
            <div className="mt-6 rounded-[28px] border border-white/8 bg-[linear-gradient(135deg,rgba(220,38,38,0.18),rgba(255,255,255,0.02))] p-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/65">
                <FiCheckCircle className="size-3.5" />
                {t("achievements.nextGoal")}
              </div>

              <div className="mt-4 text-2xl font-semibold text-white">
                {nextGoalTitle}
              </div>

              <div className="mt-2 text-sm text-white/65">
                {t("achievements.criteriaValue", {
                  current: nextGoal.currentValue,
                  target: nextGoal.thresholdValue,
                })}
              </div>

              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${nextGoal.progressPercent}%`,
                    backgroundColor: nextGoal.accentColor || "#dc2626",
                  }}
                />
              </div>
            </div>
          ) : null}

          {achievements.length === 0 ? (
            <div className="mt-6 rounded-[28px] border border-white/8 bg-[#1d1d1d] px-6 py-10 text-white/60">
              {t("achievements.empty")}
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
              {achievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  language={language}
                  t={t}
                />
              ))}
            </div>
          )}
        </>
      ) : null}
    </AccountShell>
  );
}
