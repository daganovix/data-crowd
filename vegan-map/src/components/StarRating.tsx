import { useState } from "react";
import { Star } from "lucide-react";

interface Props {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
}

export default function StarRating({ value, onChange, size = 22, readOnly }: Props) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= shown;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className={readOnly ? "cursor-default" : "cursor-pointer transition-transform hover:scale-110"}
            onMouseEnter={() => !readOnly && setHover(n)}
            onClick={() => {
              if (readOnly || !onChange) return;
              // Click the current rating again to clear it.
              onChange(value === n ? 0 : n);
            }}
          >
            <Star
              size={size}
              className={active ? "fill-amber-400 text-amber-400" : "fill-transparent text-leaf-300"}
            />
          </button>
        );
      })}
    </div>
  );
}
