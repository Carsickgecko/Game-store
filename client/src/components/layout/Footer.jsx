import {
  FaFacebookF,
  FaTwitter,
  FaDiscord,
  FaYoutube,
  FaInstagram,
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-neutral-950 text-white border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Contact */}
        <div>
          <h3 className="text-lg font-semibold">Contact Us</h3>
          <p className="mt-3 text-sm text-white/70">
            📧 Email:{" "}
            <a
              href="mailto:support@neonplay.com"
              className="hover:text-white transition underline underline-offset-4 decoration-white/30 hover:decoration-white"
            >
              support@neonplay.com
            </a>
          </p>
          <p className="mt-2 text-sm text-white/70">
            📞 Phone: +48 453 304 407
          </p>
        </div>

        {/* Social */}
        <div>
          <h3 className="text-lg font-semibold">Join our community</h3>
          <div className="mt-4 flex items-center gap-3">
            <SocialIcon label="Facebook" href="#" icon={FaFacebookF} />
            <SocialIcon label="Twitter" href="#" icon={FaTwitter} />
            <SocialIcon label="Discord" href="#" icon={FaDiscord} />
            <SocialIcon label="YouTube" href="#" icon={FaYoutube} />
            <SocialIcon label="Instagram" href="#" icon={FaInstagram} />
          </div>

          <p className="mt-4 text-xs text-white/50">
            Follow us for deals, updates, and community events (demo).
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 py-4">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/50">
          <div>© {new Date().getFullYear()} NeonPlay. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ href, icon: IconComp, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-10 h-10 rounded-full flex items-center justify-center
                 bg-white/10 border border-white/10
                 hover:bg-white hover:text-black hover:border-white
                 transition"
    >
      <IconComp className="text-lg" />
    </a>
  );
}
