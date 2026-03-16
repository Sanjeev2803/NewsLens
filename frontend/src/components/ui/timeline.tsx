"use client";
import {
  useMotionValueEvent,
  useScroll,
  useTransform,
  motion,
} from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  // Suppress unused variable warning — framer-motion requires the event hook to drive the animation
  useMotionValueEvent(scrollYProgress, "change", () => {});

  return (
    <div
      className="w-full font-sans"
      ref={containerRef}
    >
      <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex justify-start pt-10 md:pt-16 gap-4 md:gap-8"
          >
            {/* Timeline dot + label sidebar — fixed narrow width */}
            <div className="sticky flex flex-col z-40 items-start top-40 self-start flex-shrink-0 w-10 md:w-48">
              <div className="h-10 w-10 rounded-full bg-[#0a0a10] flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-sharingan-red/20 border border-sharingan-red/40 p-2" />
              </div>
              <h3 className="hidden md:block text-lg font-heading font-bold text-mist-gray/60 mt-2 whitespace-nowrap">
                {item.title}
              </h3>
            </div>

            {/* Content area — fills remaining width */}
            <div className="relative flex-1 min-w-0">
              <h3 className="md:hidden block text-xl mb-4 text-left font-heading font-bold text-mist-gray/60">
                {item.title}
              </h3>
              {item.content}
            </div>
          </div>
        ))}
        <div
          style={{
            height: height + "px",
          }}
          className="absolute left-[19px] md:left-[19px] top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-mist-gray/20 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-t from-sharingan-red via-chakra-orange to-transparent from-[0%] via-[10%] rounded-full"
          />
        </div>
      </div>
    </div>
  );
};
