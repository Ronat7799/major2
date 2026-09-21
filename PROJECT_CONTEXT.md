# PROJECT_CONTEXT.md

# Reabjom

## Project Overview

Reabjom is a web-based event planning marketplace that connects customers with professional event vendors in Cambodia.

Customers can browse vendors, request quotations, compare offers, book vendors, make payments, communicate with vendors, and leave reviews.

Vendors can create business profiles, manage services, receive quotation requests, send quotations, manage bookings, communicate with customers, and receive reviews.

This project is a university capstone project.

---

# Tech Stack

Frontend
- React
- Tailwind CSS
- React Router
- Axios

Backend
- Node.js
- Express.js
- JWT Authentication

Database
- Supabase PostgreSQL

Storage
- Supabase Storage

Deployment
- Vercel (Frontend)
- Render/Railway (Backend)

---

# User Roles

## Customer

Can

- Register
- Login
- Browse Vendors
- Search Vendors
- Filter Vendors
- View Vendor Profile details
- View Vendor Portfolio
- Request Quotation
- View Quotations
- Accept Quotation
- Make Payment
- Chat with Vendor (after booking/payment)
- View Booking History
- Leave Review
- Edit Profile

---

## Vendor

Can

- Register
- Login
- Edit Business Profile
- Upload Company Logo
- Upload Cover Image
- Manage Services
- Upload Service Images
- Receive Quotation Requests
- Send Quotations
- View Bookings
- Chat with Customers
- View Reviews
- Edit Settings

---

# Business Workflow

Customer

Browse Vendors

↓

View Vendor Profile

↓

Request Quotation

↓

Vendor receives request

↓

Vendor sends quotation

↓

Customer accepts quotation

↓

Booking created

↓

Customer pays

↓

Chat unlocked

↓

Event completed

↓

Customer leaves review

---

# Important Business Rules

Customers can browse vendors without logging in.

Customers must log in before requesting a quotation.

Vendors can create multiple services.

Every service belongs to one vendor.

One quotation request from customer may be sent to each vendors depend on their preference.

Each vendor submits their own quotation.

Customer can only accept one quotation.

Accepted quotation automatically creates a booking.

Chat is only available after booking not afterbpayment.

Only completed bookings can receive reviews.

Ratings are calculated from reviews.

Never allow vendors to manually edit ratings.

---

# Database Rules

Always follow my existing ERD.

Do NOT redesign database tables.

Do NOT rename tables.

Do NOT rename columns.

Keep foreign keys unchanged.

Only suggest schema changes if absolutely necessary.

---

# Coding Rules

Always use modular architecture.

Separate

- Routes
- Controllers
- Services
- Middleware
- Models

Never place business logic inside routes.

Use async/await.

Handle errors properly.

Return consistent JSON responses.

---

# Authentication

Use JWT.

Passwords must be hashed.

Protect private routes.

Customers and Vendors share the Users table.

Role determines permissions.

---

# API Style

RESTful API.

Examples

GET /vendors

GET /vendors/:id

POST /auth/login

POST /quotation-request

POST /quotation

GET /bookings

PUT /services/:id

DELETE /services/:id

---

# UI Rules

Follow my Figma exactly.

Do not redesign layouts.

Use responsive design.

Desktop first.

Mobile responsive.

Keep consistent spacing.

Use reusable components.

---

# Coding Style

Clean code.

Meaningful variable names.

Reusable functions.

Avoid duplicated code.

Keep components small.

---

# Development Order

Phase 1
Authentication

Phase 2
Vendor Profile

Phase 3
Service CRUD

Phase 4
Browse Vendors

Phase 5
Vendor Details

Phase 6
Quotation Request

Phase 7
Vendor Quotation

Phase 8
Booking

Phase 9
Payment

Phase 10
Chat

Phase 11
Reviews

---

# AI Instructions

Read this file before generating any code.

Read the ERD before writing SQL.

Follow the Figma design.

Implement one feature at a time.

Do not generate future features unless requested.

Do not redesign business logic.

Do not invent extra features.

If something is unclear, ask before changing the design.

Always prefer maintainable, production-quality code.
