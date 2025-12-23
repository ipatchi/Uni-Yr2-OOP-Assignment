#variables.terraform 

variable "jwt_secret" {
    description = "JWT secret for application"
    type        = string
    sensitive = true
}

variable "db_password" {
    description = "Database password for application"
    type        = string
    sensitive = true
}

variable "pepper" {
    description = "Pepper value for hashing"
    type        = string
    sensitive = true
}

variable "admin_default_email" {
    description = "Default admin email"
    type        = string
    sensitive = true
}

variable "admin_default_password" {
    description = "Default admin password"
    type        = string
    sensitive = true
}