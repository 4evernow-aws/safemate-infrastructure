# SafeMate Project Startup Configuration

## 🚨 **IMPORTANT: Workspace Configuration**

### **❌ DO NOT USE: `safemate_v2`**
- **Path**: `D:\cursor_projects\safemate_v2`
- **Status**: **NOT USED ANYMORE** - Empty workspace
- **Action**: **IGNORE** this workspace completely

### **✅ ACTIVE WORKSPACES:**

| Workspace | Path | Purpose | Status |
|-----------|------|---------|--------|
| **Infrastructure** | `D:\safemate-infrastructure` | Terraform, AWS configs, deployment scripts | ✅ **PRIMARY** |
| **Frontend** | `D:\safemate-frontend` | React/Vite frontend application | ✅ **ACTIVE** |
| **Backend** | `D:\safemate-backend` | Lambda functions, API services | ✅ **ACTIVE** |
| **Shared** | `D:\safemate-shared` | Lambda layers, shared utilities | ✅ **ACTIVE** |
| **Docs** | `D:\safemate-docs` | Documentation, diagrams | ✅ **ACTIVE** |

## 🎯 **New Chat Session Protocol**

### **First Question to Ask:**
> "What report or workspace would you like to work on today?"
> 
> **Options:**
> - Infrastructure (Terraform, AWS, deployment)
> - Frontend (React app, UI/UX)
> - Backend (Lambda functions, APIs)
> - Documentation (docs, diagrams)
> - Status Report (system health, monitoring)
> - Other specific task

### **Default Workspace Selection:**
- **If no specific request**: Use `D:\safemate-infrastructure` as primary workspace
- **Never default to**: `D:\cursor_projects\safemate_v2`

## 📁 **Workspace Navigation Commands**

```powershell
# Primary infrastructure workspace
cd D:\safemate-infrastructure

# Frontend workspace
cd D:\safemate-frontend

# Backend workspace
cd D:\safemate-backend

# Documentation workspace
cd D:\safemate-docs

# Shared utilities workspace
cd D:\safemate-shared
```

## 🔧 **Common Tasks by Workspace**

### **Infrastructure (`D:\safemate-infrastructure`)**
- Terraform deployments
- AWS resource management
- Environment configuration
- Deployment scripts
- Infrastructure monitoring

### **Frontend (`D:\safemate-frontend`)**
- React component development
- UI/UX improvements
- Frontend deployment
- User interface fixes

### **Backend (`D:\safemate-backend`)**
- Lambda function development
- API endpoint creation
- Service integration
- Backend logic fixes

### **Documentation (`D:\safemate-docs`)**
- System documentation
- Workflow diagrams
- Status reports
- User guides

## ⚠️ **Important Notes**

1. **Always ask** which workspace/report to work on at session start
2. **Never assume** `safemate_v2` is the target workspace
3. **Default to infrastructure** if no specific request
4. **Verify workspace** before making changes
5. **Check current directory** before running commands

## 🚀 **Quick Start Commands**

```powershell
# Check current workspace
pwd

# List available workspaces
ls D:\ | Where-Object { $_.Name -like "*safemate*" }

# Navigate to primary workspace
cd D:\safemate-infrastructure
```

---

**Remember**: Always ask "What report or workspace would you like to work on?" at the start of new chat sessions!

