/**
 * Incident Response Module
 * Contains rule-based predefined response steps for different cyber incident categories.
 */

export const INCIDENT_RESPONSE_RULES: Record<string, {
  immediate: string[];
  security: string[];
  evidence: string[];
  nextSteps: string[];
}> = {
  phishing: {
    immediate: [
      "Disconnect your device from the internet to stop further data transmission.",
      "Close all browser tabs and do not interact with the suspicious link or sender.",
      "If you provided bank details, call your bank immediately to freeze your accounts."
    ],
    security: [
      "Change passwords for your email and any affected online accounts immediately.",
      "Enable Multi-Factor Authentication (MFA) on all sensitive accounts.",
      "Run a full antivirus scan on your device to check for installed malware."
    ],
    evidence: [
      "Take screenshots of the phishing email or SMS, including the sender's details.",
      "Do not delete the original message; it contains technical headers needed for investigation.",
      "Note down the URL of the malicious website if you clicked a link."
    ],
    nextSteps: [
      "Report the incident to the official National Cyber Crime Reporting Portal (cybercrime.gov.in).",
      "Notify the organization being impersonated (e.g., your bank or service provider).",
      "Monitor your financial statements for any unauthorized transactions for the next 30 days."
    ]
  },
  financial_fraud: {
    immediate: [
      "Immediately call your bank or credit card issuer to block your cards and freeze the account.",
      "Notify the payment platform (e.g., GPay, PhonePe, Paytm) used for the transaction.",
      "Block the fraudster's phone number or UPI ID on your device."
    ],
    security: [
      "Reset your UPI PIN, mobile banking password, and ATM PIN.",
      "Check your device for any remote access apps (like AnyDesk or TeamViewer) and uninstall them.",
      "Ensure your bank has your correct mobile number for transaction alerts."
    ],
    evidence: [
      "Save the Transaction ID, UTR number, and date/time of the fraudulent transfer.",
      "Screenshot the payment confirmation page and any chat history with the suspect.",
      "Obtain a mini-statement or detailed bank statement showing the debit."
    ],
    nextSteps: [
      "File a formal written complaint with your bank's Nodal Officer.",
      "Register a complaint at the nearest Cyber Crime Police Station.",
      "Report the fraud on the 1930 Cyber Financial Fraud helpline."
    ]
  },
  account_hacking: {
    immediate: [
      "Use the 'Forgot Password' or 'Account Recovery' feature to regain access.",
      "Select 'Log out of all other sessions' in the security settings if you regain access.",
      "Check if your recovery email or phone number has been changed by the hacker."
    ],
    security: [
      "Immediately change the password for the hacked account and your primary email.",
      "Enable Two-Factor Authentication (2FA) using an authenticator app.",
      "Check for any unauthorized posts, messages, or changes in your profile settings."
    ],
    evidence: [
      "Take screenshots of any 'unauthorized login' emails or notifications.",
      "Save the profile link or username of any account that is now impersonating you.",
      "Keep a log of when you first noticed the loss of access."
    ],
    nextSteps: [
      "Report the hacked account directly to the platform (Instagram, Facebook, etc.) support.",
      "Inform your friends and family so they do not fall for scams from your hacked account.",
      "If sensitive data was stolen, monitor for potential identity theft."
    ]
  },
  identity_theft: {
    immediate: [
      "Contact your bank to alert them of potential identity misuse.",
      "Check your credit report for any unauthorized inquiries or new accounts.",
      "Inform your mobile service provider if you suspect a SIM swap attack."
    ],
    security: [
      "Change passwords and security questions for all your high-value accounts.",
      "Request a credit freeze from the relevant credit bureaus.",
      "Secure your physical identity documents (Aadhar, PAN, Passport)."
    ],
    evidence: [
      "Document all instances where your identity was used without authorization.",
      "Gather copies of any fraudulent applications or bills received in your name.",
      "Keep a record of all correspondence with institutions regarding the theft."
    ],
    nextSteps: [
      "File an FIR at the local police station regarding identity theft.",
      "Notify the relevant government agencies (e.g., UIDAI for Aadhar) if documents are compromised.",
      "Regularly review your financial and credit statements for suspicious activity."
    ]
  },
  email_compromise: {
    immediate: [
      "Immediately change your email password and recovery options.",
      "Check for any 'Auto-forwarding' rules set up in your email settings.",
      "Revoke access for any suspicious third-party apps connected to your email."
    ],
    security: [
      "Enable 2FA/MFA on your email account immediately.",
      "Check 'Sent Items' and 'Trash' for messages you didn't send.",
      "Update passwords for all other accounts that use this email for 'Forgot Password'."
    ],
    evidence: [
      "Screenshot any 'Successful Login' notifications from unknown IP addresses.",
      "Export your email logs if the platform provides them.",
      "Save copies of any fraudulent emails sent from your account."
    ],
    nextSteps: [
      "Notify your professional and personal contacts about the compromise.",
      "Report the incident to your Email Service Provider's security team.",
      "If the email is linked to financial accounts, alert your banks."
    ]
  }
};

/**
 * Gets the response guidance based on the incident category.
 * Returns null if the category is not clearly identified to avoid misleading guidance.
 */
export function getResponseGuidance(category: string) {
  if (!category) return null;
  const key = category.toLowerCase().trim().replace(/\s+/g, '_');
  return INCIDENT_RESPONSE_RULES[key] || null;
}
