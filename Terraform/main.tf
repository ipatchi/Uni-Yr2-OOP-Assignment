provider "aws" {
    region = "us-east-1"
    profile = "personal"
}

#Networking
data "aws_vpc" "default" {
    default = true
}

#Security Group
resource "aws_security_group" "app_sg" {
    name = "app-sg"
    vpc_id = data.aws_vpc.default.id

    ingress {
        from_port = 80
        to_port = 80
        protocol = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
    }

    ingress {
        from_port = 3000
        to_port = 3000
        protocol = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
    }

    egress {
        from_port = 0
        to_port = 0
        protocol = "-1"
        cidr_blocks = ["0.0.0.0/0"]
    }
}

resource "aws_security_group" "db_sg" {
    name = "db-sg"
    vpc_id = data.aws_vpc.default.id

    ingress {
        from_port = 3306
        to_port = 3306
        protocol = "tcp"
        security_groups = [aws_security_group.app_sg.id]
    }
}

#IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "ecsTaskExecutionRole"
 
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "ecs_ssm_permissions" {
  name = "ecs_ssm_permissions"
  role = aws_iam_role.ecs_task_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameters",
          "ssm:GetParameter"
        ]
        # Only allow access to parameters starting with /myapp/
        Resource = "arn:aws:ssm:us-east-1:*:parameter/myapp/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

#Secrets Manager
resource "aws_ssm_parameter" "db_password" {
    name = "/myapp/prod/db_password"
    type = "SecureString"
    value = var.db_password
}
resource "aws_ssm_parameter" "jwt_secret" {
    name = "/myapp/prod/db_jwt_secret"
    type = "String"
    value = var.jwt_secret
}
resource "aws_ssm_parameter" "pepper" {
    name = "/myapp/prod/pepper"
    type = "String"
    value = var.pepper
}

resource "aws_ssm_parameter" "admin_default_email" {
    name = "/myapp/prod/admin_default_email"
    type = "String"
    value = var.admin_default_email
}

resource "aws_ssm_parameter" "admin_default_password" {
    name = "/myapp/prod/admin_default_password"
    type = "String"
    value = var.admin_default_password
}

#RDS Database
resource "aws_db_instance" "db_instance" {
    identifier = "myapp-db"
    allocated_storage = 20
    engine = "mysql"
    engine_version = "8.0"
    instance_class = "db.t3.micro"
    db_name = "myappdb"
    username = "admin"
    password = aws_ssm_parameter.db_password.value
    vpc_security_group_ids = [aws_security_group.db_sg.id]
    skip_final_snapshot = true
}

#Cloudwatch Group
resource "aws_cloudwatch_log_group" "ecs_log_group" {
  name              = "/ecs/app"
  retention_in_days = 7  # Optional: Deletes logs after 7 days to save money
}

#ECR Repositories
resource "aws_ecr_repository" "backend" {
    name = "backend-repo"
    image_tag_mutability = "MUTABLE"
    force_delete = true
}

resource "aws_ecr_repository" "frontend" {
    name = "frontend-repo"
    image_tag_mutability = "MUTABLE"
    force_delete = true
}

#ECS Fargate
resource "aws_ecs_cluster" "app_cluster" {
    name = "app-cluster"
}

resource "aws_ecs_task_definition" "app" {
    family = "app-task"
    network_mode = "awsvpc"
    requires_compatibilities = ["FARGATE"]
    cpu = "256"
    memory = "512"
    execution_role_arn = aws_iam_role.ecs_task_execution_role.arn

    container_definitions = jsonencode([
        {
            name = "backend"
            image = "${aws_ecr_repository.backend.repository_url}:latest"
            essential = true
            portMappings = [{ containerPort = 8900 }]

            environment = [
                {name="NODE_ENV", value="development"},
                {name="DB_HOST", value=aws_db_instance.db_instance.address},
                {name="DB_PORT", value="3306"},
                {name="DB_USERNAME", value="admin"},
                {name="DB_DATABASE", value="myappdb"},
                {name="SERVER_PORT", value="8900"},
                {name="DB_SYNC", value="true"} 
            ]

            secrets = [
                {name="DB_PASSWORD", valueFrom=aws_ssm_parameter.db_password.arn},
                {name="JWT_SECRET", valueFrom=aws_ssm_parameter.jwt_secret.arn},
                {name="PEPPER", valueFrom=aws_ssm_parameter.pepper.arn},
                {name="ADMIN_DEFAULT_EMAIL", valueFrom=aws_ssm_parameter.admin_default_email.arn},
                {name="ADMIN_DEFAULT_PASSWORD", valueFrom=aws_ssm_parameter.admin_default_password.arn}
            ]

            logConfiguration = {
                logDriver = "awslogs"
                options = {
                    awslogs-group = "/ecs/app"
                    awslogs-region = "us-east-1"
                    awslogs-stream-prefix = "ecs"
                }
            }

        },
        {
           name = "frontend"
           image = "${aws_ecr_repository.frontend.repository_url}:latest"
           essential = true
           portMappings = [{ containerPort = 3000 }]
            environment = [
                {name="NODE_ENV", value="development"},
                {name="VITE_API_URL", value="http://127.0.0.1:8900"}
            ]
        logConfiguration = {
                logDriver = "awslogs"
                options = {
                    awslogs-group = "/ecs/app"
                    awslogs-region = "us-east-1"
                    awslogs-stream-prefix = "ecs"
                }
            }
        }
    ])

    

}

#Run ECS Service
data "aws_subnets" "default" {
    filter {
        name = "vpc-id"
        values = [data.aws_vpc.default.id]
    }
}
resource "aws_lb" "app_lb" {
    name = "app-lb"
    internal = false
    load_balancer_type = "application"
    security_groups = [aws_security_group.app_sg.id]
    subnets = data.aws_subnets.default.ids
}
resource "aws_lb_target_group" "app_tg" {
    name = "app-tg-v2"
    port = 3000
    protocol = "HTTP"
    target_type = "ip"
    vpc_id = data.aws_vpc.default.id
    health_check {
        path = "/"
        matcher = "200-399"
    }
    lifecycle {
      create_before_destroy = true
    }
}
resource "aws_lb_listener" "frontend-listener" {
    load_balancer_arn = aws_lb.app_lb.arn
    port = 80
    protocol = "HTTP"
    default_action {
        type = "forward"
        target_group_arn = aws_lb_target_group.app_tg.arn
    }
}

resource "aws_ecs_service" "app_service" {
    name = "app-service"
    cluster = aws_ecs_cluster.app_cluster.id
    task_definition = aws_ecs_task_definition.app.arn
    desired_count = 1
    launch_type = "FARGATE"
    network_configuration {
        subnets = data.aws_subnets.default.ids
        security_groups = [aws_security_group.app_sg.id]
        assign_public_ip = true
    }
    load_balancer {
        target_group_arn = aws_lb_target_group.app_tg.arn
        container_name = "frontend"
        container_port = 3000
    }
    depends_on = [aws_lb_listener.frontend-listener]
}

output "app_url" {
    value = aws_lb.app_lb.dns_name
}