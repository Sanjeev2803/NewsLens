"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface DisplayCardProps {
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  date?: string;
  iconClassName?: string;
  titleClassName?: string;
  image?: string | null;
  onClick?: () => void;
}

function DisplayCard({
  className,
  icon = <Sparkles className="size-4 text-blue-300" />,
  title = "Featured",
  description = "Discover amazing content",
  date = "Just now",
  iconClassName = "text-blue-500",
  titleClassName = "text-blue-500",
  image,
  onClick,
}: DisplayCardProps) {
  const [imgErr, setImgErr] = useState(false);
  const showImg = image && !imgErr;

  return (
    <div
      className={cn(
        "group/card relative flex w-[22rem] select-none flex-col rounded-xl border-2 overflow-hidden transition-all duration-500 hover:border-white/30",
        showImg ? "h-48" : "h-36 -skew-y-[8deg] bg-muted/70 backdrop-blur-sm px-4 py-3 after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[20rem] after:bg-gradient-to-l after:from-background after:to-transparent after:content-[''] hover:bg-muted [&>*]:flex [&>*]:items-center [&>*]:gap-2",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {showImg ? (
        <>
          {/* Full bleed background image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
            onError={() => setImgErr(true)}
          />
          {/* Cinematic overlays — keep image visible */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

          {/* Content pinned to bottom over the image */}
          <div className="relative z-10 mt-auto p-4 flex flex-col gap-1.5">
            {/* Rank badge + date row */}
            <div className="flex items-center gap-2">
              <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider backdrop-blur-sm", iconClassName)}>
                {icon}
                <span className={cn(titleClassName)}>{title}</span>
              </span>
              <span className="text-[10px] text-white/50 font-mono ml-auto">{date}</span>
            </div>
            {/* Headline */}
            <p className="text-sm font-semibold text-white leading-snug line-clamp-2 drop-shadow-lg">
              {description}
            </p>
          </div>

          {/* Hover glow */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/0 to-transparent group-hover/card:via-red-500/50 transition-all duration-500" />
        </>
      ) : (
        /* Fallback: original text-only card layout */
        <>
          <div className="relative z-10">
            <span className={cn("relative inline-block rounded-full bg-blue-800 p-1", iconClassName)}>
              {icon}
            </span>
            <p className={cn("text-lg font-medium", titleClassName)}>{title}</p>
          </div>
          <p className="relative z-10 whitespace-nowrap text-lg">{description}</p>
          <p className="relative z-10 text-muted-foreground">{date}</p>
        </>
      )}
    </div>
  );
}

interface DisplayCardsProps {
  cards?: DisplayCardProps[];
}

export default function DisplayCards({ cards }: DisplayCardsProps) {
  const defaultCards: DisplayCardProps[] = [
    {
      className: "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration:700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      className: "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration:700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      className: "[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-10",
    },
  ];

  const displayCards = cards || defaultCards;

  return (
    <div className="grid [grid-template-areas:'stack'] place-items-center opacity-100 animate-in fade-in-0 duration-700">
      {displayCards.map((cardProps, index) => (
        <DisplayCard key={index} {...cardProps} />
      ))}
    </div>
  );
}

export { DisplayCard };
export type { DisplayCardProps };
