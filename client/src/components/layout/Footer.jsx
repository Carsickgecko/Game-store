import {
  FaDiscord,
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

const languageOptions = [
  { value: "en", labelKey: "common.english" },
  { value: "vi", labelKey: "common.vietnamese" },
];

export default function Footer() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <footer className="border-t border-white/10 bg-[#090714]/84 text-white backdrop-blur-md">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <h3 className="text-lg font-semibold">{t("footer.contactUs")}</h3>
          <p className="mt-3 text-sm text-white/70">
            {t("footer.email")}:{" "}
            <a
              href="mailto:support@neonplay.com"
              className="underline underline-offset-4 decoration-white/30 transition hover:text-white hover:decoration-white"
            >
              support@neonplay.com
            </a>
          </p>
          <p className="mt-2 text-sm text-white/70">
            {t("footer.phone")}: +48 453 304 407
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold">{t("footer.community")}</h3>
          <div className="mt-4 flex items-center gap-3">
            <SocialIcon label="Facebook" href="#" icon={FaFacebookF} />
            <SocialIcon label="Twitter" href="#" icon={FaTwitter} />
            <SocialIcon label="Discord" href="#" icon={FaDiscord} />
            <SocialIcon label="YouTube" href="#" icon={FaYoutube} />
            <SocialIcon label="Instagram" href="#" icon={FaInstagram} />
          </div>

          <p className="mt-4 text-xs text-white/50">{t("footer.follow")}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold">{t("common.language")}</h3>
          <p className="mt-3 text-sm text-white/60">
            {t("footer.languageHelp")}
          </p>

          <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/[0.06] p-1 backdrop-blur-sm">
            {languageOptions.map((option) => {
              const active = language === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLanguage(option.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-[#dc2626] text-white shadow-[0_16px_30px_-20px_rgba(220,38,38,0.95)]"
                      : "text-white/68 hover:text-white"
                  }`}
                >
                  {t(option.labelKey)}
                </button>
              );
            })}
          </div>

        </div>
      </div>

      <div className="border-t border-white/10 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-xs text-white/50 sm:flex-row">
          <div>
            © {new Date().getFullYear()} NeonPlay. {t("footer.rightsReserved")}
          </div>
          <div className="uppercase tracking-[0.24em] text-white/35">
            {t("footer.selected")}
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ href, icon, label }) {
  const IconComp = icon;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 transition hover:border-cyan-300/50 hover:bg-cyan-300/15 hover:text-white"
    >
      <IconComp className="text-lg" />
    </a>
  );
}
