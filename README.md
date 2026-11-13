# Automatic Timetable Generator

An intelligent web-based timetable generation system designed to simplify academic scheduling for colleges and educational institutions.

## Overview

The Automatic Timetable Generator helps colleges manage academic scheduling efficiently by organizing teachers, subjects, divisions, and classrooms while generating optimized timetables automatically.

## Features

- **Automatic Timetable Generation** – Generate academic timetables automatically.
- **Teacher Management** – Manage teacher information and availability.
- **Subject Management** – Organize subjects for academic scheduling.
- **Division Management** – Manage divisions and their academic requirements.
- **Classroom Management** – Manage classroom and location details.
- **Dashboard** – View timetable-related statistics and information.
- **Authentication** – Secure login and account management.
- **Timetable Management** – View and manage generated timetables.
- **Settings** – Configure timetable generation preferences.

## Tech Stack

### Frontend
- React.js
- Vite
- JavaScript
- HTML5
- CSS3

### Backend
- Node.js
- Express.js

### Database
- MongoDB
- Mongoose

### Authentication
- JSON Web Tokens (JWT)
- Google OAuth (if configured)

## Project Structure

```text
Automatic-Timetable-Generator/
│
├── public/
├── src/
│   ├── api/
│   ├── assets/
│   ├── components/
│   ├── context/
│   ├── pages/
│   └── styles/
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── services/
│
├── package.json
├── README.md
└── .gitignore
```

## Installation and Setup

### Prerequisites

- Node.js
- npm
- MongoDB database
- Git

### 1. Clone the repository

```bash
git clone https://github.com/NaincyShukla/Automatic-Timetable-Generator.git
cd Automatic-Timetable-Generator
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd server
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the `server` directory.

Configure the required environment variables:

- MongoDB connection string
- JWT secret
- Google OAuth credentials (if required)
- Server port

Never upload actual credentials or API secrets to GitHub.

### 5. Start the backend

```bash
cd server
node server.js
```

### 6. Start the frontend

Open another terminal in the project root:

```bash
npm run dev
```

## Environment Variables

Refer to the environment example file for the required configuration.

Actual environment files containing credentials are excluded from version control.

## Future Improvements

- Enhanced timetable optimization
- Improved scheduling constraints
- Timetable export functionality
- Deployment and live demonstration

## Author

**Naincy Shukla**


B.Tech – Computer Engineering


## License

This project is licensed under the MIT License.
See the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Naincy Shukla
