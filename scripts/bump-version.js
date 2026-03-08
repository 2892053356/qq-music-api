const fs = require('fs');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const [major, minor, patch] = pkg.version.split('.').map(Number);
const newPatch = patch + 1;
const newVersion = `${major}.${minor}.${newPatch}`;

pkg.version = newVersion;
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');

const versionWithTag = 'v' + newVersion;
console.log(versionWithTag);

// 输出到 GitHub Actions 的 output
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `new_version=${versionWithTag}\n`);
}
console.log(`New version: ${versionWithTag}`);
