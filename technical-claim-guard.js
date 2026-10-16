'use strict';

function cleanTechnicalAnswer(answer, context) {
  if (!context || !answer) return answer;

  const unverified =
    /\b(?:lower|higher)\s+(?:highs?|lows?)\b|head.and.shoulders|double.top|double.bottom|bull.flag|bear.flag|falling.wedge|rising.wedge/i;

  const asset =
    context.match(/^Asset:\s*([^\n(]+)/m)?.[1]?.trim()
    || 'The asset';

  const fourHour =
    context.match(/^4H completed:[^\n]+/m)?.[0] || '';

  const alignment =
    fourHour.match(/\b(Bullish|Bearish|Mixed) EMA alignment/i);

  const factual = alignment
    ? `${asset} shows ${alignment[1].toLowerCase()} 4H EMA alignment. Swing structure is not independently verified.`
    : `${asset} has insufficient verified structure data.`;

  return answer.replace(
    /(•\s*Market Structure:\s*\n)([^\n]+)/i,
    (original, heading, statement) =>
      unverified.test(statement)
        ? heading + factual
        : original
  );
}

module.exports = { cleanTechnicalAnswer };
