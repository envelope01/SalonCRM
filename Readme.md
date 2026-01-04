# SalonCRM — Professional Salon Management System

**SalonCRM** is a full-stack MERN application designed to streamline salon operations. Unlike standard management tools, it prioritizes real-world business flexibility, specifically focusing on dynamic service pricing and detailed financial analytics.

This project was developed as a final-year academic project for **B.Sc. Computer Science**.

---

## 🎯 Project Objective
To provide salon owners with a digitized dashboard that replaces manual bookkeeping. The system focuses on:
* **Operational Efficiency:** Managing clients, visits, and staff from a single interface.
* **Financial Accuracy:** Tracking daily expenses versus earnings.
* **Service Flexibility:** Allowing price adjustments per customer to reflect discounts or premium services.

---

## 🚀 Core Features

### 👤 Client & Visit Management
* **Client Profiles:** Maintain a database of clients and their contact details.
* **Visit Timeline:** View a chronological history of services provided to each client.
* **Flexible Billing:** Add multiple services to a single visit with the ability to override base prices on the fly.

### 💰 Financial Tracking
* **Expense Management:** Record and categorize daily operational costs (e.g., products, rent, utilities).
* **Analytics Dashboard:** Visual representation of financial health using Chart.js.
* **Date Filters:** Toggle views between Daily, Weekly, and Monthly performance.

### 🛠 Service Administration
* **Service Catalog:** Create and manage a menu of services with default pricing.
* **Status Control:** Easily activate or deactivate services based on availability.

---

## 🛠 Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React.js, CSS3, Chart.js |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **Authentication** | JSON Web Tokens (JWT) |

---

## 📂 Project Structure

```text
SalonCRM/
├── frontend/
│   ├── src/           # Components, Pages, and Assets
│   ├── public/        # Static files
│   └── package.json
├── backend/
│   ├── controllers/   # Logic for API routes
│   ├── models/        # MongoDB Schemas
│   ├── routes/        # API Endpoints
│   ├── middleware/    # Auth and Error handling
│   ├── server.js      # Entry point
│   └── package.json
└── README.md

```

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone [https://github.com/your-username/SalonCRM.git](https://github.com/your-username/SalonCRM.git)
cd SalonCRM

```

### 2. Backend Configuration

```bash
cd backend
npm install

```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

```

Start the server:

```bash
npm run dev

```

### 3. Frontend Configuration

```bash
cd ../frontend
npm install
npm start

```

The app will be available at `http://localhost:3000`.

---

## 🧠 Key Business Logic: Dynamic Pricing

A standout feature of **SalonCRM** is its handling of service costs. In the real world, salons often charge differently based on hair length, product usage, or loyalty discounts.

**SalonCRM handles this by:**

1. Fetching a "Base Price" from the Service model.
2. Allowing the user to "Override" that price during the Visit creation.
3. Storing the **final price** within the Visit record itself, ensuring historical reports remain accurate even if the base service price changes in the future.

---

## 👨‍💻 Author

**Vivek Balmiki** *B.Sc. Computer Science*

## 📄 License

This project is for educational purposes.   
