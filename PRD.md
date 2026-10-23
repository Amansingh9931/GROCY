# GroceCart Product Requirements Document (PRD)

## 1. Product Overview

GroceCart is a grocery delivery and commerce platform that allows customers to browse products, add them to a cart, place orders, and receive deliveries. The platform also supports three user roles: customer, admin, and delivery agent. It is designed as a full-stack web application with a React frontend and Express/MongoDB backend.

The product aims to provide a streamlined online grocery shopping experience similar to quick-commerce platforms, while also supporting operations and fulfillment workflows.

---

## 2. Problem Statement

Many users want a convenient way to order groceries online without visiting a physical store. At the same time, store operators need tools to manage inventory, view customers, monitor orders, and coordinate delivery agents effectively.

The current market gap is an integrated system that combines:

- product catalog browsing
- cart and checkout flow
- order management
- role-based access for admin and delivery partners
- real-time delivery coordination

GroceCart addresses this by combining shopping, operations, and logistics in a single platform.

---

## 3. Product Vision

To build a reliable and scalable grocery delivery experience that makes everyday shopping faster, more transparent, and easier for both customers and operators.

---

## 4. Goals

### Business Goals

- Increase online grocery order volume
- Reduce manual order management overhead
- Improve delivery efficiency and completion rates
- Manage inventory and user roles centrally
- Create a clear operational dashboard for admin and delivery teams

### User Goals

- Customers should be able to buy groceries quickly and confidently
- Admins should be able to manage products, users, and orders efficiently
- Delivery agents should be able to accept and complete deliveries without confusion

---

## 5. Target Users

### 5.1 Customer / Shopper

A user who browses products, adds items to cart, places an order, and tracks delivery status.

Primary needs:

- simple product discovery
- clear pricing and cart totals
- order placement without friction
- delivery status visibility
- profile and address management

### 5.2 Admin

A store or operations manager responsible for inventory, user management, and order oversight.

Primary needs:

- product creation and editing
- category management
- user and delivery agent monitoring
- order visibility and operational control

### 5.3 Delivery Agent

A fulfillment partner who accepts pending orders, delivers them, and updates delivery status.

Primary needs:

- list of available orders
- ability to accept a delivery
- active delivery management
- delivery completion and earnings tracking

---

## 6. Core User Journeys

### Customer Journey

1. User opens the app and browses grocery items
2. User searches or navigates categories
3. User views product details and adds items to cart
4. User reviews cart and proceeds to checkout
5. User selects an address and payment method
6. User places the order
7. User receives order status updates
8. User can view order history and profile details

### Admin Journey

1. Admin logs in
2. Admin reviews dashboard metrics
3. Admin adds or edits products
4. Admin manages user and delivery agent records
5. Admin inspects order flow and statuses
6. Admin resolves operational issues as needed

### Delivery Agent Journey

1. Delivery agent logs in
2. Agent views available orders pool
3. Agent accepts an order
4. Agent navigates to active delivery details
5. Agent marks order as out for delivery and delivered
6. Agent reviews their earnings and history

---

## 7. Scope

### In Scope

- product catalog and search
- cart management
- guest and authenticated cart behavior
- address-based checkout
- order placement and order status lifecycle
- customer order history
- admin dashboard and product management
- delivery agent assignment and fulfillment workflow
- earnings and delivery history tracking
- role-based access protection

### Out of Scope (Initial Version)

- advanced loyalty programs
- subscription-based grocery plans
- multi-store inventory orchestration
- payment gateway integration beyond placeholder flow
- in-app chat between customer and agent
- AI recommendations and personalized recommendations
- advanced analytics and forecasting

---

## 8. Product Requirements

### 8.1 Functional Requirements

#### Customer Requirements

1. The system shall allow a customer to register and log in using email and password.
2. The system shall allow a customer to browse all products and filter by category or search term.
3. The system shall allow a customer to view product details, including description, price, and images.
4. The system shall allow a customer to add items to a cart and adjust quantities.
5. The system shall allow a customer to view cart totals and proceed to checkout.
6. The system shall allow a customer to select or update a delivery address.
7. The system shall allow a customer to place an order with a selected payment method.
8. The system shall show the order status through lifecycle states such as Pending, Accepted, Out for Delivery, Delivered, and Cancelled.
9. The system shall let a customer view their previous orders and account profile.

#### Admin Requirements

1. The system shall allow an admin to log in with elevated permissions.
2. The system shall show a dashboard with order, user, and delivery-related metrics.
3. The system shall allow an admin to add, edit, and delete products.
4. The system shall allow an admin to view all registered users and delivery agents.
5. The system shall allow an admin to view all orders and their current status.
6. The system shall allow an admin to manage delivery agents and their records.

#### Delivery Agent Requirements

1. The system shall allow a delivery agent to log in and view a dedicated dashboard.
2. The system shall show a pool of available orders that are still pending and unassigned.
3. The system shall prevent an agent from accepting more than one active order at a time.
4. The system shall allow an agent to accept a pending order.
5. The system shall allow an agent to mark an order as Out for Delivery.
6. The system shall allow an agent to mark an order as Delivered.
7. The system shall update earnings based on order commission.
8. The system shall show the agent’s delivery history and earnings overview.

---

## 9. Role-Based Access Rules

### User Role

- can browse products
- can add to cart
- can place orders
- can manage profile and address
- can view order history

### Admin Role

- can manage catalog
- can manage users and agents
- can view global metrics and order operations
- can access all admin screens

### Delivery Agent Role

