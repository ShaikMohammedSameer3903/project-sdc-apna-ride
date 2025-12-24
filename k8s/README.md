Kubernetes manifests for ApnaRide

This folder contains simple Kubernetes manifests to run the frontend, backend and a dev Postgres for local clusters (minikube / kind).

Files
- namespace.yaml - creates the `apnaride` namespace
- frontend-deployment.yaml - Deployment for the frontend (update image name)
- frontend-service.yaml - ClusterIP Service for frontend
- backend-deployment.yaml - Deployment for the backend (update image name)
- backend-service.yaml - ClusterIP Service for backend
- postgres-deployment.yaml - Simple PostgreSQL deployment (dev only, uses emptyDir)
- ingress.yaml - Example ingress entry (requires an nginx ingress controller)

Usage (minikube)
1. Start minikube: 

   minikube start --driver=hyperv

2. Build images and load into minikube (frontend & backend):

   # in apnaride-frontend
   cd apnaride-frontend
   docker build -t apnaride-frontend:local .
   minikube image load apnaride-frontend:local

   # in Back End
   cd ../Back\ End
   docker build -t apnaride-backend:local .
   minikube image load apnaride-backend:local

3. Apply manifests

   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/

Notes
- Update the `image:` fields in frontend/backend deployments to point to your registry tags for production.
- The Postgres manifest uses an in-cluster emptyDir volume; for real workloads replace it with a PVC.
- The ingress host `apnaride.local` requires an entry in your hosts file mapping to your cluster IP.
