import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-mist-gray/10 bg-shadow-dark py-10 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="text-center md:text-left">
            <span className="font-brand text-lg text-sharingan-red">NewsLens</span>
            <p className="text-xs text-mist-gray/40 mt-1">AI-powered news intelligence platform</p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-xs text-mist-gray/40">
            <Link href="/trending" className="hover:text-mist-gray/70 transition-colors">Trending</Link>
            <Link href="/whatif" className="hover:text-mist-gray/70 transition-colors">What If</Link>
            <Link href="/whatif/create" className="hover:text-mist-gray/70 transition-colors">Create</Link>
            <Link href="/profile" className="hover:text-mist-gray/70 transition-colors">Profile</Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-mist-gray/[0.06] text-center">
          <p className="text-[11px] text-mist-gray/25">
            &copy; 2026 NewsLens. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
