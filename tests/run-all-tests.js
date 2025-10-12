/**
 * Comprehensive Test Runner
 * Runs all tests and generates detailed reports
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = {
      api: { passed: 0, failed: 0, total: 0, errors: [] },
      components: { passed: 0, failed: 0, total: 0, errors: [] },
      loading: { passed: 0, failed: 0, total: 0, errors: [] },
      e2e: { passed: 0, failed: 0, total: 0, errors: [] },
      overall: { passed: 0, failed: 0, total: 0 }
    };
    this.startTime = Date.now();
  }

  async runApiTests() {
    console.log('🧪 Running API Tests...');
    try {
      const output = execSync('npm run test:api', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      this.parseJestResults(output, 'api');
      console.log('✅ API Tests completed');
    } catch (error) {
      this.results.api.failed++;
      this.results.api.errors.push(error.message);
      console.log('❌ API Tests failed:', error.message);
    }
  }

  async runComponentTests() {
    console.log('🧪 Running Component Tests...');
    try {
      const output = execSync('npm run test:components', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      this.parseJestResults(output, 'components');
      console.log('✅ Component Tests completed');
    } catch (error) {
      this.results.components.failed++;
      this.results.components.errors.push(error.message);
      console.log('❌ Component Tests failed:', error.message);
    }
  }

  async runLoadingTests() {
    console.log('🧪 Running Loading State Tests...');
    try {
      const output = execSync('npm run test:loading', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      this.parseJestResults(output, 'loading');
      console.log('✅ Loading Tests completed');
    } catch (error) {
      this.results.loading.failed++;
      this.results.loading.errors.push(error.message);
      console.log('❌ Loading Tests failed:', error.message);
    }
  }

  async runE2ETests() {
    console.log('🧪 Running End-to-End Tests...');
    try {
      const output = execSync('npm run test:e2e', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      this.parsePlaywrightResults(output, 'e2e');
      console.log('✅ E2E Tests completed');
    } catch (error) {
      this.results.e2e.failed++;
      this.results.e2e.errors.push(error.message);
      console.log('❌ E2E Tests failed:', error.message);
    }
  }

  parseJestResults(output, category) {
    const lines = output.split('\n');
    let passed = 0;
    let failed = 0;
    let total = 0;

    for (const line of lines) {
      if (line.includes('Tests:')) {
        const match = line.match(/(\d+) passed/);
        if (match) passed = parseInt(match[1]);
        
        const failMatch = line.match(/(\d+) failed/);
        if (failMatch) failed = parseInt(failMatch[1]);
        
        total = passed + failed;
      }
    }

    this.results[category].passed = passed;
    this.results[category].failed = failed;
    this.results[category].total = total;
  }

  parsePlaywrightResults(output, category) {
    const lines = output.split('\n');
    let passed = 0;
    let failed = 0;
    let total = 0;

    for (const line of lines) {
      if (line.includes('passed')) {
        const match = line.match(/(\d+) passed/);
        if (match) passed = parseInt(match[1]);
      }
      if (line.includes('failed')) {
        const match = line.match(/(\d+) failed/);
        if (match) failed = parseInt(match[1]);
      }
    }

    total = passed + failed;
    this.results[category].passed = passed;
    this.results[category].failed = failed;
    this.results[category].total = total;
  }

  calculateOverallResults() {
    let totalPassed = 0;
    let totalFailed = 0;
    let totalTests = 0;

    for (const category of ['api', 'components', 'loading', 'e2e']) {
      totalPassed += this.results[category].passed;
      totalFailed += this.results[category].failed;
      totalTests += this.results[category].total;
    }

    this.results.overall.passed = totalPassed;
    this.results.overall.failed = totalFailed;
    this.results.overall.total = totalTests;
  }

  generateReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    this.calculateOverallResults();

    const report = {
      timestamp: new Date().toISOString(),
      duration: `${(duration / 1000).toFixed(2)}s`,
      summary: this.results.overall,
      categories: this.results,
      recommendations: this.generateRecommendations()
    };

    // Save JSON report
    fs.writeFileSync(
      path.join(__dirname, '../logs/test-report.json'),
      JSON.stringify(report, null, 2)
    );

    // Generate HTML report
    this.generateHTMLReport(report);

    // Generate console summary
    this.printConsoleSummary();

    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.results.loading.failed > 0) {
      recommendations.push({
        type: 'critical',
        message: 'Loading state issues detected. Check for infinite loops in useEffect dependencies.',
        files: ['src/lib/universal-context.js', 'src/app/user/dashboard/page.js']
      });
    }

    if (this.results.api.failed > 0) {
      recommendations.push({
        type: 'high',
        message: 'API endpoint issues detected. Verify API routes and error handling.',
        files: ['src/app/api/**/*.js']
      });
    }

    if (this.results.e2e.failed > 0) {
      recommendations.push({
        type: 'medium',
        message: 'End-to-end test failures. Check page navigation and user interactions.',
        files: ['tests/e2e/**/*.spec.js']
      });
    }

    return recommendations;
  }

  generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Bitnex Global - Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .card { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 5px; flex: 1; }
        .passed { color: green; }
        .failed { color: red; }
        .recommendations { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .critical { color: red; font-weight: bold; }
        .high { color: orange; font-weight: bold; }
        .medium { color: blue; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Bitnex Global - Test Report</h1>
        <p>Generated: ${report.timestamp}</p>
        <p>Duration: ${report.duration}</p>
    </div>

    <div class="summary">
        <div class="card">
            <h3>Overall Results</h3>
            <p class="passed">✅ Passed: ${report.summary.passed}</p>
            <p class="failed">❌ Failed: ${report.summary.failed}</p>
            <p>Total: ${report.summary.total}</p>
        </div>
        <div class="card">
            <h3>API Tests</h3>
            <p class="passed">✅ Passed: ${report.categories.api.passed}</p>
            <p class="failed">❌ Failed: ${report.categories.api.failed}</p>
        </div>
        <div class="card">
            <h3>Component Tests</h3>
            <p class="passed">✅ Passed: ${report.categories.components.passed}</p>
            <p class="failed">❌ Failed: ${report.categories.components.failed}</p>
        </div>
        <div class="card">
            <h3>Loading Tests</h3>
            <p class="passed">✅ Passed: ${report.categories.loading.passed}</p>
            <p class="failed">❌ Failed: ${report.categories.loading.failed}</p>
        </div>
        <div class="card">
            <h3>E2E Tests</h3>
            <p class="passed">✅ Passed: ${report.categories.e2e.passed}</p>
            <p class="failed">❌ Failed: ${report.categories.e2e.failed}</p>
        </div>
    </div>

    <div class="recommendations">
        <h3>🔧 Recommendations</h3>
        ${report.recommendations.map(rec => `
            <div class="${rec.type}">
                <strong>${rec.type.toUpperCase()}:</strong> ${rec.message}
                <br><small>Files: ${rec.files.join(', ')}</small>
            </div>
        `).join('')}
    </div>
</body>
</html>`;

    fs.writeFileSync(
      path.join(__dirname, '../logs/test-report.html'),
      html
    );
  }

  printConsoleSummary() {
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`Overall: ${this.results.overall.passed} passed, ${this.results.overall.failed} failed`);
    console.log(`API: ${this.results.api.passed} passed, ${this.results.api.failed} failed`);
    console.log(`Components: ${this.results.components.passed} passed, ${this.results.components.failed} failed`);
    console.log(`Loading: ${this.results.loading.passed} passed, ${this.results.loading.failed} failed`);
    console.log(`E2E: ${this.results.e2e.passed} passed, ${this.results.e2e.failed} failed`);
    
    if (this.results.overall.failed > 0) {
      console.log('\n❌ Some tests failed. Check the detailed report in logs/test-report.html');
    } else {
      console.log('\n✅ All tests passed!');
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Test Suite...\n');
    
    await this.runApiTests();
    await this.runComponentTests();
    await this.runLoadingTests();
    await this.runE2ETests();
    
    const report = this.generateReport();
    
    console.log('\n📋 Test Report generated:');
    console.log('- JSON: logs/test-report.json');
    console.log('- HTML: logs/test-report.html');
    
    return report;
  }
}

// Run tests if called directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests().catch(console.error);
}

module.exports = TestRunner;
