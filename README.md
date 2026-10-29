# Career Seeker

A full-stack MERN-style job portal with applicant and recruiter accounts.

Coded by Code-with-Abhinav. All rights belong to Abhinav.

## Features

### Applicant experience
- Browse open roles on **Find jobs**.
- Search by title, skill, description, or company; filter by location and employment type.
- Open a job detail page with role description, skills, company details, and compensation when provided.
- Submit an application with an optional cover letter and PDF/DOC/DOCX résumé (maximum 5 MB).
- Track submitted applications and their status from the applicant dashboard.
- Maintain an applicant profile with headline, contact details, location, skills, résumé link, and bio.

### Recruiter experience
- Create a recruiter profile with professional title and company information.
- Post jobs with company website/about text, location, employment type, skills, salary range, and description.
- See job posts and application counts in the recruiter dashboard.
- Review applications, applicant contact details, résumé links, and application status.

## Setup on Windows / VS Code

1. Extract the ZIP and open the `job portal` folder in VS Code.
2. Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`.
3. Set `MONGODB_URI` and a long random `JWT_SECRET` in `backend/.env`. Set the Cloudinary values if you want résumé uploads to be stored remotely.
4. Open a terminal in `backend` and run:

   ```powershell
   npm install
   npm run dev
   ```

5. Open a second terminal in `frontend` and run:

   ```powershell
   npm install
   npm run dev
   ```

6. Open the frontend URL printed by Vite (usually `http://localhost:5173`). Register an account as an **Applicant** or **Recruiter**.

## Environment configuration

- `backend/.env`: MongoDB connection, JWT secret, client origin, and Cloudinary credentials.
- `frontend/.env`: `VITE_API_URL=http://localhost:5000/api` by default.
- Do not commit `.env` files or share API keys. Only the `.env.example` templates are included in this ZIP.

## Main API routes

- `GET /api/jobs` — public job list with optional `keyword`, `location`, and `employmentType` filters.
- `GET /api/jobs/:id` — public job details.
- `POST /api/jobs` — recruiter job posting.
- `GET /api/applications` — applications belonging to the signed-in applicant or jobs owned by the signed-in recruiter.
- `POST /api/applications` — applicant application submission (multipart form with optional `resume`).
- `PATCH /api/auth/profile` — update the signed-in user's role-specific profile.
