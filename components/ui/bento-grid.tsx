import { IconProps } from "@radix-ui/react-icons/dist/types";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

export interface BentoCardProps {
  name: string;
  className?: string;
  background?: ReactNode;
  Icon: React.ForwardRefExoticComponent<
    IconProps & React.RefAttributes<SVGSVGElement>
  >;
  description: string;
  href: string;
  cta: string;
}

const BentoGrid = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "mx-auto grid w-full auto-rows-[22rem] grid-cols-3 gap-4",
        className
      )}
    >
      {children}
    </div>
  );
};

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
}: BentoCardProps) => (
  <div
    key={name}
    className={cn(
      "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-2xl",
      // light styles
      "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
      // dark styles — kept neutral so it never clashes with the saffron/green body
      "transform-gpu transition-transform duration-300 hover:-translate-y-1 will-change-transform sm:col-span-1",
      className
    )}
  >
    {/* ambient glow on hover — NagrikTriage saffron → amber → green */}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      style={{
        background:
          "radial-gradient(600px circle at 50% 0%, rgba(255,153,51,0.12), rgba(19,136,8,0.06) 45%, transparent 70%)",
      }}
    />
    <div>{background}</div>
    <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-10">
      <Icon className="h-10 w-10 origin-left transform-gpu text-slate-700 transition-all duration-300 group-hover:scale-75" />
      <h3 className="text-xl font-bold text-slate-900">{name}</h3>
      <p className="max-w-lg text-slate-600">{description}</p>
    </div>

    <div
      className={cn(
        "pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
      )}
    >
      <a
        href={href}
        className="pointer-events-auto inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
      >
        {cta}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </a>
    </div>
    <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-slate-950/[0.03]" />
  </div>
);

export { BentoCard, BentoGrid };
