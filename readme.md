This app uses a database, this can be hosted locally using env variables for local development

Deployment Strategy:

1. Login to docker in aws using this command:
   aws ecr get-login-password --region us-east-1 --profile personal | docker login --username AWS --password-stdin <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

2. Build applications:
   docker build -t frontend-repo ./AssignmentFrontend
   docker build -t backend-repo ./AssignmentAPI

3. Tag applications:
   docker tag frontend-repo:latest <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/frontend-repo:latest
   docker tag backend-repo:latest <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/backend-repo:latest

4. Push images:
   docker push <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/frontend-repo:latest
   docker push <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/backend-repo:latest
