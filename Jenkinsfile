pipeline {
    agent {
        docker {
            image 'node:16-alpine'
            args '-u root' // Run as root to avoid permission issues
            reuseNode true
        }
    }

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKER_IMAGE = 'johnberb/nodejs-fileshare'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        // Set npm to use workspace directory
        npm_config_cache = "${WORKSPACE}/.npm"
        npm_config_prefix = "${WORKSPACE}/.npm"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', 
                url: 'https://github.com/johnberb/Translation-main.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                # Set npm to use workspace for cache and global installs
                npm config set cache "${WORKSPACE}/.npm"
                npm config set prefix "${WORKSPACE}/.npm"
                npm install
                '''
            }
        }

        //stage('Run Tests') {
            //steps {
                //sh 'npm test'
            //}
        //}

        stage('Build Docker Image') {
            agent any // Switch back to main agent for Docker operations
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
