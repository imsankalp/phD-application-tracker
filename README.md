# PhD Application Tracker

This project is a PhD application tracking application that scrapes data from Gmail, manages PhD application data, and stores it in a MongoDB database.

## API Doc

[Go to API documentation](./docs/API.md)

## Application Flow Diagram

[Got to Application Flow] (./docs/FLOW.md)

## Project Structure

```
phd-application-tracker
├── src
│   ├── app.js
│   ├── config
│   │   ├── db.js
│   │   └── credentials.js
│   ├── controllers
│   │   ├── applicationController.js
│   │   └── userController.js
│   ├── models
│   │   ├── Application.js
│   │   └── User.js
│   ├── routes
│   │   ├── api.js
│   │   └── auth.js
│   ├── services
│   │   ├── gmailService.js
│   │   └── scrapingService.js
│   ├── utils
│   │   ├── emailParser.js
│   │   └── dateUtils.js
│   └── middleware
│       ├── auth.js
│       └── errorHandler.js
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## Setup Instructions

1. **Initialize the Project**
   - Run `npm init -y` to create a new Node.js project.

2. **Install Dependencies**
   - Install the necessary dependencies:
     ```
     npm install express mongoose dotenv googleapis
     ```

3. **Set Up MongoDB**
   - Create a MongoDB database and configure the connection in `src/config/db.js`.

4. **Implement Models**
   - Define the data structure by implementing the models in `src/models`.

5. **Create Controllers**
   - Handle business logic by creating controllers in `src/controllers`.

6. **Set Up Routes**
   - Define API endpoints by setting up routes in `src/routes`.

7. **Implement Services**
   - Handle external interactions like Gmail scraping by implementing services in `src/services`.

8. **Create Utility Functions**
   - Write utility functions for common tasks in `src/utils`.

9. **Add Middleware**
   - Implement authentication and error handling middleware in `src/middleware`.

10. **Configure Environment Variables**
    - Create a `.env` file based on the `.env.example` template for local development.

11. **Write Tests**
    - Ensure functionality and reliability by writing tests.

12. **Document the Project**
    - Keep this README updated for clarity on usage and setup.

## Usage

- Start the server by running `node server.js`.
- Access the API endpoints as defined in the routes.

## Contributing

Feel free to fork the repository and submit pull requests for any improvements or features.
