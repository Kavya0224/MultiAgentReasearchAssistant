express: The web framework. It handles incoming requests (like a receptionist).
dotenv: Loads your secrets (like API keys) from a .env file so they aren't hardcoded in your code.
winston: A professional logger. In production, console.log is too slow and hard to search. Winston allows us to save logs to files or external databases.
morgan: Middleware that automatically logs every incoming HTTP request (who called us, what time, and did it succeed?).
cors: Ensures your backend can talk to your frontend (Cross-Origin Resource Sharing).

/src
  /config
    - index.js
  /middleware
    - logger.js
    - errorHandler.js
  - app.js
  - server.js
.env