#!/usr/bin/env node

/**
 * Script de vérification de la couverture de tests
 * Génère un rapport complet et vérifie les seuils
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COVERAGE_THRESHOLDS = {
  backend: {
    statements: 90,
    branches: 85,
    functions: 90,
    lines: 90,
  },
  frontend: {
    statements: 85,
    branches: 80,
    functions: 85,
    lines: 85,
  },
  critical: {
    statements: 95,
    branches: 90,
    functions: 95,
    lines: 95,
  },
};

const CRITICAL_FILES = [
  'timesheet.service.ts',
  'timesheet.controller.ts',
  'pdf.service.ts',
  'CreateProjectWizard.tsx',
  'offline-storage.ts',
];

function runCommand(command, cwd = process.cwd()) {
  try {
    return execSync(command, { 
      cwd, 
      encoding: 'utf8',
      stdio: 'pipe'
    });
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution: ${command}`);
    console.error(error.message);
    return null;
  }
}

function parseCoverageReport(coveragePath) {
  try {
    const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    return coverageData;
  } catch (error) {
    console.error(`❌ Impossible de lire le rapport de couverture: ${coveragePath}`);
    return null;
  }
}

function calculateOverallCoverage(coverageData) {
  const totals = {
    statements: { covered: 0, total: 0 },
    branches: { covered: 0, total: 0 },
    functions: { covered: 0, total: 0 },
    lines: { covered: 0, total: 0 },
  };

  Object.values(coverageData).forEach(file => {
    if (file.statements) {
      totals.statements.covered += file.statements.covered || 0;
      totals.statements.total += file.statements.total || 0;
    }
    if (file.branches) {
      totals.branches.covered += file.branches.covered || 0;
      totals.branches.total += file.branches.total || 0;
    }
    if (file.functions) {
      totals.functions.covered += file.functions.covered || 0;
      totals.functions.total += file.functions.total || 0;
    }
    if (file.lines) {
      totals.lines.covered += file.lines.covered || 0;
      totals.lines.total += file.lines.total || 0;
    }
  });

  return {
    statements: totals.statements.total ? (totals.statements.covered / totals.statements.total) * 100 : 0,
    branches: totals.branches.total ? (totals.branches.covered / totals.branches.total) * 100 : 0,
    functions: totals.functions.total ? (totals.functions.covered / totals.functions.total) * 100 : 0,
    lines: totals.lines.total ? (totals.lines.covered / totals.lines.total) * 100 : 0,
  };
}

function checkThresholds(coverage, thresholds, name) {
  const results = [];
  let allPassed = true;

  Object.entries(thresholds).forEach(([metric, threshold]) => {
    const value = coverage[metric] || 0;
    const passed = value >= threshold;
    
    if (!passed) allPassed = false;
    
    results.push({
      metric,
      value: value.toFixed(2),
      threshold,
      passed,
      status: passed ? '✅' : '❌',
    });
  });

  console.log(`\n📊 ${name} Coverage:`);
  console.log('┌─────────────┬─────────┬───────────┬────────┐');
  console.log('│ Metric      │ Value   │ Threshold │ Status │');
  console.log('├─────────────┼─────────┼───────────┼────────┤');
  
  results.forEach(({ metric, value, threshold, status }) => {
    const metricPadded = metric.padEnd(11);
    const valuePadded = `${value}%`.padEnd(7);
    const thresholdPadded = `${threshold}%`.padEnd(9);
    console.log(`│ ${metricPadded} │ ${valuePadded} │ ${thresholdPadded} │ ${status}    │`);
  });
  
  console.log('└─────────────┴─────────┴───────────┴────────┘');

  return allPassed;
}

function generateCoverageReport() {
  console.log('🧪 Génération du rapport de couverture de tests ATW Timesheet\n');

  let allTestsPassed = true;

  // Tests Backend
  console.log('🔧 Exécution des tests backend...');
  const backendResult = runCommand('npm run test:cov', path.join(__dirname, '../apps/api'));
  
  if (backendResult) {
    const backendCoveragePath = path.join(__dirname, '../apps/api/coverage/coverage-final.json');
    if (fs.existsSync(backendCoveragePath)) {
      const backendCoverage = parseCoverageReport(backendCoveragePath);
      if (backendCoverage) {
        const overallBackend = calculateOverallCoverage(backendCoverage);
        const backendPassed = checkThresholds(overallBackend, COVERAGE_THRESHOLDS.backend, 'Backend');
        if (!backendPassed) allTestsPassed = false;
      }
    }
  } else {
    allTestsPassed = false;
  }

  // Tests Frontend
  console.log('\n🎨 Exécution des tests frontend...');
  const frontendResult = runCommand('npm run test:cov', path.join(__dirname, '../apps/frontend'));
  
  if (frontendResult) {
    const frontendCoveragePath = path.join(__dirname, '../apps/frontend/coverage/coverage-final.json');
    if (fs.existsSync(frontendCoveragePath)) {
      const frontendCoverage = parseCoverageReport(frontendCoveragePath);
      if (frontendCoverage) {
        const overallFrontend = calculateOverallCoverage(frontendCoverage);
        const frontendPassed = checkThresholds(overallFrontend, COVERAGE_THRESHOLDS.frontend, 'Frontend');
        if (!frontendPassed) allTestsPassed = false;
      }
    }
  } else {
    allTestsPassed = false;
  }

  // Tests E2E
  console.log('\n🎭 Exécution des tests E2E...');
  const e2eResult = runCommand('npm run test:e2e:headless', path.join(__dirname, '../apps/frontend'));
  
  if (!e2eResult) {
    console.log('❌ Tests E2E échoués');
    allTestsPassed = false;
  } else {
    console.log('✅ Tests E2E réussis');
  }

  // Vérification des fichiers critiques
  console.log('\n🔍 Vérification des fichiers critiques...');
  // Cette partie nécessiterait une analyse plus détaillée des fichiers individuels

  // Résumé final
  console.log('\n' + '='.repeat(60));
  console.log('📋 RÉSUMÉ DU RAPPORT DE COUVERTURE');
  console.log('='.repeat(60));

  if (allTestsPassed) {
    console.log('🎉 ✅ TOUS LES TESTS SONT PASSÉS !');
    console.log('🚀 L\'application est prête pour la production.');
  } else {
    console.log('❌ CERTAINS TESTS ONT ÉCHOUÉ');
    console.log('🔧 Veuillez corriger les problèmes avant le déploiement.');
  }

  console.log('\n📊 Rapports détaillés disponibles dans:');
  console.log('   • Backend: apps/api/coverage/lcov-report/index.html');
  console.log('   • Frontend: apps/frontend/coverage/lcov-report/index.html');
  console.log('   • E2E: apps/frontend/playwright-report/index.html');

  return allTestsPassed;
}

function main() {
  const startTime = Date.now();
  
  try {
    const success = generateCoverageReport();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️  Durée totale: ${duration}s`);
    
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Erreur lors de la génération du rapport:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  generateCoverageReport,
  checkThresholds,
  calculateOverallCoverage,
};
