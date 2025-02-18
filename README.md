# Personal Finance Portfolio Management

A modern web application for managing personal finances with real-time tracking, budgeting, and insightful visualizations.



## Features

### Transaction Management
- Add, edit, and delete transactions with amount, description, date, and category
- Support for both income and expenses
- Comprehensive categorization system
- Infinite scroll for transaction history

### Financial Dashboard
- Real-time balance tracking
- Income vs Expenses overview
- Monthly spending trends
- Category-wise expense breakdown
- Interactive charts and visualizations

### Budgeting System
- Set monthly budgets by category
- Budget vs actual spending comparison
- Visual progress indicators
- Spending alerts and insights

### Data Visualization
- Monthly expense bar charts
- Category distribution pie charts
- Budget comparison charts
- Responsive and interactive charts

### User Experience
- Modern, clean interface
- Dark mode support
- Responsive design for all devices
- Real-time updates
- Smooth animations and transitions

## Technology Stack

- **Frontend**:
  - Next.js 14 (App Router)
  - React with TypeScript
  - Tailwind CSS for styling
  - shadcn/ui for UI components
  - Recharts for data visualization

- **Backend**:
  - MongoDB for data storage
  - Next.js API routes
  - Mongoose for database modeling

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sathvikcoderr02/PersonalPortfolioManagement.git
   cd PersonalPortfolioManagement
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment on Netlify

Follow these steps to deploy the application on Netlify:

1. **Sign up/Login to Netlify**
   - Go to [Netlify](https://www.netlify.com/)
   - Sign up or login with your GitHub account

2. **Import your project**
   - Click "Add new site" > "Import an existing project"
   - Select "Deploy with GitHub"
   - Choose your repository `PersonalPortfolioManagement`

3. **Configure build settings**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - The `netlify.toml` file in the repository will handle other configurations

4. **Set environment variables**
   - Go to Site settings > Build & deploy > Environment
   - Add the following environment variables:
     ```
     MONGODB_URI=your_mongodb_connection_string
     ```

5. **Deploy**
   - Click "Deploy site"
   - Netlify will automatically build and deploy your application
   - Any future pushes to the main branch will trigger automatic deployments

6. **Custom domain (Optional)**
   - Go to Site settings > Domain management
   - Add your custom domain
   - Follow Netlify's instructions for DNS configuration

Note: Make sure your MongoDB database is accessible from Netlify's servers. You might need to whitelist Netlify's IP addresses in your MongoDB configuration.

## Project Structure

```
finance-portfolio/
├── src/
│   ├── app/
│   │   ├── api/          # API routes
│   │   └── page.tsx      # Main application page
│   ├── components/       # UI components
│   ├── lib/
│   │   ├── db/          # Database configuration
│   │   └── utils.ts     # Utility functions
│   └── types/           # TypeScript type definitions
├── public/              # Static assets
└── package.json         # Project dependencies
```

## Performance Optimizations

- Memoized calculations for better performance
- Infinite scroll with pagination
- Optimized database queries
- Efficient state management
- Lazy loading of components

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Recharts](https://recharts.org/)
- [MongoDB](https://www.mongodb.com/)
