export function calculateRank(stars, commits, prs, issues) {
  const score = stars * 4 + commits * 2 + prs * 2 + issues;

  if (score > 10000) return 'S+';
  if (score > 5000) return 'S';
  if (score > 2500) return 'A+';
  if (score > 1000) return 'A';
  if (score > 500) return 'B+';
  if (score > 100) return 'B';
  if (score > 50) return 'C+';
  if (score > 10) return 'C';
  return 'D';
}
