pipeline {
    agent any

    parameters {
        booleanParam(name: 'FORCE_BACKEND', defaultValue: false, description: 'Force backend redeploy')
        booleanParam(name: 'FORCE_FRONTEND', defaultValue: false, description: 'Force frontend redeploy')
    }

    environment {
        FIREBASE_CREDENTIALS_FILE = "/var/lib/jenkins/my-project-secrets/firebase-private-key.json"
        APP_ENV = "production"
        DOCKER_IMAGE = "node:20.17.0"
        HOST_TARGET_DIR = "/var/www/zeli8888/budget"
    }

    stages {
        stage('Build Backend Image') {
            when {
                anyOf {
                    expression { params.FORCE_BACKEND }
                    changeset "backend/**"
                }
            }
            steps {
                dir('backend') {
                    sh "docker build -t budget-backend ."
                    sh "docker tag budget-backend zeli8888/budget-backend:latest"
                }
            }
        }

        stage('Push Backend Images') {
            when {
                anyOf {
                    expression { params.FORCE_BACKEND }
                    changeset "backend/**"
                }
            }
            steps {
                sh "docker push zeli8888/budget-backend:latest"
            }
        }

        stage('Deploy Backend') {
            when {
                anyOf {
                    expression { params.FORCE_BACKEND }
                    changeset "backend/**"
                }
            }
            steps {
                dir('backend') {
                    sh '''
                        docker compose -p budget-app -f docker-compose.yml up -d --force-recreate
                        docker image prune -f
                    '''
                }
            }
        }

        stage('Build Frontend') {
            when {
                anyOf {
                    expression { params.FORCE_FRONTEND }
                    changeset "frontend/**"
                }
            }
            steps {
                dir('frontend') {
                    script {
                        sh """
                            docker run --rm \
                            --name budget-frontend \
                            --user \$(id -u):\$(id -g) \
                            -v ${WORKSPACE}/frontend:/app \
                            -w /app \
                            ${DOCKER_IMAGE} \
                            sh -c 'npm ci && npm run build'
                        """
                    }
                }
            }
        }

        stage('Deploy Frontend') {
            when {
                anyOf {
                    expression { params.FORCE_FRONTEND }
                    changeset "frontend/**"
                }
            }
            steps {
                dir('frontend') {
                    script {
                        sh "mkdir -p ${HOST_TARGET_DIR}"
                        sh "cp -rf ${WORKSPACE}/frontend/dist/* ${HOST_TARGET_DIR}/"
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}