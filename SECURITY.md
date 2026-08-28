# Security Policy

## Supported Versions

The following table lists the versions of **Remix TB-Care (โพนนาแก้ว)** currently receiving security updates and active maintenance:

| Version | Supported          | Notes |
| ------- | ------------------ | ----- |
| 5.1.x   | :white_check_mark: | Current active release running in production |
| 5.0.x   | :x:                | Deprecated |
| 4.0.x   | :white_check_mark: | Maintenance security patches only |
| < 4.0   | :x:                | End of life |

## Scope & Sensitive Healthcare Data (PDPA)

**Remix TB-Care โพนนาแก้ว** processes sensitive medical records, patient locations, and epidemiological contact tracing information. We adhere strictly to public health privacy standards and Thailand's Personal Data Protection Act (PDPA).

Key security controls in effect:
- **Role-Based Access Control (RBAC):** Strict role enforcement for Admins, Public Health Officers, and Field Staff.
- **Data Protection:** Data in transit is protected with TLS/HTTPS, and persistent data is secured via Firebase Firestore security rules (`firestore.rules`).
- **Audit Logging:** System actions, notifications, and location shares are logged.

## Reporting a Vulnerability

We take the security of patient data and our systems seriously. If you discover a security vulnerability, please report it responsibly:

### How to Report
- **Email:** Contact the development team at [aekapun.khu@u2t.ac.th](mailto:aekapun.khu@u2t.ac.th)
- **Subject:** `[SECURITY] Vulnerability Report - Remix TB-Care`
- **Responsible Disclosure:** Please do not disclose vulnerabilities publicly or discuss them outside private channels before an official fix has been deployed.

### What to Include in Your Report
1. A clear description of the vulnerability and its potential impact.
2. Step-by-step instructions or proof-of-concept to reproduce the issue.
3. Affected components (e.g., specific API route, Firestore collection, UI component).
4. Any potential mitigations or suggested fixes you have identified.

### What to Expect
- **Acknowledgment:** You will receive an initial response confirming receipt of your report within **24–48 hours**.
- **Assessment & Updates:** We will investigate and provide status updates every **3–5 business days** until resolution.
- **Remediation:** Verified vulnerabilities will be patched promptly and deployed directly to production.
- **Credit:** With your permission, we will acknowledge your contribution once the fix is released.

