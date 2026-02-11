export default function AboutSection() {
  return (
    <section
      id="about"
      className="bg-neutral-950 text-white border-t border-white/10"
    >
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-xs bg-white/10 border border-white/10 px-3 py-1 rounded-full">
            About Us
          </div>

          <h2 className="mt-5 text-3xl md:text-4xl font-bold">
            Your Trusted Digital Game Key Store
          </h2>

          <p className="mt-3 text-sm md:text-base text-white/70 max-w-3xl mx-auto">
            We provide gamers with fast, secure, and affordable access to
            digital game keys — with instant delivery and a smooth purchasing
            experience.
          </p>
        </div>

        {/* 3 cards */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Our Mission",
              desc: "Provide gamers with fast, secure, and affordable access to digital game keys from trusted platforms worldwide.",
            },
            {
              title: "Our Vision",
              desc: "Become a reliable destination for gamers by offering a wide selection of games, instant delivery, and a smooth checkout flow.",
            },
            {
              title: "Our Focus",
              desc: "Transparency, customer satisfaction, and secure transactions to ensure every purchase is simple and worry-free.",
            },
          ].map((x) => (
            <div
              key={x.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <div className="font-semibold">{x.title}</div>
              <div className="mt-2 text-sm text-white/70 leading-relaxed">
                {x.desc}
              </div>
            </div>
          ))}
        </div>

        {/* tags */}
        <div className="mt-10 text-center">
          <div className="text-xs text-white/50">We believe in</div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {[
              "Individuality",
              "Innovation",
              "Gaming Community",
              "Trusted Keys",
              "Player First",
            ].map((t) => (
              <span
                key={t}
                className="text-xs px-3 py-2 rounded-full bg-white/10 border border-white/10"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* bottom banner */}
        <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="p-8 md:p-10">
            <div className="text-xs bg-white/10 inline-flex px-3 py-1 rounded-full border border-white/10">
              Welcome to GameStore
            </div>

            <div className="mt-4 text-2xl md:text-3xl font-bold">
              Unlock Your Next Game
            </div>

            <div className="mt-2 text-white/70 max-w-2xl">
              Digital keys delivered in seconds. Explore the store, grab deals,
              and start playing tonight.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
