import { useLanguage } from "../../contexts/LanguageContext.jsx";

export default function AboutSection() {
  const { t } = useLanguage();

  const cards = [
    { title: t("about.mission"), desc: t("about.missionDesc") },
    { title: t("about.vision"), desc: t("about.visionDesc") },
    { title: t("about.focus"), desc: t("about.focusDesc") },
  ];

  const tags = [
    t("about.individuality"),
    t("about.innovation"),
    t("about.gamingCommunity"),
    t("about.trustedKeys"),
    t("about.playerFirst"),
  ];

  return (
    <section
      id="about"
      className="border-t border-white/10 bg-[#090714]/82 text-white backdrop-blur-md"
    >
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs">
            {t("about.badge")}
          </div>

          <h2 className="mt-5 text-3xl font-bold md:text-4xl">
            {t("about.title")}
          </h2>

          <p className="mx-auto mt-3 max-w-3xl text-sm text-white/70 md:text-base">
            {t("about.subtitle")}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {cards.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/6 p-6 backdrop-blur-sm"
            >
              <div className="font-semibold">{item.title}</div>
              <div className="mt-2 text-sm leading-relaxed text-white/70">
                {item.desc}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <div className="text-xs text-white/50">{t("about.believe")}</div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-12 overflow-hidden rounded-3xl border border-white/10 bg-white/6 backdrop-blur-sm">
          <div className="p-8 md:p-10">
            <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs">
              {t("about.welcome")}
            </div>

            <div className="mt-4 text-2xl font-bold md:text-3xl">
              {t("about.bannerTitle")}
            </div>

            <div className="mt-2 max-w-2xl text-white/70">
              {t("about.bannerSubtitle")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
