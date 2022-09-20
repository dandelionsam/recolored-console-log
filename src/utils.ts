import * as vscode from 'vscode';

export function toHex(n: number): string {
  const r = n.toString(16)
  return r.length !== 2 ? '0' + r : r
}

export function toRgba(n: string): vscode.Color {
  n = n.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16) / 255
  const g = parseInt(n.slice(2, 4), 16) / 255
  const b = parseInt(n.slice(4, 6), 16) / 255
  const a = n.length > 7 ? parseInt(n.slice(4, 6), 16) / 255 : 1
  return new vscode.Color(r, g, b, a)
}

/**
 *
 * @source https://stackoverflow.com/questions/9733288/how-to-programmatically-calculate-the-contrast-ratio-between-two-colors 
 * @description According to Wikipedia, when converting to grayscale representation of luminance, "one must obtain the values of its red, green, and blue" and mix them in next proportion: R:30% G:59% B:11%
 * Therefore white will have 100% luminance and yellow will have 89%. At the same time, green has as small as 59%. 11% is almost four times lower than 41% difference!
 * And even lime (#00ff00) is not good for reading large amounts of texts.
 * @imho for good contrast colors' brightness should differ at least for 50%. And this brightness should be measured as converted to grayscale.
 * @update Recently found a comprehensive tool for that on the web which in order uses formula from w3 document Threshold values could be taken from #1.4 Here is an implementation for this more advanced thing.
*/

function _luminance(color: vscode.Color): number {
  var a = [color.red, color.green, color.blue].map(function (v) {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * 
 * @description Calculate the contrast ratio between two colours, provided in rgb form.
 * @note Minimal recommended contrast ratio is 4.5, or 3 for larger font-sizes.
 * @param rgb1 First color.
 * @param rgb2 Second color.
 * @returns Contrast ratio between the two colours.
 */
export function contrast(rgb1: vscode.Color, rgb2: vscode.Color): number {
  var lum1 = _luminance(rgb1);
  var lum2 = _luminance(rgb2);
  var brightest = Math.max(lum1, lum2);
  var darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}
