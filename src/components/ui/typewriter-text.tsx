"use client";

import { useEffect, useRef, useState } from "react";

interface TypewriterTextProps {
  texts: string[];
  typeSpeed?: number;
  eraseSpeed?: number;
  pauseAfter?: number;
  /** When true, adds a blinking cursor and smooth erase */
  enhance?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function TypewriterText({
  texts,
  typeSpeed = 60,
  eraseSpeed = 30,
  pauseAfter = 1500,
  enhance = false,
  className,
  style,
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const indexRef = useRef(0);
  const phaseRef = useRef<"typing" | "pausing" | "erasing">("typing");
  const charRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cursor blink
  useEffect(() => {
    if (!enhance) return;
    const id = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(id);
  }, [enhance]);

  useEffect(() => {
    if (!texts.length) return;

    function tick() {
      const current = texts[indexRef.current] ?? "";

      if (phaseRef.current === "typing") {
        charRef.current += 1;
        setDisplayed(current.slice(0, charRef.current));
        if (charRef.current >= current.length) {
          phaseRef.current = "pausing";
          timerRef.current = setTimeout(tick, pauseAfter);
          return;
        }
        timerRef.current = setTimeout(tick, typeSpeed);

      } else if (phaseRef.current === "pausing") {
        phaseRef.current = "erasing";
        timerRef.current = setTimeout(tick, eraseSpeed);

      } else {
        // erasing
        charRef.current -= 1;
        setDisplayed(current.slice(0, charRef.current));
        if (charRef.current <= 0) {
          indexRef.current = (indexRef.current + 1) % texts.length;
          phaseRef.current = "typing";
          timerRef.current = setTimeout(tick, typeSpeed);
          return;
        }
        timerRef.current = setTimeout(tick, eraseSpeed);
      }
    }

    timerRef.current = setTimeout(tick, typeSpeed);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [texts, typeSpeed, eraseSpeed, pauseAfter]);

  return (
    <span className={className} style={style}>
      {displayed}
      {enhance && (
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: "3px",
            height: "1em",
            background: "currentColor",
            marginLeft: "2px",
            verticalAlign: "text-bottom",
            borderRadius: "1px",
            opacity: cursorVisible ? 1 : 0,
            transition: "opacity 0.1s",
          }}
        />
      )}
    </span>
  );
}
