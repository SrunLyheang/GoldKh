import type { CSSProperties } from "react";
import styles from "./landing.module.css";

// A blank cell, then two turns of the wheel.
const WHEEL = ["\u00a0", 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// A formatted price ("$5,064.37") whose digits roll into place like a shop
// price board turning over. Pure CSS: the server renders every column at
// its final digit, and a keyframe rolls each one up from a blank cell —
// so a wrong digit is never shown, and with no JS or with reduced motion
// the figure is simply there. The visible text is aria-hidden; screen readers
// get the plain value.
export function PriceRoll({ value }: { value: string }) {
  let digitIndex = 0;
  return (
    <span className={styles.roll}>
      <span className={styles.srOnly}>{value}</span>
      <span aria-hidden="true" className={styles.roll}>
        {Array.from(value).map((char, i) => {
          if (!/\d/.test(char)) {
            return <span key={i}>{char}</span>;
          }
          const digit = Number(char);
          const style = {
            "--from": 0,
            "--to": digit + 11,
            "--i": digitIndex++,
          } as CSSProperties;
          return (
            <span key={i} className={styles.digit}>
              <span className={styles.digitSizer}>{char}</span>
              <span className={styles.digitColumn} style={style}>
                {WHEEL.map((n, j) => (
                  <span key={j}>{n}</span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
