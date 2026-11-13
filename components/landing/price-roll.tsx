import type { CSSProperties } from "react";
import styles from "./landing.module.css";

// A blank cell, then two turns of the wheel.
const WHEEL = ["\u00a0", 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// A formatted price ("$5,064.37") whose digits roll into place like a shop
// price board turning over. Pure CSS, and the real digit is always in the
// layout: during the roll it is hidden and a decorative wheel spins up from
// a blank cell over it; when the roll ends the wheel disappears and the
// real digit shows. So the figure that stays on screen never depends on
// the wheel's transform maths (WebKit lays the wheel's cells out a hair
// shorter than Chromium, which once left iOS showing a wheel stuck between
// two rows). With no JS or with reduced motion the figure is simply there.
// The visible text is aria-hidden; screen readers get the plain value.
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
            // Land on the digit's cell in the wheel's second turn.
            "--to": digit + 11,
            "--cells": WHEEL.length,
            "--i": digitIndex++,
          } as CSSProperties;
          return (
            <span key={i} className={styles.digit} style={style}>
              <span className={styles.digitFinal}>{char}</span>
              <span className={styles.digitColumn}>
                {WHEEL.map((n, j) => (
                  <span key={j} className={styles.digitCell}>
                    {n}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
