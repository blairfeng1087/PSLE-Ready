"use client";
import React from "react";

function Fraction({ num, den }: { num: string; den: string }) {
  return (
    <span className="inline-flex flex-col items-center mx-0.5 leading-none" style={{ verticalAlign: "middle" }}>
      <span className="text-[0.8em] leading-none px-0.5">{num}</span>
      <span className="w-full h-px bg-current" />
      <span className="text-[0.8em] leading-none px-0.5">{den}</span>
    </span>
  );
}

export default function MathText({ text }: { text: string }) {
  const parts = text.split(/(\d+\s+\d+\/\d+|\d+\/\d+)/g);
  return (
    <>
      {parts.map((part, i) => {
        const mixed = part.match(/^(\d+)\s+(\d+)\/(\d+)$/);
        if (mixed) {
          return (
            <span key={i} className="inline-flex items-center">
              <span>{mixed[1]}</span>
              <Fraction num={mixed[2]} den={mixed[3]} />
            </span>
          );
        }
        const frac = part.match(/^(\d+)\/(\d+)$/);
        if (frac) {
          return <Fraction key={i} num={frac[1]} den={frac[2]} />;
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}
