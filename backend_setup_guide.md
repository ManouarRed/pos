
# Backend Setup Guide: POS Application (Node.js/Express.js with JSON Files)

This document assumes you have received the backend file structure and initial code.

## Your Next Steps:

1.  **Create `pos-backend` Directory:**
    *   On your computer, create a new folder (e.g., `pos-backend`). This folder should be **separate** from your frontend React project.
    *   Place all the provided backend files and folders (`data`, `middleware`, `routes`, `services`, `.env.example`, `.gitignore`, `package.json`, `server.js`) into this new `pos-backend` directory, maintaining the structure.

2.  **Copy Your Initial Data Files:**
    *   From your frontend project's `public/data/` directory, copy your actual:
        *   `categories.json`
        *   `manufacturers.json`
        *   `products.json`
        *   `users.json`
        *   `sales.json`
    *   Place these five files into the **`pos-backend/data/`** directory. The backend is configured to read from and write to this location (`DATA_DIR=./data` in `.env`).
    *   **Important Note on `users.json` and Passwords:**
        *   The backend uses `bcryptjs` for password hashing.
        *   The example `pos-backend/data/users.json` (if you used that instead of your own) contains **plain text passwords**. The backend's login route (`/api/auth/login`) expects hashed passwords for comparison and will fail with plain text ones.
        *   **To Fix This:**
            1.  If you copied your own `users.json` with plain text passwords, or are using the example: After starting the backend, you'll need to ensure passwords get hashed.
            2.  The simplest way is to use your application: Log in as an admin (you might need to temporarily adjust the login route in `pos-backend/routes/auth.js` to bypass hashing for the first login if all passwords are plain text, or create an admin user with a script). Then, go to "User Management" in your frontend and "edit" each user, re-entering their password (even if it's the same). The `PUT /api/users/:id` endpoint will then hash this password before saving it.
            3.  Alternatively, create a small one-time Node.js script that reads your `pos-backend/data/users.json`, hashes the passwords using `bcryptjs.hashSync(password, 10)`, and overwrites the file.
        *   Any **new users** created via the application's User Management page will have their passwords hashed automatically by the backend.

3.  **Install Dependencies:**
    *   Open your terminal.
    *   Navigate into your `pos-backend` directory (e.g., `cd path/to/pos-backend`).
    *   Run: `npm install`

4.  **Configure Environment Variables:**
    *   In the `pos-backend` directory, rename `.env.example` to `.env`.
    *   Open the `.env` file and **set a strong, unique `JWT_SECRET`**. This is critical for security.
    *   The default `PORT=3001` and `DATA_DIR=./data` should be fine for starting.

5.  **Run the Backend Server:**
    *   From the `pos-backend` directory in your terminal:
        *   For development (server restarts automatically on file changes): `npm run dev`
        *   For a standard run: `npm start`
    *   Look for the console message: `Backend server listening on http://localhost:3001` (or your configured port).

6.  **Connect Frontend to Backend (Local Development):**
    *   Your frontend's `services/productService.ts` uses `API_BASE_URL = '/api'`.
    *   If your frontend (e.g., Vite on port 5173) and backend (port 3001) run on different ports locally, you'll need to either:
        *   **A) Change Frontend `API_BASE_URL`:** Temporarily set it in `services/productService.ts` to `http://localhost:3001/api` (or your backend's port).
        *   **B) Use a Vite Proxy (Recommended):** Add a proxy to your frontend's `vite.config.js` or `vite.config.ts`. This allows you to keep `API_BASE_URL = '/api'` in the frontend.
            ```javascript
            // In your frontend's vite.config.js
            import { defineConfig } from 'vite';
            import react from '@vitejs/plugin-react';

            export default defineConfig({
              plugins: [react()],
              server: {
                proxy: {
                  '/api': {
                    target: 'http://localhost:3001', // Your backend's port
                    changeOrigin: true,
                  }
                }
              }
            });
            ```
            Restart your frontend dev server if you add/change the proxy.

7.  **Test:**
    *   Open your frontend application in the browser.
    *   Try logging in. Check the browser's developer console (Network tab) and your backend's terminal output for any errors.
    *   Test fetching categories, products, etc.

8.  **Production Deployment (`https://obchod.doubleredcars.sk/`):**
    *   The `API_BASE_URL = '/api'` in your frontend is correct.
    *   Your web server (e.g., Nginx) serving your domain must be configured to:
        *   Serve your frontend's static files (from its `dist` folder).
        *   Proxy all requests made to `/api/*` to your running backend application (e.g., `http://localhost:3001/api` if the backend runs on the same machine).

This backend provides a basic file-based data persistence layer. For more robust and scalable applications, consider migrating to a database like MySQL in the future.
