pipeline {
    agent any
    
    environment {
        // Docker Hub credentials (configure in Jenkins)
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_CREDENTIALS_ID = 'dockerhub-credentials'
        
        // Application details
        BACKEND_IMAGE = 'apnaride/backend'
        FRONTEND_IMAGE = 'apnaride/frontend'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        
        // SonarQube (optional)
        SONARQUBE_SERVER = 'SonarQube'
        
        // Use system-installed tools
        PATH = "/usr/local/bin:${env.PATH}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()
                }
            }
        }
        
        stage('Environment Setup') {
            steps {
                script {
                    echo "Setting up environment variables"
                    sh 'cp Back\\ End/.env.example Back\\ End/.env || true'
                    sh 'cp apnaride-frontend/.env.example apnaride-frontend/.env || true'
                }
            }
        }
        
        stage('Backend - Build & Test') {
            steps {
                dir('Back End') {
                    script {
                        echo "Building Backend..."
                        sh 'mvn clean install -DskipTests'
                        
                        echo "Running Backend Tests..."
                        sh 'mvn test'
                        
                        echo "Packaging Backend..."
                        sh 'mvn package -DskipTests'
                    }
                }
            }
            post {
                always {
                    junit '**/target/surefire-reports/*.xml'
                }
            }
        }
        
        stage('Frontend - Build & Test') {
            steps {
                dir('apnaride-frontend') {
                    script {
                        echo "Installing Frontend Dependencies..."
                        sh 'npm ci'
                        
                        echo "Running Frontend Linting..."
                        sh 'npm run lint || true'
                        
                        echo "Building Frontend..."
                        sh 'npm run build'
                    }
                }
            }
        }
        
        stage('Code Quality Analysis') {
            parallel {
                stage('SonarQube - Backend') {
                    steps {
                        dir('Back End') {
                            script {
                                withSonarQubeEnv('SonarQube') {
                                    sh 'mvn sonar:sonar -Dsonar.projectKey=apnaride-backend || true'
                                }
                            }
                        }
                    }
                }
                stage('SonarQube - Frontend') {
                    steps {
                        dir('apnaride-frontend') {
                            script {
                                withSonarQubeEnv('SonarQube') {
                                    sh 'npm run sonar || true'
                                }
                            }
                        }
                    }
                }
            }
        }
        
        stage('Build Docker Images') {
            parallel {
                stage('Build Backend Image') {
                    steps {
                        dir('Back End') {
                            script {
                                echo "Building Backend Docker Image..."
                                docker.build("${BACKEND_IMAGE}:${IMAGE_TAG}")
                                docker.build("${BACKEND_IMAGE}:latest")
                            }
                        }
                    }
                }
                stage('Build Frontend Image') {
                    steps {
                        dir('apnaride-frontend') {
                            script {
                                echo "Building Frontend Docker Image..."
                                docker.build("${FRONTEND_IMAGE}:${IMAGE_TAG}")
                                docker.build("${FRONTEND_IMAGE}:latest")
                            }
                        }
                    }
                }
            }
        }
        
        stage('Security Scan') {
            parallel {
                stage('Scan Backend Image') {
                    steps {
                        script {
                            echo "Scanning Backend Image for vulnerabilities..."
                            sh "docker scan ${BACKEND_IMAGE}:${IMAGE_TAG} || true"
                        }
                    }
                }
                stage('Scan Frontend Image') {
                    steps {
                        script {
                            echo "Scanning Frontend Image for vulnerabilities..."
                            sh "docker scan ${FRONTEND_IMAGE}:${IMAGE_TAG} || true"
                        }
                    }
                }
            }
        }
        
        stage('Push to Registry') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                }
            }
            steps {
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", "${DOCKER_CREDENTIALS_ID}") {
                        echo "Pushing Backend Image..."
                        docker.image("${BACKEND_IMAGE}:${IMAGE_TAG}").push()
                        docker.image("${BACKEND_IMAGE}:latest").push()
                        
                        echo "Pushing Frontend Image..."
                        docker.image("${FRONTEND_IMAGE}:${IMAGE_TAG}").push()
                        docker.image("${FRONTEND_IMAGE}:latest").push()
                    }
                }
            }
        }
        
        stage('Deploy to Development') {
            when {
                anyOf {
                    branch 'develop'
                    branch 'dev'
                }
            }
            steps {
                script {
                    echo "Deploying to Development Environment..."
                    sh '''
                        docker-compose -f docker-compose.yml down
                        docker-compose -f docker-compose.yml up -d
                    '''
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'staging'
            }
            steps {
                script {
                    echo "Deploying to Staging Environment..."
                    sh '''
                        docker-compose -f docker-compose.staging.yml down
                        docker-compose -f docker-compose.staging.yml up -d
                    '''
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                }
            }
            steps {
                input message: 'Deploy to Production?', ok: 'Deploy'
                script {
                    echo "Deploying to Production Environment..."
                    sh '''
                        docker-compose -f docker-compose.prod.yml down
                        docker-compose -f docker-compose.prod.yml up -d
                    '''
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    echo "Performing Health Checks..."
                    sleep(time: 30, unit: 'SECONDS')
                    
                    sh '''
                        curl -f http://localhost:9031/actuator/health || exit 1
                        curl -f http://localhost:80 || exit 1
                    '''
                }
            }
        }
    }
    
    post {
        always {
            echo "Cleaning up workspace..."
            cleanWs()
        }
        success {
            echo "Pipeline executed successfully!"
            emailext(
                subject: "SUCCESS: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: "Good news! The build ${env.BUILD_NUMBER} was successful.",
                to: 'team@apnaride.com'
            )
        }
        failure {
            echo "Pipeline failed!"
            emailext(
                subject: "FAILURE: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: "Build ${env.BUILD_NUMBER} failed. Please check the logs.",
                to: 'team@apnaride.com'
            )
        }
    }
}
