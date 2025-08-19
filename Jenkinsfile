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

        stage('Docker Operations') {
            steps {
                script {
                    docker.build("${DOCKER_IMAGE}:${IMAGE_TAG}").push()
                }
            }
        }
    }
}
