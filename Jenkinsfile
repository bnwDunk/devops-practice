pipeline {
  agent any

  options {
    buildDiscarder(logRotator(numToKeepStr: '20'))
    disableConcurrentBuilds()
  }

  parameters {
    booleanParam(name: 'RUN_DOCKER_BUILD', defaultValue: true, description: 'Build Docker images with docker compose.')
    booleanParam(name: 'RUN_SMOKE_TEST', defaultValue: false, description: 'Start the stack and run scripts/smoke-test.ps1.')
  }

  environment {
    APP_VERSION = "${env.BUILD_NUMBER}"
    COMPOSE_PROJECT_NAME = "devops-practice-${env.BUILD_NUMBER}"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      steps {
        script {
          runCommand('npm ci')
        }
      }
    }

    stage('Lint') {
      steps {
        script {
          runCommand('npm run lint')
        }
      }
    }

    stage('Typecheck') {
      steps {
        script {
          runCommand('npm run typecheck')
        }
      }
    }

    stage('Build Apps') {
      steps {
        script {
          runCommand('npm run build')
        }
      }
    }

    stage('Docker Build') {
      when {
        expression { return params.RUN_DOCKER_BUILD }
      }
      steps {
        script {
          runCommand('docker compose build')
        }
      }
    }

    stage('Smoke Test') {
      when {
        expression { return params.RUN_SMOKE_TEST }
      }
      steps {
        script {
          runCommand('docker compose up -d --build')
          runSmokeTest()
        }
      }
      post {
        always {
          script {
            runCommand('docker compose logs --tail=150')
            runCommand('docker compose down -v --remove-orphans')
          }
        }
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'apps/frontend/dist/**, apps/backend/dist/**', allowEmptyArchive: true
    }
    success {
      echo 'Pipeline completed successfully.'
    }
    failure {
      echo 'Pipeline failed. Check the failed stage logs first, then service logs if Docker was started.'
    }
  }
}

void runCommand(String command) {
  if (isUnix()) {
    sh command
  } else {
    powershell command
  }
}

void runSmokeTest() {
  if (isUnix()) {
    sh 'pwsh -File ./scripts/smoke-test.ps1'
  } else {
    powershell './scripts/smoke-test.ps1'
  }
}
