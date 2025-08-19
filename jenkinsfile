pipeline {
    agent any

    environment {
        // DockerHub credentials (configure in Jenkins Credentials)
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        // Your DockerHub repository name (e.g., 'yourusername/nodejs-app')
        DOCKER_IMAGE = 'johnberb/nodejs-fileshare'
        // Image tag (using build number)
        IMAGE_TAG = "${env.BUILD_NUMBER}"
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
                sh 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                sh 'npm test'
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
                    docker.withRegistry('https://registry.hub.docker.com', 'dockerhub-credentials') {
                        // The credentials are automatically used by the Docker Pipeline plugin
                    }
                }
            }
        }

        stage('Push to DockerHub') {
            steps {
                script {
                    docker.withRegistry('https://registry.hub.docker.com', 'dockerhub-credentials') {
                        docker.image("${DOCKER_IMAGE}:${IMAGE_TAG}").push()
                        // Optionally push as 'latest' too
                        docker.image("${DOCKER_IMAGE}:${IMAGE_TAG}").push('latest')
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Docker image successfully built and pushed to DockerHub!'
            echo "Image: ${DOCKER_IMAGE}:${IMAGE_TAG}"
        }
        failure {
            echo 'Pipeline failed. Check logs for details.'
        }
    }
}