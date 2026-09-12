# Movie Rating Backend

A simple Node.js Express API for managing movie ratings.

## Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Setup Environment Variables:**
   Create a `.env` file (already created) and set your preferred port.

3. **Run the Server:**
   - Development mode (with nodemon):
     ```bash
     npm run dev
     ```
   - Production mode:
     ```bash
     npm start
     ```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/movies` | Get all movies |
| GET | `/api/movies/:id` | Get a single movie by ID |
| POST | `/api/movies` | Add a new movie |
| PUT | `/api/movies/:id` | Update a movie rating |
| DELETE | `/api/movies/:id` | Delete a movie |

## How to Test

You can test the API using tools like **Postman**, **Insomnia**, or **cURL**.

Example cURL command to get all movies:
```bash
curl http://localhost:5000/api/movies
```
