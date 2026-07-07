import clsx from "clsx";

// Reusable NagrikTriage logo. Renders the brand PNG at a few sizes with an
// optional rounded-ring treatment that matches the old "NT" text badge.
//
// Usage:
//   <Logo />                 // default 36px
//   <Logo size={40} />       // 40px
//   <Logo href="/" />        // wrap in a link
export default function Logo({
  size = 36,
  href,
  className,
}: {
  size?: number;
  href?: string;
  className?: string;
}) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="NagrikTriage logo"
      width={size}
      height={size}
      className={clsx(
        "rounded-full object-cover border border-slate-200 shadow-sm bg-white",
        className
      )}
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0">
        {img}
      </Link>
    );
  }
  return img;
}

// Imported lazily so the component stays usable from client components
// without forcing every consumer onto Next's Link.
import Link from "next/link";
