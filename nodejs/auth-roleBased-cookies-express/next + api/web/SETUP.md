# Quick Setup Guide

## Prerequisites
- Node.js 18+ installed
- Backend API running on `localhost:8010`

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
The `.env.local` file is already configured for development:
```env
BUILD_MODE=dev
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:8010
```

For production, update the API URL in `.env.production`:
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-production-api.com
```

### 3. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

## Project Structure Overview

```
web/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Authentication pages
│   │   ├── (protected)/     # Protected pages (requires auth)
│   │   └── layout.tsx       # Root layout with providers
│   │
│   ├── components/
│   │   ├── layout/          # Layout components (Header, etc.)
│   │   └── ui/              # Reusable UI components
│   │
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.tsx  # Authentication state
│   │   ├── ThemeContext.tsx # Theme state
│   │   └── Providers.tsx    # Combined providers
│   │
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Libraries and utilities
│   │   ├── api/            # API functions
│   │   ├── axios/          # Axios configuration
│   │   └── utils/          # Utility functions
│   │
│   └── config/              # Configuration files
│       ├── theme.ts        # Theme configuration
│       └── rbacConfig.ts   # Role & permissions
│
├── .env.local               # Development environment variables
└── README.md                # Full documentation
```

## Available Routes

### Public Routes
- `/` - Landing page
- `/login` - User login
- `/register` - User registration
- `/forgot-password` - Password recovery

### Protected Routes (Requires Authentication)
- `/dashboard` - Main dashboard (role-based content)
- `/dashboard/profile` - User profile
- `/dashboard/users` - User management (Admin only)
- `/dashboard/analytics` - Analytics (Admin only)
- `/dashboard/bookings` - Bookings management

## User Roles

### Admin
- Full access to all features
- User management
- Bus & route management
- Analytics
- System settings

### Client
- Book tickets
- View personal bookings
- Manage profile
- View dashboard

## Testing the Application

### 1. Start the Backend API
Make sure your backend API is running on `http://localhost:8010`

### 2. Register a New User
1. Navigate to http://localhost:3000
2. Click "Create Account"
3. Fill in the registration form
4. (Optional) Verify email if email service is configured

### 3. Login
1. Use your registered credentials
2. You'll be redirected to the dashboard

### 4. Test Role-Based Features
- **As Client**: You'll see booking-related features
- **As Admin**: You'll see all management features

## Common Issues

### Cannot connect to API
**Problem**: API requests failing

**Solution**:
- Check if backend is running on port 8010
- Verify NEXT_PUBLIC_API_URL in `.env.local`
- Check network tab in browser DevTools

### Theme not working
**Problem**: Dark mode not toggling

**Solution**:
- Clear browser localStorage
- Hard refresh (Ctrl+Shift+R)
- Check browser console for errors

### Build failures
**Problem**: `npm run build` fails

**Solution**:
```bash
# Clear cache and rebuild
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

## Development Tips

### Adding New Pages
1. Create page in appropriate route group
2. Use `'use client'` for client components
3. Protected pages go in `(protected)/` group

### Adding New Permissions
1. Edit `src/config/rbacConfig.ts`
2. Add permission to `permissions` object
3. Add to role in `rolePermissions`
4. Use `usePermission()` hook in components

### Styling
- Use Tailwind CSS classes
- Dark mode: use `dark:` prefix
- Theme colors available in `src/config/theme.ts`

## Next Steps

1. **Connect to Real API**: Update API endpoints in `src/lib/api/index.ts`
2. **Add More Pages**: Implement booking, bus management, etc.
3. **Email Service**: Set up email verification and password reset
4. **Payment Integration**: Add payment gateway
5. **Testing**: Add unit and integration tests

## Support

For issues or questions:
- Check the main [README.md](./README.md)
- Review the code in `src/` directory
- Check Next.js documentation

## License

Educational project
