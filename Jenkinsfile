pipeline {
  agent any

  options {
    buildDiscarder(logRotator(numToKeepStr: '20'))
    disableConcurrentBuilds()
    skipDefaultCheckout(true)
  }

  parameters {
    booleanParam(name: 'RUN_DOCKER_BUILD', defaultValue: true, description: 'Build Docker images with docker compose.')
    booleanParam(name: 'RUN_SMOKE_TEST', defaultValue: false, description: 'Start the stack and run scripts/smoke-test.ps1.')
  }

  environment {
    APP_VERSION = "${env.BUILD_NUMBER}"
    COMPOSE_PROJECT_NAME = "devops-practice-${env.BUILD_NUMBER}"
    COMPOSE_FILES = '-f docker-compose.yml -f docker-compose.ci.yml'
    MYSQL_PORT = '13306'
    PROXY_PORT = '18080'
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
          runCommand("docker compose ${env.COMPOSE_FILES} up -d --build --wait --wait-timeout 180 mysql backend frontend")
          waitForApi()
          runCommand("docker compose ${env.COMPOSE_FILES} exec -T backend wget -qO- http://localhost:3000/api/health")
          runCommand("docker compose ${env.COMPOSE_FILES} exec -T backend wget -qO- http://localhost:3000/api/deployments")
        }
      }
      post {
        always {
          script {
            runCommand("docker compose ${env.COMPOSE_FILES} logs --tail=150")
            runCommand("docker compose ${env.COMPOSE_FILES} down -v --remove-orphans")
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

void waitForApi() {
  if (isUnix()) {
    sh '''
      set -eu
      for attempt in $(seq 1 30); do
        if docker compose ${COMPOSE_FILES} exec -T backend wget -qO- http://localhost:3000/api/health >/tmp/api-health.json; then
          cat /tmp/api-health.json
          exit 0
        fi
        echo "Waiting for backend API health... attempt ${attempt}/30"
        sleep 3
      done
      echo "Backend API did not become healthy in time"
      docker compose ${COMPOSE_FILES} logs --tail=100 backend mysql
      exit 1
    '''
  } else {
    powershell '''
      $ErrorActionPreference = "Stop"
      for ($attempt = 1; $attempt -le 30; $attempt++) {
        docker compose $env:COMPOSE_FILES exec -T backend wget -qO- http://localhost:3000/api/health
        if ($LASTEXITCODE -eq 0) { exit 0 }
        Write-Host "Waiting for backend API health... attempt $attempt/30"
        Start-Sleep -Seconds 3
      }
      docker compose $env:COMPOSE_FILES logs --tail=100 backend mysql
      exit 1
    '''
  }
}
