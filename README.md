# Ship Port Management

A comprehensive port activity management system with sequential timing validation, sophisticated inline editing, and intelligent adjustment functionality.

## 🚀 Live Demo

- **GitHub Pages (Recommended):** [https://sadrzadehsina.github.io/ship-port-management/](https://sadrzadehsina.github.io/ship-port-management/)
- **Vercel:** [https://ship-port-management-owa1-5xm5pxunj-sina-sadrzadehs-projects.vercel.app/](https://ship-port-management-owa1-5xm5pxunj-sina-sadrzadehs-projects.vercel.app/)

## ✨ Features

### Port Activity Management
- **Sequential Timing Validation** - Ensures activities follow logical time sequences
- **Comprehensive Inline Editing** - Edit activity types, dates, times, and percentages directly in the table
- **Chain Reaction Adjustments** - When moving activities, automatically adjusts timing chains
- **Visual Indicators** - Color-coded validation states and progress indicators
- **CRUD Operations** - Add, edit, delete, and clone activities with full validation

### Technical Features
- **React 19** with TypeScript for modern development
- **TanStack React Query v5** for efficient data management
- **TanStack React Table** for advanced table functionality
- **MSW (Mock Service Worker)** for realistic API simulation
- **Tailwind CSS** with dark mode support
- **Comprehensive Error Handling** and validation

## 🛠️ Development

### Prerequisites
- Node.js 20.x or higher
- npm or yarn

### Installation
```bash
git clone https://github.com/sadrzadehsina/ship-port-management.git
cd ship-port-management
npm install
```

### Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

## 🌐 Deployment

### GitHub Pages (Recommended)
Automatic deployment via GitHub Actions:
1. Push to `main` branch
2. GitHub Actions automatically builds and deploys
3. Available at: `https://username.github.io/ship-port-management/`

### Vercel
Manual deployment:
1. Connect repository to Vercel
2. Configure build settings
3. Deploy with serverless functions

## 🔧 Configuration

### Environment Detection
The app automatically detects the deployment environment:
- **Development:** Uses MSW with `/v1/api/` routes
- **GitHub Pages:** Uses MSW with `/v1/api/` routes  
- **Vercel:** Uses serverless functions with `/api/` routes

### Mock Data
- Powered by Faker.js with hash-based seeding for consistent data
- Realistic port activity scenarios
- Sequential timing logic maintained across sessions

## 📱 Usage

### Lay Times Management
- View all lay times with comprehensive details
- Navigate between different lay time periods

### Port Activity Editing
1. **Add Activities:** Click "+" to add new port activities
2. **Edit Inline:** Click any cell to edit directly
3. **Timing Validation:** System ensures sequential timing
4. **Adjust Chains:** Move activities with automatic chain reaction updates
5. **Clone Activities:** Duplicate existing activities for efficiency

### Validation Features
- **Sequential Timing:** fromDateTime must be ≤ toDateTime
- **Chain Validation:** Activities must connect properly in sequence
- **Visual Feedback:** Red highlighting for invalid states
- **Auto-correction:** Intelligent suggestions for timing conflicts

## 🏗️ Architecture

### Frontend Stack
- **React 19** - Modern React with concurrent features
- **TypeScript** - Full type safety
- **Vite** - Fast development and build tool
- **Tailwind CSS** - Utility-first styling

### Data Management
- **TanStack React Query v5** - Server state management
- **TanStack React Table** - Advanced table functionality
- **React Hook Form** - Form state management

### API Layer
- **Development:** MSW for local API simulation
- **Production:** Vercel serverless functions or MSW on GitHub Pages

## 📋 API Endpoints

### Lay Times
- `GET /api/lay-time` - Get all lay times

### Port Activities
- `GET /api/port-activity/:layTimeId` - Get activities for a lay time
- `POST /api/port-activity/:layTimeId` - Add new activity
- `DELETE /api/port-activity/:layTimeId/delete/:activityId` - Delete activity
- `POST /api/port-activity/:layTimeId/clone` - Clone activity

### Updates
- `PATCH /api/port-activity/update/:layTimeId/:activityIndex/percentage` - Update percentage
- `PATCH /api/port-activity/update/:layTimeId/:activityIndex/datetime` - Update datetime
- `PATCH /api/port-activity/update/:layTimeId/:activityIndex/activity-type` - Update activity type
- `PATCH /api/port-activity/update/:layTimeId/:activityIndex/adjust` - Adjust activity position

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with modern React ecosystem
- Inspired by real-world port management needs
- Comprehensive testing and validation logic
