# add your delete-note function here

import boto3


dynamodb_resource = boto3.resource("dynamodb")
table = dynamodb_resource.Table("lotion-30132370")


def lambda_handler(event, context):
    noteID = event['queryStringParameters']['id']
    email = event['queryStringParameters']['email']
    try:
        table.delete_item(
            Key={
                "email": email,
                "id": noteID
            }
        )
        return {
            "statusCode": 200,
            "body": "success"
        }
    except Exception as exp:
        print(f"Exception: {exp}")
        return {
            "statusCode": 500,
            "body": str(exp)
        }
