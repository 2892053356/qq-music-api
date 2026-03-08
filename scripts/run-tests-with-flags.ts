#!/usr/bin/env ts-node
/**
 * 运行测试并生成带 flags 的覆盖率报告
 * 
 * 用法:
 * - 运行所有测试：npm run test:flags
 * - 只运行单元测试：npm run test:flags:unit
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.resolve(__dirname, '..');
const COVERAGE_DIR = path.join(ROOT_DIR, 'coverage');

// 确保覆盖率目录存在
if (!fs.existsSync(COVERAGE_DIR)) {
  fs.mkdirSync(COVERAGE_DIR, { recursive: true });
}

function runCommand(command: string, env: Record<string, string> = {}) {
  try {
    execSync(command, {
      stdio: 'inherit',
      env: { ...process.env, ...env },
      cwd: ROOT_DIR
    });
  } catch (error) {
    console.error(`命令执行失败：${command}`);
    throw error;
  }
}

function runUnitTests() {
  console.log('\n🧪 运行单元测试...\n');
  
  // 运行单元测试
  runCommand('npx jest --coverage --testPathPattern=tests/unit', {
    JEST_JUNIT_OUTPUT_NAME: 'unit-test-results.xml',
    COVERAGE_FILE: 'coverage/unit-coverage.json'
  });
  
  // 移动覆盖率文件
  const coverageFile = path.join(COVERAGE_DIR, 'coverage-final.json');
  if (fs.existsSync(coverageFile)) {
    const unitCoverageFile = path.join(COVERAGE_DIR, 'unit-coverage-final.json');
    fs.copyFileSync(coverageFile, unitCoverageFile);
    console.log(`✅ 单元测试覆盖率已保存到：${unitCoverageFile}`);
  }
}

function runAllTests() {
  console.log('\n🧪 运行所有测试...\n');
  
  // 运行所有测试
  runCommand('npx jest --coverage', {
    JEST_JUNIT_OUTPUT_NAME: 'test-results.xml',
    COVERAGE_FILE: 'coverage/all-coverage.json'
  });
  
  // 移动覆盖率文件
  const coverageFile = path.join(COVERAGE_DIR, 'coverage-final.json');
  if (fs.existsSync(coverageFile)) {
    const allCoverageFile = path.join(COVERAGE_DIR, 'all-coverage-final.json');
    fs.copyFileSync(coverageFile, allCoverageFile);
    console.log(`✅ 所有测试覆盖率已保存到：${allCoverageFile}`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'all';
  
  console.log('🚀 开始运行测试...\n');
  
  try {
    if (testType === 'unit') {
      runUnitTests();
    } else if (testType === 'all') {
      runAllTests();
    } else {
      console.error(`❌ 未知的测试类型：${testType}`);
      console.error('可用选项：unit, all');
      process.exit(1);
    }
    
    console.log('\n✅ 测试完成！\n');
  } catch (error) {
    console.error('\n❌ 测试失败！\n');
    process.exit(1);
  }
}

main();
