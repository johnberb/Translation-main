pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKER_IMAGE = 'johnberb/nodejs-fileshare'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        npm_config_cache = "${WORKSPACE}/.npm"
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[
                        url: 'https://github.com/johnberb/Translation-main.git'
                    ]],
                    extensions: [[$class: 'CleanBeforeCheckout']]
                ])
            }
        }

        stage('Build and Test in Node Container') {
            agent {
                docker {
                    image 'node:16-alpine'
                    args '--user root -v ${WORKSPACE}/.npm:/root/.npm'
                    reuseNode true
                }
            }
            steps {
                sh '''
                # Install Git in the Alpine container
                apk update && apk add --no-cache git

                echo "Current directory: $(pwd)"
                echo "Node version: $(node --version)"
                echo "NPM version: $(npm --version)"
                echo "Git version: $(git --version)"
                
                # Install dependencies
                npm install --cache ${WORKSPACE}/.npm --prefer-offline
                
                # Run tests
                # npm test
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

        stage('Push to DockerHub') {
            steps {
                script {
                    docker.withRegistry('https://registry.hub.docker.com', 'dockerhub-credentials') {
                        docker.image("${DOCKER_IMAGE}:${IMAGE_TAG}").push()
                    }
                }
            }
        }
    }
}
