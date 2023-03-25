# add your save-note function here

import boto3
import json

dynamodb_resource = boto3.resource("dynamodb")
table = dynamodb_resource.Table("lotion-30132370")


def lambda_handler(event, context):
    body = json.loads(event["body"])
    print(body)
    try:
        table.put_item(Item=body)
        return {
            "statusCode": 201,
            "body": "success"

        }
    except Exception as e:
        print(f"Exception: {e}")
        print(f"body:  {body}")
        return {
            "statusCode": 500,
            "body": json.dumps({
                "message": str(e)
            })

        }
