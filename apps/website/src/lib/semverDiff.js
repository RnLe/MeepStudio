// Pure utility.  No external deps.
export function semverDiff(prev, curr) {
    const [A, B, C] = prev.split('.').map(Number);
    const [a, b, c] = curr.split('.').map(Number);
    if (a > A) return 'major';
    if (b > B) return 'minor';
    if (c > C) return 'patch';
    return 'patch';
}