- can access delivery dashboard and order pool
- can accept and update active orders
- can view earnings and delivery history
- cannot manage product catalog or user records

---

## 10. Core Business Logic

### Cart Logic

- guests can maintain a local cart
- logged-in users sync cart to backend storage
- guest cart can merge into the user cart after login
- cart quantities are tracked by product and size

### Order Lifecycle

Pending -> Accepted -> Out for Delivery -> Delivered

Optional cancellation path:

Pending/Accepted orders may be cancelled depending on business rules.

### Delivery Assignment Logic

- only pending unassigned orders are visible in the available orders list
- a delivery agent can accept only one active order at a time
- once accepted, order status becomes Accepted
- agent can later update to Out for Delivery and Delivered
- order commission is calculated when delivered

### Earnings Logic

- commission is calculated based on the order amount
- current implementation uses a fixed percentage model for delivery agents
- agent totals and historical delivery records must be stored and displayed

---

## 11. Key User Stories

### Customer

- As a customer, I want to browse groceries by category so I can find what I need quickly.
- As a customer, I want to add products to a cart so I can prepare my order.
- As a customer, I want to checkout with my address and payment choice so I can place an order.
- As a customer, I want to see order status so I know when my delivery will arrive.

### Admin

- As an admin, I want to add new products so the catalog stays current.
- As an admin, I want to view all orders so I can monitor performance.
- As an admin, I want to manage users and delivery agents so operations are organized.

### Delivery Agent

- As a delivery agent, I want to see available orders so I can pick up new work.
- As a delivery agent, I want to accept only one active order to avoid overload.
- As a delivery agent, I want to mark orders delivered so I can complete my route.
- As a delivery agent, I want earnings visibility so I can track performance.

---

## 12. Non-Functional Requirements

### Performance

- product pages and catalog should load quickly under normal traffic
- cart updates should feel instant
- dashboard data should refresh without major delays

### Reliability

- order state transitions should be atomic and secure
- invalid or unauthorized actions should be prevented
- delivery assignment rules must prevent duplicate assignments

### Security

- authentication and role-based authorization must be enforced
- user and admin routes must be protected
- sensitive user data must be secured and not exposed to unauthorized roles

### Usability

- interfaces should be simple and mobile-friendly
- ordering flow should minimize friction
- actions should provide visible feedback using toast notifications and status messages

### Scalability

- backend should support additional products, users, orders, and agents over time
- architecture should allow future integration with payments, notifications, and analytics

---

## 13. UX Requirements

- clean, modern grocery storefront experience
- product cards with pricing, category, and action buttons
- cart drawer for quick purchase flow
- simple and clear dashboard views for admins and delivery agents
- map-enabled delivery detail view for active deliveries
- responsive layout for desktop and mobile browsing

---

## 14. Acceptance Criteria

### Customer Checkout

- A user can browse products and add them to the cart
- The cart total updates correctly based on selected quantities
- A logged-in user can place an order successfully with a valid address
- An order appears in the customer order history after checkout
- The initial order status is Pending

### Admin Workflow

- Admin can add a product with name, description, price, category, stock, and image
- Admin can edit existing product details
- Admin can view all users, agents, and orders
- Admin dashboard shows operational metrics

### Delivery Workflow

- A delivery agent sees available pending orders
- Agent can accept a single available order
- System prevents a second active order from being accepted
- Agent can mark the order as Out for Delivery and Delivered
- Agent earnings update after delivery

---

## 15. Functional Modules

### Catalog Module

- product listing
- search and filter
- product detail page
- category-based browsing

### Cart and Checkout Module

- add/remove/update quantities
- guest cart persistence
- authenticated cart sync
- order placement and payment selection

### Order Management Module

- order creation
- status updates
- customer order history
- admin order management

### Delivery Module

- available orders list
- accept delivery request
- active delivery view
- delivery status tracking
- commission and earnings tracking

### User and Admin Management Module

- signup/login
- profile editing
- role validation
- user and agent management screens

---

## 16. Technical Assumptions

The project currently uses:

- React frontend for user interfaces
- Express.js backend for APIs
- MongoDB with Mongoose for data persistence
- role-based route protection
- Socket-based real-time behavior for delivery updates
- Cloudinary for media-related asset handling

These technologies support the business flow for grocery commerce and delivery operations.

---

## 17. Risks and Dependencies

### Risks

- payment flow is not yet fully implemented
- real-time tracking depends on reliable delivery and socket behavior
- address validation and map details can affect delivery success
- stock and inventory consistency must be managed carefully

### Dependencies

- stable backend API connectivity
- valid database records for products, users, and addresses
- delivery agent availability
- accurate geolocation details for active delivery routing

---

## 18. Success Metrics

- number of orders placed per week
- cart completion rate
- percent of orders successfully delivered
- order fulfillment time from acceptance to delivery
- admin efficiency in managing products and order volume
- delivery agent completion rate and earnings

---

## 19. Release Plan

### MVP Release

- shopping catalog
- cart and checkout
- order placement
- user login/signup
- role-based admin and delivery views
- delivery agent order acceptance and fulfillment

### Future Releases

- payment gateway integration
- order notifications and alerts
- advanced search and category filters
- customer support and chat
- analytics dashboard
- loyalty and promotions

---

## 20. Final Product Summary

GroceCart is a grocery commerce and delivery platform built for three major user groups: shoppers, admins, and delivery agents. It combines product browsing, cart management, secure ordering, operational dashboards, and fulfillment workflows in one end-to-end system.

The MVP delivers the core digital grocery experience and operational backend required to run a small to mid-scale grocery business efficiently.
