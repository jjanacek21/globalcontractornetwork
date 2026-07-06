import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Is this the same machine as a Graco or Titan?",
    a: "Same architecture. Same Honda GX engine. Wear parts interchange with published Graco and Titan part numbers. OEM-grade equivalent — without the brand markup.",
  },
  {
    q: "What happens if it breaks?",
    a: "12-month parts warranty. US parts stock ships same day. You call, we ship, you keep working.",
  },
  {
    q: "Why 6–8 weeks?",
    a: "It's built against your order. That's how it stays 50–70% under brand price. If you need one now, we keep a small pool of in-stock demo units for urgent needs — ask.",
  },
  {
    q: "Is my deposit protected?",
    a: "You get a written sales order with your build spec, serial numbers, and ship window before we start. Miss the window by 15+ business days and you get a full refund, no argument.",
  },
  {
    q: "Do you ship nationwide?",
    a: "LTL liftgate to all 48 states. Freight is quoted by ZIP at order confirmation.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="max-w-3xl mx-auto space-y-2">
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="eq-plate">
            <button
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span className="eq-heading text-base md:text-lg">{f.q}</span>
              <ChevronDown
                className={`h-5 w-5 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-5 eq-text-2 text-sm leading-relaxed border-t eq-hairline pt-4">
                {f.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
