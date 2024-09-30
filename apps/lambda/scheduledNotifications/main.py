import boto3
import os
import requests
from dotenv import load_dotenv
import logging
import textwrap
from datetime import datetime, timedelta, timezone
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# Load environment variables from .env file into system environment
load_dotenv()

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Lambda function handler to process notifications for tasks due tomorrow.
    """
    dynamodb = boto3.resource('dynamodb')
    dynamo_table = dynamodb.Table('TaskManagement')
    
    # Get current date and set minutes and seconds to 0 for start of hour
    current_time = datetime.now(timezone.utc)
    start_of_hour = current_time.replace(minute=0, second=0, microsecond=0)

    # Convert to ISO 8601 format (AWSDateTime)
    start_of_hour_iso = start_of_hour.strftime('%Y-%m-%dT%H:%M:%S.000Z') 
    
    logger.info(f"Processing tasks for {start_of_hour_iso}")

    try:
       # Query DynamoDB for tasks that have ReminderTime equal to the start of the hour
        response = dynamo_table.query(
            IndexName='TaskReminderIndex',
            KeyConditionExpression='#reminderTime = :start_of_hour',
            FilterExpression='#notificationSent = :sent and #status <> :status_completed',
            ExpressionAttributeNames={
                '#reminderTime': 'ReminderTime',
                '#notificationSent': 'NotificationSent',
                '#status': 'Status'
            },
            ExpressionAttributeValues={
                ':start_of_hour': start_of_hour_iso,
                ':sent': False,
                ':status_completed': 'COMPLETED'
            }
        )
        logger.info(f"Query response: {response}")

        for task in response['Items']:
            task_id = task.get('SK')
            user_id = task.get('PK')
            
            logger.info(f"Processing task with ID '{task_id}' for user with ID '{user_id}'")

            try:
                # Query for user details
                user_details = get_user_details(dynamo_table, user_id)
                if not user_details:
                    logger.warning(f"No user details found for user ID '{user_id}'")
                    continue

                logger.info(f"User details for user ID '{user_id}': {user_details}")

                # Send email notification if enabled
                user_email = user_details.get('Email')
                if user_email:
                    send_email_notification(task.get('Title'), user_email)
            
                # Create a notification entry into the db
                notification_api_url = os.getenv('NOTIFICATION_MICROSERVICE_API_URL')
                if not notification_api_url:
                    logger.error('Environment variable NOTIFICATION_MICROSERVICE_API_URL is not set.')
                    continue
                create_notification(notification_api_url, user_id, task_id)

                # Update task's NotificationSent status
                task_api_url = os.getenv('TASK_MICROSERVICE_API_URL')
                if not task_api_url:
                    logger.error('Environment variable TASK_MICROSERVICE_API_URL is not set.')
                    continue
                update_task(task_api_url, task_id, user_id)
            
            except Exception as inner_e:
                logger.error(f"Error processing task with ID '{task_id}' for user with ID '{user_id}': {inner_e}", exc_info=True)

    except Exception as e:
        logger.error(f"An unexpected error occurred while processing tasks: {e}", exc_info=True)
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
    try:
        logger.info(f"Querying for user details with user ID '{user_id}'")
        user_response = dynamo_table.get_item(
            Key={
                'PK': user_id,
                'SK': user_id
            }
        )
        return user_response.get('Item')
    except Exception as e:
        logger.error(f"Error querying user details with user ID '{user_id}': {e}", exc_info=True)
        return None

def send_email_notification(task_title, user_email):
    """
    Send email notification using Gmail SMTP.
    """
    gmail_user = os.getenv('GMAIL_USER')
    gmail_password = os.getenv('GMAIL_PASSWORD')

    if not gmail_user or not gmail_password:
        logger.error('Environment variable GMAIL_USER or GMAIL_PASSWORD is not set.')
        return

    try:
        logger.info(f"Sending email notification to '{user_email}' for task '{task_title}'")
        email_subject = "Friendly Reminder: Task Due Tomorrow"
        email_body = textwrap.dedent(f"""
        Hi there,

        Just a quick reminder that your task '{task_title}' is due tomorrow.
        We wanted to make sure you're aware so you can plan ahead.

        Best regards,
        Your Task Management Team
        """)

        message = MIMEMultipart()
        message['From'] = gmail_user
        message['To'] = user_email
        message['Subject'] = email_subject
        message.attach(MIMEText(email_body, 'plain'))

        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()  # Secure the connection
            server.login(gmail_user, gmail_password)
            server.send_message(message)
            logger.info(f"Email successfully sent to '{user_email}'")
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error occurred while sending email to '{user_email}': {e}", exc_info=True)
    except Exception as e:
        logger.error(f"Failed to send email to '{user_email}': {e}", exc_info=True)

def create_notification(notification_api_url, user_id, task_id):
    """
    Create a notification entry in the notification microservice.
    """
    if not notification_api_url:
        logger.error('Environment variable NOTIFICATION_MICROSERVICE_API_URL is not set.')
        return

    try:
        logger.info(f"Creating notification for user ID '{user_id}' and task ID '{task_id}'")
        payload = {
            'userId': user_id,
            'taskId': task_id,
        }
        response = requests.post(notification_api_url, json=payload)
        response.raise_for_status()
        logger.info("Notification created successfully.")
    except requests.exceptions.HTTPError as err:
        logger.error(f"HTTP error occurred while creating notification for user ID '{user_id}' and task ID '{task_id}': {err}", exc_info=True)
        try:
            error_response = response.json()
            for error in error_response.get('errors', []):
                logger.error(f"Notification API error key: {error.get('key')}, message: {error.get('error')}")
        except ValueError:
            logger.error(f"Notification API response content: {response.text}")
    except requests.exceptions.RequestException as err:
        logger.error(f"Request error occurred while creating notification for user ID '{user_id}' and task ID '{task_id}': {err}", exc_info=True)
    except Exception as e:
        logger.error(f"Unexpected error occurred while creating notification for user ID '{user_id}' and task ID '{task_id}': {e}", exc_info=True)

def update_task(task_api_url, task_id, user_id):
    """
    Update NotificationSent field in task microservice using GraphQL mutation.
    """
    if not task_api_url:
        logger.error('Environment variable TASK_MICROSERVICE_API_URL is not set.')
        return

    try:
        logger.info(f"Updating task with ID '{task_id}' for user with ID {user_id} to set NotificationSent to true")
        mutation = """
        mutation UpdateTaskNotification($PK: String!, $SK: String!) {
          updateTask(PK: $PK, SK: $SK, input: { NotificationSent: true }) {
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
                'PK': user_id,
                'SK': task_id,
            }
        }
        headers = {
            'Content-Type': 'application/json',
            'x-lambda-header': os.getenv('LAMBDA_TASKSERVICE_API_KEY')
        }
        if not headers['x-lambda-header']:
            logger.error('Environment variable LAMBDA_TASKSERVICE_API_KEY is not set.')
            return

        response = requests.post(task_api_url, json=graphql_payload, headers=headers)
        response.raise_for_status()
        logger.info("Task update API call successful!")
    except requests.exceptions.HTTPError as err:
        logger.error(f"HTTP error occurred while updating task with ID '{task_id}': {err}", exc_info=True)
    except requests.exceptions.RequestException as err:
        logger.error(f"Request error occurred while updating task with ID '{task_id}': {err}", exc_info=True)
    except Exception as e:
        logger.error(f"Unexpected error occurred while updating task with ID '{task_id}': {e}", exc_info=True)
