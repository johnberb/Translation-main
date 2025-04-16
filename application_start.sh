#!/bin/bash

cd /home/ec2-user/simple-nodejs-app
pm2 delete app.js
pm2 start app.js
