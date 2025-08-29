# InvoiceFlow - Modern Billing Management System

A comprehensive, professional billing application built with **Next.js 15**, **React 19**, and **Tailwind CSS 4**. This full-stack application demonstrates modern web development practices with both frontend and backend running on the same URL and port.

## ✨ Features

### 🎯 **Core Functionality**
- **Complete Invoice Management** - Create, edit, track, and manage invoices
- **Customer Management** - Comprehensive customer profiles and billing history  
- **Payment Tracking** - Record and track payments across multiple methods
- **Dashboard Analytics** - Real-time business insights and performance metrics

### 🚀 **Advanced Features** 
- **PDF Generation** - Professional invoice PDFs without external dependencies
- **Email System** - Send invoices via email with professional templates
- **Data Export** - Export data in CSV, JSON, and detailed report formats
- **Advanced Reports** - Comprehensive analytics with charts and trends
- **Demo Data Generator** - Realistic sample data for testing and demonstration

### 🎨 **UI/UX Excellence**
- **Responsive Design** - Works perfectly on all screen sizes
- **Modern Design System** - Clean, professional interface with Tailwind CSS
- **Light/Dark Mode** - Complete theme support (currently disabled for consistency)
- **Professional Animations** - Smooth transitions and micro-interactions

### 🔧 **Technical Excellence**
- **Full-Stack Architecture** - Both API and frontend in single Next.js app
- **JSON File Storage** - No database required - perfect for demos and development
- **TypeScript Ready** - Structured with proper types and validation
- **Modern React** - Uses latest React 19 features and best practices

## 🛠️ **Tech Stack**

- **Frontend:** Next.js 15, React 19, Tailwind CSS 4
- **Backend:** Next.js API Routes, JSON file storage
- **Styling:** Tailwind CSS with custom design system
- **Icons:** Heroicons (SVG)
- **Fonts:** Geist Sans & Geist Mono
- **Package Manager:** pnpm

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd billing_app_next
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development server**
   ```bash
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

5. **Generate demo data** (optional)
   - Register a new account or login with demo credentials
   - Use the "Generate Demo Data" button to populate with realistic sample data

## 🎮 **Demo Credentials**

For quick testing, use these demo credentials:
- **Email:** demo@invoiceflow.com
- **Password:** demo123

## 📁 **Project Structure**

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # Backend API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── customers/     # Customer management
│   │   ├── invoices/      # Invoice management  
│   │   ├── payments/      # Payment tracking
│   │   └── dashboard/     # Analytics & stats
│   ├── dashboard/         # Main dashboard pages
│   ├── invoices/          # Invoice management pages
│   ├── customers/         # Customer management pages
│   ├── payments/          # Payment tracking pages
│   └── reports/           # Analytics & reporting
├── components/            # Reusable UI components
│   ├── dashboard/         # Layout components
│   ├── ui/               # Basic UI elements
│   ├── invoice/          # Invoice-specific components
│   └── export/           # Data export components
├── utils/                # Utility functions
│   ├── storage.js        # Data persistence layer
│   ├── pdfGenerator.js   # PDF generation
│   ├── emailService.js   # Email functionality
│   └── exportService.js  # Data export utilities
└── data/                 # JSON data storage
    ├── users.json        # User accounts
    ├── customers.json    # Customer data
    ├── invoices.json     # Invoice records
    └── payments.json     # Payment history
```

## 🎯 **Key Features Showcase**

### Invoice Management
- Create professional invoices with line items, tax calculations
- Multiple status tracking (draft, sent, paid, overdue)
- PDF generation and email sending
- Payment recording and history

### Customer Management  
- Complete customer profiles with billing information
- Track customer history and payment behavior
- Export customer data in multiple formats

### Analytics & Reporting
- Revenue trends and growth metrics
- Customer analytics and insights
- Payment method analysis
- Comprehensive business reporting

### Data Export
- Export invoices, customers, payments to CSV/JSON
- Generate detailed business reports
- Full system backup functionality

## 🌐 **API Documentation**

The application includes a complete RESTful API:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Invoices
- `GET /api/invoices` - List invoices (with pagination)
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/[id]` - Get specific invoice
- `PUT /api/invoices/[id]` - Update invoice
- `DELETE /api/invoices/[id]` - Delete invoice

### Customers  
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/[id]` - Get customer details
- `PUT /api/customers/[id]` - Update customer

### Payments
- `GET /api/payments` - List payments
- `POST /api/payments` - Record payment

## 🚢 **Deployment**

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Deploy automatically with zero configuration

### Other Platforms
This Next.js app can be deployed to any platform supporting Node.js:
- Netlify
- Railway  
- DigitalOcean
- AWS
- Google Cloud

## 🤝 **Contributing**

This project demonstrates modern full-stack development practices. Feel free to:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 **License**

This project is open source and available under the [MIT License](LICENSE).

## 🎉 **Acknowledgments**

Built with modern web technologies:
- [Next.js](https://nextjs.org/) - The React Framework for Production
- [React](https://reactjs.org/) - A JavaScript library for building user interfaces  
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Heroicons](https://heroicons.com/) - Beautiful hand-crafted SVG icons

---

**InvoiceFlow** - Demonstrating professional full-stack development with Next.js 🚀
