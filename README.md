# SAF Project

This repository contains the smart contract, backend API, and frontend app for SAF.

## Run the backend API

The backend entry file is in `backend/src/app.js`.

### Option 1: From the backend folder

```bash
cd backend
npm install
npm run start
```

### Option 2: From the repository root

```bash
npm install
npm run backend
```

Running `node src/app.js` from the repository root is also supported.

### Option 3: Direct Node command from repository root

```bash
node src/app.js
```

A root-level compatibility entrypoint is included to forward to `backend/src/app.js`.
