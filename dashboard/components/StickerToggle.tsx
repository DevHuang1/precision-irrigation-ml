"use client";

import { useState } from "react";
import AnimatedSticker from "@/components/AnimatedSticker";

export default function StickerToggle() {
  const [state, setState] = useState<"resting" | "working">("working");

  return <AnimatedSticker state={state} onChange={setState} />;
}
