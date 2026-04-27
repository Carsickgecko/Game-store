import { Link, useLocation } from "react-router-dom";
import { FiChevronRight, FiCompass, FiSettings, FiShield } from "react-icons/fi";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

function buildTabs(t, isAdminView) {
  if (isAdminView) {
    return [
      {
        key: "dashboard",
        label: t("accountShell.dashboard"),
        to: "/account",
        matches: ["/account"],
        icon: true,
      },
    ];
  }

  return [
    {
      key: "dashboard",
      label: t("accountShell.dashboard"),
      to: "/account",
      matches: ["/account"],
      icon: true,
    },
    {
      key: "orders",
      label: t("accountShell.myOrders"),
      to: "/orders",
      matches: ["/orders"],
    },
    {
      key: "wishlist",
      label: t("accountShell.wishlist"),
      to: "/wishlist",
      matches: ["/wishlist"],
    },
    {
      key: "library",
      label: t("accountShell.library"),
      to: "/library",
      matches: ["/library"],
    },
    {
      key: "achievements",
      label: t("accountShell.achievements"),
      to: "/achievements",
      matches: ["/achievements"],
    },
  ];
}

function isActivePath(pathname, tab) {
  if (!tab.matches?.length) {
    return false;
  }

  return tab.matches.some((path) => pathname === path);
}

function NavItem({ tab, active }) {
  const sharedClassName = `relative inline-flex items-center gap-2 whitespace-nowrap pb-4 text-[0.98rem] transition ${
    active ? "text-[#dc2626]" : "text-white/88"
  }`;

  const content = (
    <>
      {tab.icon ? <FiCompass className="size-4" /> : null}
      <span>{tab.label}</span>
      {tab.key === "dashboard" ? (
        <FiChevronRight className="ml-1 size-4 text-white/35" />
      ) : null}
      {active ? (
        <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#dc2626]" />
      ) : null}
    </>
  );

  if (!tab.to) {
    return (
      <span className={`${sharedClassName} cursor-default text-white/68`}>
        {content}
      </span>
    );
  }

  return (
    <Link to={tab.to} className={`${sharedClassName} hover:text-white`}>
      {content}
    </Link>
  );
}

export default function AccountShell({
  title,
  description,
  actions = null,
  children,
  showTabs = true,
  isAdminView = false,
}) {
  const { t } = useLanguage();
  const location = useLocation();
  const settingsActive = location.pathname === "/account/settings";
  const tabs = buildTabs(t, isAdminView);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 text-white">
      <div className="rounded-[32px] border border-white/8 bg-[#262626] px-6 py-6 shadow-[0_34px_70px_-42px_rgba(0,0,0,0.95)]">
        {showTabs ? (
          <>
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                {tabs.map((tab) => (
                  <NavItem
                    key={tab.key}
                    tab={tab}
                    active={isActivePath(location.pathname, tab)}
                  />
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-6">
                {isAdminView ? (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-3 self-start pb-4 text-[0.98rem] text-white/88 transition hover:text-white xl:self-auto"
                  >
                    <FiShield className="size-4" />
                    <span>{t("admin.title")}</span>
                  </Link>
                ) : null}

                <Link
                  to="/account/settings"
                  className={`inline-flex items-center gap-3 self-start pb-4 text-[0.98rem] transition xl:self-auto ${
                    settingsActive
                      ? "text-[#dc2626]"
                      : "text-white/88 hover:text-white"
                  }`}
                >
                  <FiSettings className="size-4" />
                  <span>{t("accountShell.settings")}</span>
                </Link>
              </div>
            </div>

            <div className="mt-1 border-t border-white/10" />
          </>
        ) : null}

        {(title || description || actions) && (
          <div className="mt-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              {title ? (
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              ) : null}
              {description ? (
                <p className="mt-2 text-sm text-white/62">{description}</p>
              ) : null}
            </div>

            {actions ? <div className="shrink-0">{actions}</div> : null}
          </div>
        )}

        <div className="mt-7">{children}</div>
      </div>
    </div>
  );
}
