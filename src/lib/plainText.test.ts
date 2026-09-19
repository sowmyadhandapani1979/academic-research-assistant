import { describe, expect, it } from "vitest";
import { scholarlyPlainText } from "./plainText";

describe("scholarlyPlainText", () => {
  it("turns MathML subscripts into readable formula text", () => {
    const raw =
      'Anisotropic magnetic behavior of <mml:math xmlns:mml="http://www.w3.org/1998/Math/MathML"><mml:mrow><mml:msub><mml:mi>Nd</mml:mi><mml:mn>3</mml:mn></mml:msub><mml:msub><mml:mi>ScBi</mml:mi><mml:mn>5</mml:mn></mml:msub></mml:mrow></mml:math>';
    expect(scholarlyPlainText(raw)).toBe(
      "Anisotropic magnetic behavior of Nd3ScBi5",
    );
  });

  it("drops truncated MathML that never closes the tag", () => {
    const raw =
      'Probing the Mott insulating behavior of Ba2MgReO6 with <mml:math xmlns:mml="http://www.w3.org/1998';
    expect(scholarlyPlainText(raw)).toBe(
      "Probing the Mott insulating behavior of Ba2MgReO6 with",
    );
  });
});
