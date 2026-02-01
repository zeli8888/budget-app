pipeline {
    agent any

    environment {
        FIREBASE_CREDENTIALS_FILE = "/var/lib/jenkins/my-project-secrets/firebase-private-key.json"
        APP_ENV = "production"
    }

    stages {
        stage('Checkout') {
            steps {
                script {
                    checkout scm
                }
            }
        }

        stage('Build Backend Image') {
            steps {
                dir('backend') {
                    sh "docker build -t budget-backend ."
                    sh "docker tag budget-backend zeli8888/budget-backend:latest"
                }
            }
        }

        stage('Push Images') {
            steps {
                sh "docker push zeli8888/budget-backend:latest"
            }
        }

        stage('Deploy') {
            steps {
                    sh '''
                        docker compose -p budget-app -f docker-compose.yml up -d --force-recreate
                        docker image prune -f
                    '''
            }
        }
    }
}
