# SentinelPaper: AI-Powered Forensic Examination Security

SentinelPaper is a high-stakes security platform designed to prevent and trace examination leaks using forensic watermarking and AI-driven analysis.

## 🛡️ Key Features

- **Secure Exam Generation**: Synthesize professional MCQ papers with unique cryptographic watermarks and high-density forensic QR codes.
- **Forensic Leak Tracing**: Analyze leaked document imagery using AI to isolate forensic markers and identify the source node of the leak.
- **Security Copilot**: A real-time AI assistant integrated with live node data to provide contextual security analysis and anomaly summaries.
- **Immutable Audit Vault**: A forensic ledger that records all security events and generation batches, ensuring a permanent chain of custody.
- **Forensic Export**: High-fidelity PDF generation and print optimization for secure physical distribution.

## 🚀 Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, ShadCN UI
- **Backend**: Firebase (Authentication, Firestore)
- **AI Engine**: Direct Groq SDK (Llama 3.3 70B)
- **Forensics**: Node.js Crypto, QRCode generation, jspdf/html2canvas

## 🛠️ Getting Started

1. **Environment Setup**:
   Create a `.env` file with your keys (already ignored by git):
   ```env
   GROQ_API_KEY=your_key_here
   ```

2. **Installation**:
   ```bash
   npm install
   ```

3. **Development**:
   ```bash
   npm run dev
   ```

## 🔒 Security & Git (Push Protection)

If your push is rejected due to "GITHUB PUSH PROTECTION", it means a secret was detected in your commit history. To fix this and satisfy repository rules, follow these steps:

1. **Authorize the Secret (Optional)**: Click the link provided in the GitHub error message to unblock the push.
2. **Clean History (Recommended)**: To completely remove the secret from your local history so GitHub accepts the push without violations:
   ```bash
   # Reset all commits into a single clean one
   git reset $(git commit-tree HEAD^{tree} -m "Initial Clean Commit")
   
   # Force push the clean history to your repository
   git push -f origin main
   ```

---
*Authorized personnel only. Sentinel Node connectivity status: Optimal.*
