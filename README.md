# PickPerfect- AI-Powered E-Commerce Application

PickPerfect is an intelligent e-commerce platform that leverages machine learning to provide personalized product recommendations. By analyzing user behavior and preferences, our system delivers tailored shopping experiences that increase engagement and conversion rates.

This repository contains the full MERN stack application with integrated AI recommendation engine, including the React frontend, Node.js/Express backend, and FastAPI machine learning service.

## Features

#### AI-Powered Recommendations

- **Personalized Product Suggestions** : Machine learning algorithms analyze user behavior to recommend relevant products
-
- **Collaborative Filtering** : User-based and item-based recommendation systems
- **Content-Based Filtering** : Product similarity analysis based on attributes and descriptions

#### E-Commerce Platform

- **User Authentication** : Secure JWT-based authentication system
- **Product Catalog** : Dynamic product management with categories, filtering, and search
- **Shopping Cart** : Persistent cart functionality with session management
- **Order Processing** : Complete checkout flow with order history
- **User Dashboard** : Personalized user profiles with recommendation insights

## Architecture

**text**

```
Frontend (React) ──────▶ Backend (Node.js/Express) ──────▶ ML Service (FastAPI)
       │                         │                                 │
       │                         │                                 │
       ▼                         ▼                                 ▼
   MongoDB                  Redis Cache                    Scikit-learn Model
   (Users/Orders)        (Session/Recommendations)
```

- **React Frontend** : Modern, responsive UI with Material-UI components
- **Node.js Backend** : RESTful API with Express.js and MongoDB
- **FastAPI ML Service** : Python-based machine learning service with scikit-learn
- **MongoDB** : Primary database for users, products, and orders
- **Redis** : Caching layer for recommendations and session management

## 🛠️ Tech Stack

### Frontend

- **React 18** with JavaScript
- **Tailwind**
- **React Router** for navigation
- **Redux Toolkit** for state management
- **Axios** for API communication
- **Chart.js** for data visualization

### Backend

- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **MongoDB** with **Mongoose** ODM
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Redis** for caching and session storage

### Machine Learning Service

- **FastAPI** with Python 3.10+
- **Scikit-learn** for ML models
- **Pandas** & **NumPy** for data processing
- **Joblib** for model serialization
- **StandardScaler** for feature normalization

### DevOps & Infrastructure

- **Docker** & **Docker Compose** for containerization
- **NGINX** as reverse proxy
- **PM2** for process management
- **GitHub Actions** for CI/CD
- **AWS** (optional) for cloud deployment

### **Project Structure**
