# Solar Roof Verify

Solar Roof Verify is a web application used to check and verify the details of solar rooftop installations.  
This project is hosted online and also supports Docker deployment.

---

## 🌐 Live Website Link
https://roofscan.netlify.app

---

## 📝 Project Details
- **Frontend Framework:** React + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Hosting:** Netlify
- **CI/CD:** GitHub Actions for Docker build

---

## 🐳 Docker Support

A Docker workflow has been added to automatically build a Docker image whenever changes are pushed to the `main` branch.

### How it works
When you push any code to the `main` branch:
- GitHub Actions will run automatically
- It will build a Docker image using your `Dockerfile`

The workflow file is located at:
