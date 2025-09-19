# 🚀 New Chat Session Protocol for SafeMate

## **First Question to Ask User:**

> **"What report or workspace would you like to work on today?"**

## **Available Options:**

### **1. Infrastructure Report**
- **Workspace**: `D:\safemate-infrastructure`
- **Focus**: Terraform, AWS resources, deployment scripts
- **Common Tasks**: Environment setup, resource management, deployment

### **2. Frontend Report**
- **Workspace**: `D:\safemate-frontend`
- **Focus**: React application, UI/UX, user interface
- **Common Tasks**: Component development, styling, user experience

### **3. Backend Report**
- **Workspace**: `D:\safemate-backend`
- **Focus**: Lambda functions, API services, business logic
- **Common Tasks**: Service development, API endpoints, integrations

### **4. Documentation Report**
- **Workspace**: `D:\safemate-docs`
- **Focus**: System docs, diagrams, user guides
- **Common Tasks**: Documentation updates, workflow diagrams

### **5. Status Report**
- **Workspace**: Any (usually infrastructure)
- **Focus**: System health, monitoring, current status
- **Common Tasks**: Health checks, status updates, troubleshooting

### **6. Other Specific Task**
- **Workspace**: As needed
- **Focus**: User-specified requirements
- **Common Tasks**: Custom development, specific fixes

## **Default Behavior:**

- **If no specific request**: Use `D:\safemate-infrastructure` as primary workspace
- **Never default to**: `D:\cursor_projects\safemate_v2` (deprecated)

## **Workspace Verification:**

```powershell
# Always verify current workspace
pwd

# List available workspaces
ls D:\ | Where-Object { $_.Name -like "*safemate*" }
```

## **Quick Navigation:**

```powershell
# Infrastructure (default)
cd D:\safemate-infrastructure

# Frontend
cd D:\safemate-frontend

# Backend
cd D:\safemate-backend

# Documentation
cd D:\safemate-docs
```

---

**Remember**: Always ask the user which report/workspace they want to work on at the start of every new chat session!

