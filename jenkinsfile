pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKER_IMAGE = 'johnberb/nodejs-fileshare'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Build and Test') {
            agent {
                docker {
                    image 'node:16-bullseye' // Debian-based image has git pre-installed
                    args '--user root'
                    reuseNode true
                }
            }
            steps {
                sh '''
                echo "Git version: $(git --version)"
                npm install
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    docker.build("${DOCKER_IMAGE}:${IMAGE_TAG}")
                }
            }
        }

        stage('Login to DockerHub') {
            steps {
                script {
                    // Manual login with credentials
                    sh """
                    docker login -u ${DOCKERHUB_CREDENTIALS_USR} -p ${DOCKERHUB_CREDENTIALS_PSW}
                    """
                }
            }
        }

        stage('Push to DockerHub') {
            steps {
                script {
                    sh "docker push ${DOCKER_IMAGE}:${IMAGE_TAG}"
                    
                    // Optional: also push as latest
                    sh """
                    docker tag ${DOCKER_IMAGE}:${IMAGE_TAG} ${DOCKER_IMAGE}:latest
                    docker push ${DOCKER_IMAGE}:latest
                    """
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout' // Clean up
        }
    }
}
