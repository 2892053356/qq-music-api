const fs = require('fs');
const { execSync } = require('child_process');

console.log('Bumping version in package.json...');

try {
  // 读取当前版本号
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const oldVersion = pkg.version;
  console.log(`Current version: ${oldVersion}`);

  // 使用 npm version patch 命令，它会自动处理所有 semver 格式（包括 pre-release）
  // --no-git-tag-version: 不创建 git 标签
  // --ignore-scripts: 不执行任何 npm scripts（包括 version 脚本）
  execSync('npm version patch --no-git-tag-version --ignore-scripts', {
    stdio: 'inherit' // 显示所有输出
  });

  // 读取新版本号
  const newPkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const newVersion = newPkg.version;
  console.log(`Version bumped to ${newVersion}`);

  // 生成 CHANGELOG
  console.log('Generating CHANGELOG...');
  execSync('npm run changelog', { stdio: 'inherit' });
  console.log('CHANGELOG generated successfully');

  // 生成 version.json
  console.log('Generating version.json...');
  execSync('node scripts/generate-version.js', { stdio: 'inherit' });
  console.log('version.json generated successfully');

  // 输出到 GitHub Actions 的 output（使用裸版本号，不含 v 前缀）
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `new_version=${newVersion}\n`);
  }
  console.log(`New version: ${newVersion}`);

} catch (error) {
  console.error('Error during version bump:', error.message);
  console.error('Version bump failed. Please check the error messages above.');
  process.exit(1); // 立即退出，防止不一致状态
}
