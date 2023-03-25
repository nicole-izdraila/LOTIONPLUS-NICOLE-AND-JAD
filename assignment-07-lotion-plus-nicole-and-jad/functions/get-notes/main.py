import boto3
import json
from boto3.dynamodb.conditions import Key

dynamodb_resource = boto3.resource("dynamodb")
table = dynamodb_resource.Table("lotion-30132370")


def lambda_handler(event, context):
    email = event['queryStringParameters']['email']

    try:
        res = table.query(KeyConditionExpression=Key("email").eq(email))
        return {
            "statusCode": 200,
            "body": json.dumps(res["Items"])
        }
    except Exception as exp:
        print(f"Exception: {exp}")
        return {
            "statusCode": 500,
            "body": str(exp)
        }
