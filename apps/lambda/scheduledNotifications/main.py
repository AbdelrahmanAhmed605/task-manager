import boto3
import os
import requests
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone

# Load environment variables from .env file into system environment
load_dotenv()

def lambda_handler(event, context):
    # Initialize DynamoDB resource and SES client
    dynamodb = boto3.resource('dynamodb')
    ses_client = boto3.client('ses')
    dynamo_table = dynamodb.Table('TaskManagement')

    # Get the current UTC datetime as timezone-aware
    now = datetime.now(timezone.utc)

    # Calculate tomorrow's date
    tomorrow = now + timedelta(days=1)

    # Format date as YYYY-MM-DD strings
    tomorrow_short = tomorrow.strftime('%Y-%m-%d')
    
    print("tomorrow_short:", tomorrow_short)

    try:
        # Query for tasks due the next day with NotificationSent = False, and Status not COMPLETED
        response = dynamo_table.query(
            IndexName='TaskDueNotificationIndex',
            KeyConditionExpression='#dueDateShort = :due_date_short',
            FilterExpression='#notificationSent = :sent and #status <> :status_completed',
            ExpressionAttributeNames={
                '#dueDateShort': 'DueDateShort',
                '#notificationSent': 'NotificationSent',
                '#status': 'Status'
            },
            ExpressionAttributeValues={
                ':due_date_short': tomorrow_short,
                ':sent': False,
                ':status_completed': 'COMPLETED'
            }
        )
        
        print("After Query Response:", response)

        # Process tasks and send notifications
        for task in response['Items']:
            task_id = task['SK']
            user_id = task['PK']
            
            print(f"Processing task {task_id} for user {user_id}")
            
            # Query DynamoDB for user details
            user_item = get_user_details(dynamo_table, user_id)
            print(f"User details for {user_id}: {user_item}")
            
            if user_item:
                # Check NotificationPreferences of user
                notification_preferences = user_item.get('NotificationPreferences', {})
                email_enabled = notification_preferences.get('email', False)
                
                if email_enabled:
                    user_email = user_item.get('Email', None)
                    if user_email:
                        task_title = task['Task']
                        send_email_notification(ses_client, task_title, user_email)

                # Create a notification entry in DynamoDB
                notification_api_url = os.getenv('NOTIFICATION_MICROSERVICE_API_URL')
                if not notification_api_url:
                    raise ValueError('NOTIFICATION_MICROSERVICE_API_URL environment variable is not set.')
                
                create_notification(notification_api_url, user_id, task_id)

                task_api_url = os.getenv('TASK_MICROSERVICE_API_URL')
                if not task_api_url:
                    raise ValueError('TASK_MICROSERVICE_API_URL environment variable is not set.')
                
                update_task_notification(task_api_url, task_id, user_id)
    
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        # Handle the error as per your application's requirements
        return {
            'statusCode': 500,
            'body': 'Error processing notifications!'
        }

    return {
        'statusCode': 200,
        'body': 'Notifications processed successfully!'
    }

def get_user_details(dynamo_table, user_id):
    """
    Query DynamoDB for user details.
    """
    print(f"Querying for user details: {user_id}")
    user_response = dynamo_table.get_item(
        Key={
            'PK': user_id,
            'SK': user_id
        }
    )
    return user_response.get('Item') if 'Item' in user_response else None

def send_email_notification(ses_client, task_title, user_email):
    """
    Send email notification using SES.
    """
    print(f"Sending email notification to {user_email} for task {task_title}")
    email_subject = "Reminder: Task Due Tomorrow"
    email_body = f"""
    Hello,

    This is a friendly reminder that your task '{task_title}' is due tomorrow. Please take necessary actions.

    Best regards,
    Your Task Management System
    """
    
    try:
        response = ses_client.send_email(
            Source='abed.a01@hotmail.com',
            Destination={
                'ToAddresses': [user_email]
            },
            Message={
                'Subject': {'Data': email_subject},
                'Body': {'Text': {'Data': email_body}}
            }
        )
        print("Email sent using SES: ", response)
    
    except Exception as e:
        print(f"Failed to send email: {e}")

def create_notification(notification_api_url, user_id, task_id):
    """
    Create a notification entry in the notification microservice.
    """
    print(f"Creating notification for user {user_id} and task {task_id}")
    payload = {
        'userId': user_id,
        'taskId': task_id,
    }
    
    try:
        response = requests.post(notification_api_url, json=payload)
        response.raise_for_status()  # This will raise an HTTPError for bad responses (4xx and 5xx)
    except requests.exceptions.HTTPError as err:
        try:
            # Try to extract the JSON response
            error_response = response.json()
            # Extract and print the error messages
            for error in error_response.get('errors', []):
                print(f"Error key: {error.get('key')}, Error message: {error.get('error')}")
        except ValueError:
            # If the response is not JSON, print the raw text
            print(f"Failed to create notification: HTTP error occurred - {err}")
            print(f"Response content: {response.text}")
    except requests.exceptions.RequestException as err:
        print(f"Failed to create notification: Request failed - {err}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

def update_task_notification(task_api_url, task_id, user_id):
    """
    Update NotificationSent field in task microservice using GraphQL mutation.
    """
    print(f"Updating task {task_id} to set NotificationSent to true")
    mutation = """
    mutation UpdateTaskNotification($userId: String!, $taskId: String!) {
      updateTask(input: { UserId: $userId, TaskId: $taskId, NotificationSent: true }) {
        success
        errors {
          key
          error
        }
      }
    }
    """
    
    graphql_payload = {
        'query': mutation,
        'variables': {
            'userId': user_id,
            'taskId': task_id
        }
    }
    
    headers = {
        'Content-Type': 'application/json',
        'x-lambda-header': os.getenv('LAMBDA_TASKSERVICE_API_KEY')
    }
    
    try:
        response = requests.post(task_api_url, json=graphql_payload, headers=headers)
        response.raise_for_status()
        print("Task update API call successful!")
    
    except requests.exceptions.HTTPError as err:
        print(f"Failed to update task notification: HTTP error occurred - {err}")
    except requests.exceptions.RequestException as err:
        print(f"Failed to update task notification: Request failed - {err}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
