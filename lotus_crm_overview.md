# LotusCRM: Project Overview

LotusCRM is a comprehensive, modern Customer Relationship Management (CRM) system specifically tailored for automotive dealerships. It combines traditional dealership workflows with cutting-edge AI voice and messaging automation.

## 1. Core Automotive Sales Pipeline
It manages the entire lifecycle of a car sale from the first contact to the final delivery. The system tracks:
- **Leads & Enquiries:** Tracks where customers come from (Walk-ins, Meta Ads, WhatsApp, Instagram, Referrals, etc.) and what they are looking for (New Car, Used Car, Service).
- **Test Drives:** Scheduling, logging, and collecting customer feedback for test drives.
- **Quotations:** Generating pricing models, discounts, and final on-road prices.
- **Exchange Evaluations:** Appraising a customer's old car for trade-in value.
- **Finance Applications:** Tracking loan approvals, rejections, and documentation with banks/NBFCs.
- **Delivery Details:** Tracking RC transfers, insurance, accessory fittings, and the final vehicle handover date.

## 2. Multi-Branch & Role Management
The CRM is designed for dealerships with multiple locations:
- **Branches:** Data can be segregated by branch locations.
- **Role-Based Access (RBAC):** It features predefined roles like `SUPER_ADMIN`, `BRANCH_MANAGER`, `CR_TEAM` (Customer Relations), and `CONSULTANT` (Sales Reps) to strictly control who can view and edit specific data.

## 3. Omnichannel Communication & Social Inbox
It acts as a central hub for customer communication:
- Integrates directly with **WhatsApp** and **Instagram** to handle chats within the CRM interface.
- Maintains a unified `Conversation` and `ChatMessage` history so sales reps can see all interactions with a lead in one place.

## 4. Advanced AI & Voice Agents
A standout feature of this CRM is its heavy integration with AI and automated calling:
- **AI Voice Agents:** Utilizing LiveKit, TeleCMI, and Google's Gemini models, the system runs a dedicated "voice worker" service. This allows the CRM to deploy AI agents that conduct actual phone calls with customers in real-time.
- **Outbound Call Campaigns:** The system can automatically queue and dial lists of leads to follow up on enquiries without human intervention.
- **Chatbots:** Configurations exist for WhatsApp and Instagram AI chatbots to automatically handle inbound customer queries 24/7.

## 5. Tech Stack Overview
- **Frontend:** Built with React (Vite), styled beautifully with TailwindCSS, and utilizes TanStack React Query for data fetching and state management.
- **Backend:** A Node.js backend using TypeScript, Express, Prisma ORM for database modeling, and PostgreSQL for the relational database.
- **Infrastructure:** Configured to easily deploy on Render via blueprints, with separate web and AI voice-worker services for scalability.
