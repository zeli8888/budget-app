pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = credentials('docker-registry')
        DEPLOY_SERVER = credentials('deploy-server-ssh')
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Test Backend') {
            steps {
                dir('backend') {
                    sh 'go mod download'
                    sh 'go test -v ./...'
                }
            }
        }

        stage('Test Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm test -- --watchAll=false --passWithNoTests'
                }
            }
        }

        stage('Build Backend Image') {
            steps {
                dir('backend') {
                    sh "docker build -t budget-backend:${IMAGE_TAG} ."
                    sh "docker tag budget-backend:${IMAGE_TAG} ${DOCKER_REGISTRY}/budget-backend:${IMAGE_TAG}"
                    sh "docker tag budget-backend:${IMAGE_TAG} ${DOCKER_REGISTRY}/budget-backend:latest"
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                dir('frontend') {
                    sh "docker build -t budget-frontend:${IMAGE_TAG} ."
                    sh "docker tag budget-frontend:${IMAGE_TAG} ${DOCKER_REGISTRY}/budget-frontend:${IMAGE_TAG}"
                    sh "docker tag budget-frontend:${IMAGE_TAG} ${DOCKER_REGISTRY}/budget-frontend:latest"
                }
            }
        }

        stage('Push Images') {
            steps {
                sh "docker push ${DOCKER_REGISTRY}/budget-backend:${IMAGE_TAG}"
                sh "docker push ${DOCKER_REGISTRY}/budget-backend:latest"
                sh "docker push ${DOCKER_REGISTRY}/budget-frontend:${IMAGE_TAG}"
                sh "docker push ${DOCKER_REGISTRY}/budget-frontend:latest"
            }
        }

        stage('Deploy') {
            steps {
                sshagent(['deploy-server-ssh']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_SERVER} << 'EOF'
                        cd /opt/budget-app
                        docker-compose pull
                        docker-compose up -d
                        docker system prune -f
EOF
                    '''
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed!'
        }
    }
}
