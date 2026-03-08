const fs = require('fs');
const { execSync } = require('child_process');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const [major, minor, patch] = pkg.version.split('.').map(Number);
const newPatch = patch + 1;
const newVersion = `${major}.${minor}.${newPatch}`;

pkg.version = newVersion;
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');

const versionWithTag = 'v' + newVersion;
console.log(versionWithTag);

// 生成 CHANGELOG
console.log('Generating CHANGELOG...');
try {
    execSync('npm run changelog', { stdio: 'inherit' });
    console.log('CHANGELOG generated successfully');
} catch (error) {
    console.error('Failed to generate CHANGELOG:', error.message);
}

// 生成 version.json
console.log('Generating version.json...');
try {
    execSync('node scripts/generate-version.js', { stdio: 'inherit' });
    console.log('version.json generated successfully');
} catch (error) {
    console.error('Failed to generate version.json:', error.message);
}

// 输出到 GitHub Actions 的 output
if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `new_version=${versionWithTag}\n`);
}
console.log(`New version: ${versionWithTag}`);
