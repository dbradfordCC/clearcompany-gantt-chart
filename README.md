# Vercel Deployment Guide

## Step-by-Step Deployment Process

### 1. Prepare Your Repository

Create a new GitHub repository with these files:

```
clearcompany-gantt-chart/
├── package.json                    # Use deployment-package.json content
├── vite.config.ts                  # Use deployment-vite.config.ts content  
├── vercel.json                     # Vercel configuration
├── .gitignore                      # Git ignore file
├── README.md                       # Project documentation
├── tsconfig.json                   # Copy from current project
├── tailwind.config.ts              # Copy from current project
├── postcss.config.js               # Copy from current project
├── components.json                 # Copy from current project
├── client/
│   ├── index.html                  # Copy from current project
│   └── src/                        # Copy entire src folder
├── shared/
│   └── schema.ts                   # Copy from current project
└── assets/                         # Create folder with company logos
    ├── ClearCompany_Main_RGB.png
    └── ClearCompany_Bug_RGB.png
```

### 2. GitHub Repository Setup

1. Create a new repository on GitHub
2. Clone it locally:
   ```bash
   git clone https://github.com/yourusername/clearcompany-gantt-chart.git
   cd clearcompany-gantt-chart
   ```

3. Copy all the files from your current project to the new repository
4. Commit and push:
   ```bash
   git add .
   git commit -m "Initial commit: ClearCompany Gantt Chart"
   git push origin main
   ```

### 3. Vercel Deployment

#### Option A: Vercel Dashboard
1. Go to https://vercel.com
2. Sign in with your GitHub account
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect it's a Vite project
6. Deploy settings will be:
   - **Build Command**: `npm run build:static`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`

#### Option B: Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

### 4. Important File Changes

Make sure to use these modified files for deployment:

#### package.json
- Use the content from `deployment-package.json`
- Includes `build:static` script for static site generation
- Removes Replit-specific dependencies

#### vite.config.ts
- Use the content from `deployment-vite.config.ts` 
- Removes Replit-specific plugins
- Uses standard path resolution

#### vercel.json
- Configures static site deployment
- Sets up SPA routing with rewrites
- Adds caching headers for assets

### 5. Asset Handling

1. Create an `assets/` folder in your repository root
2. Copy your ClearCompany logos there:
   - `ClearCompany_Main_RGB.png`
   - `ClearCompany_Bug_RGB.png`

3. Update the vite.config.ts alias:
   ```typescript
   "@assets": path.resolve(__dirname, "assets")
   ```

### 6. Environment Variables

This application doesn't require any environment variables for basic functionality. Everything runs client-side.

### 7. Domain Configuration (Optional)

Once deployed, you can:
1. Add a custom domain in Vercel dashboard
2. Configure DNS records
3. Enable automatic HTTPS

### 8. Continuous Deployment

After initial setup, every push to your main branch will automatically trigger a new deployment on Vercel.

## Troubleshooting

### Common Issues:

1. **Build fails**: Check that all dependencies are in package.json
2. **404 on refresh**: Ensure vercel.json has proper rewrites configuration
3. **Assets not loading**: Verify asset paths and vite.config.ts aliases
4. **TypeScript errors**: Run `npm run check` locally first

### Build Commands Reference:
- Development: `npm run dev`
- Build for production: `npm run build:static`
- Preview build: `npm run preview`
- Type checking: `npm run check`

## Expected Results

After deployment, you'll have:
- ✅ Fast static site hosted on Vercel CDN
- ✅ Automatic HTTPS and custom domain support
- ✅ Continuous deployment from GitHub
- ✅ Perfect Lighthouse scores
- ✅ Global edge network distribution

Your Gantt chart application will be accessible at a URL like:
`https://clearcompany-gantt-chart.vercel.app`