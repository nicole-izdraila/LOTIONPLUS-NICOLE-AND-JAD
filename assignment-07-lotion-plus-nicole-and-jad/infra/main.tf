provider "aws" {
  region = "ca-central-1"
}


terraform {
  required_providers {
    aws = {
      version = ">= 4.0.0"
      source  = "hashicorp/aws"
    }
  }
}

locals {
  save_function_name   = "save-note-30147366"
  get_funtion_name     = "get-notes-30147366"
  delete_function_name = "delete-note-30147366"
  handler_name         = "main.lambda_handler"
  artifact_name        = "artifact.zip"
}

resource "aws_iam_role" "lambda" {
  name               = "iam-for-lambda2"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_policy" "logs" {
  name        = "lambda-logging2"
  description = "IAM policy for logging from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "dynamodb:PutItem",
        "dynamodb:Query",
        "dynamodb:DeleteItem"
      ],
      "Resource": ["arn:aws:logs:*:*:*", "${aws_dynamodb_table.notes.arn}"],
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.logs.arn
}

data "archive_file" "delete_lambda" {
  type        = "zip"
  source_file = "../functions/delete-note/main.py"
  output_path = "../functions/delete-note/artifact.zip"
}

data "archive_file" "save_lambda" {
  type        = "zip"
  source_file = "../functions/save-note/main.py"
  output_path = "../functions/save-note/artifact.zip"
}

data "archive_file" "get_lambda" {
  type        = "zip"
  source_file = "../functions/get-notes/main.py"
  output_path = "../functions/get-notes/artifact.zip"
}

resource "aws_lambda_function" "get" {
  role             = aws_iam_role.lambda.arn
  function_name    = local.get_funtion_name
  handler          = local.handler_name
  filename         = "../functions/get-notes/${local.artifact_name}"
  source_code_hash = data.archive_file.get_lambda.output_base64sha256
  runtime          = "python3.9"
}

resource "aws_lambda_function" "save" {
  role             = aws_iam_role.lambda.arn
  function_name    = local.save_function_name
  handler          = local.handler_name
  filename         = "../functions/save-note/${local.artifact_name}"
  source_code_hash = data.archive_file.save_lambda.output_base64sha256
  runtime          = "python3.9"
}

resource "aws_lambda_function" "delete" {
  role             = aws_iam_role.lambda.arn
  function_name    = local.delete_function_name
  handler          = local.handler_name
  filename         = "../functions/delete-note/${local.artifact_name}"
  source_code_hash = data.archive_file.delete_lambda.output_base64sha256
  runtime          = "python3.9"
}

resource "aws_lambda_function_url" "get" {
  function_name      = aws_lambda_function.get.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["GET"]
    allow_headers     = ["*"]
    expose_headers    = ["keep-alive", "date"]
  }
}

resource "aws_lambda_function_url" "save" {
  function_name      = aws_lambda_function.save.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["POST", "PUT"]
    allow_headers     = ["*"]
    expose_headers    = ["keep-alive", "date"]
  }
}

resource "aws_lambda_function_url" "delete" {
  function_name      = aws_lambda_function.delete.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["DELETE"]
    allow_headers     = ["*"]
    expose_headers    = ["keep-alive", "date"]
  }
}

output "delete_lambda_url" {
  value = aws_lambda_function_url.delete.function_url
}

output "save_lambda_url" {
  value = aws_lambda_function_url.save.function_url
}

output "get_lambda_url" {
  value = aws_lambda_function_url.get.function_url
}

resource "aws_dynamodb_table" "notes" {
  name         = "lotion-30132370"
  billing_mode = "PROVISIONED"

  # up to 8KB read per second (eventually consistent)
  read_capacity = 1

  # up to 1KB per second
  write_capacity = 1

  # we only need a student id to find an item in the table; therefore, we 
  # don't need a sort key here
  hash_key  = "email"
  range_key = "id"


  # the hash_key data type is string
  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }
}

