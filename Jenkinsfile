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
        // Define flags to be used across stages
        SHOULD_BUILD_BACKEND = false
        SHOULD_BUILD_FRONTEND = false
    }

    stages {
        stage('Detect Changes') {
            steps {
                script {
                    // Check if backend files changed OR if manual param is true
                    if (params.FORCE_BACKEND || currentBuild.changeSets.any { cs -> cs.items.any { it.paths.any { p -> p.path.startsWith('backend/') } } }) {
                        env.SHOULD_BUILD_BACKEND = "true"
                    }
                    // Check if frontend files changed OR if manual param is true
                    if (params.FORCE_FRONTEND || currentBuild.changeSets.any { cs -> cs.items.any { it.paths.any { p -> p.path.startsWith('frontend/') } } }) {
                        env.SHOULD_BUILD_FRONTEND = "true"
                    }
                }
            }
        }

        stage('Build Backend Image') {
            when { expression { env.SHOULD_BUILD_BACKEND == "true" } }
            steps {
                dir('backend') {
                    sh "docker build -t budget-backend ."
                    sh "docker tag budget-backend zeli8888/budget-backend:latest"
                }
            }
        }

        stage('Push Backend Images') {
            when { expression { env.SHOULD_BUILD_BACKEND == "true" } }
            steps {
                sh "docker push zeli8888/budget-backend:latest"
            }
        }

        stage('Deploy Backend') {
            when { expression { env.SHOULD_BUILD_BACKEND == "true" } }
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
            when { expression { env.SHOULD_BUILD_FRONTEND == "true" } }
            steps {
                dir('frontend') {
                    script {
                        // Note: changed ${WORKSPACE} to ${WORKSPACE}/frontend to keep the container focused
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
            when { expression { env.SHOULD_BUILD_FRONTEND == "true" } }
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