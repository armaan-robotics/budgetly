export default function PrivacyPolicy() {
  return (
    <div style={{
      fontFamily: "'Segoe UI', sans-serif",
      maxWidth: 800,
      margin: "0 auto",
      padding: "40px 24px",
      color: "#1c1b2e",
      lineHeight: 1.7,
    }}>
      <style>{`
        h1 { color: #7c6ee0; }
        h2 { color: #1c1b2e; margin-top: 32px; }
        a { color: #7c6ee0; }
        hr { border: none; border-top: 1px solid #e0e0e0; margin: 32px 0; }
        .last-updated { color: #888; font-size: 14px; }
      `}</style>

      <h1>Privacy Policy</h1>
      <p className="last-updated">Last updated: March 31, 2026</p>

      <p>
        This Privacy Policy describes how <strong>Budgetly</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;the app&quot;),
        developed by Armaan Gupta, collects, uses, and protects your information when you use
        our application available at{" "}
        <a href="https://budgetly-xldm.vercel.app">budgetly-xldm.vercel.app</a> and on Android
        via Google Play.
      </p>

      <hr />

      <h2>1. What Budgetly Is</h2>
      <p>
        Budgetly is a personal finance tracking tool for individuals, families, and households.
        It allows you to manually record expenses, income, savings, and credits, and view summaries
        and trends over time. Budgetly does not connect to your bank, does not process payments,
        does not move money, and does not provide financial advice.
      </p>
      <p>
        The Android app is a Trusted Web Activity (TWA) — a wrapper around our web application.
        It does not access any device hardware, SMS messages, notifications, contacts, camera,
        or location.
      </p>

      <hr />

      <h2>2. Information We Collect</h2>

      <h3>Account Information</h3>
      <p>
        When you create an account, we collect your email address and a securely hashed password.
        This is used solely to authenticate you and associate your data with your account.
      </p>

      <h3>Financial Data You Enter</h3>
      <p>Budgetly stores the financial data you manually enter, including:</p>
      <ul>
        <li>Expenses and income entries (amount, description, category, date, payment mode)</li>
        <li>Savings records</li>
        <li>Credit records (money owed to or by you)</li>
        <li>Monthly budgets</li>
        <li>Custom categories and accounts</li>
      </ul>
      <p>This data is stored securely and is only accessible by you.</p>

      <h3>What We Do Not Collect</h3>
      <ul>
        <li>We do not access your SMS messages</li>
        <li>We do not access your notifications</li>
        <li>We do not access your contacts</li>
        <li>We do not access your location</li>
        <li>We do not access your camera or microphone</li>
        <li>We do not collect device identifiers</li>
        <li>We do not run ads or track you for advertising purposes</li>
      </ul>

      <hr />

      <h2>3. How We Use Your Information</h2>
      <ul>
        <li>To provide and maintain the Budgetly service</li>
        <li>To display your financial data across your devices</li>
        <li>To allow you to export your own data as CSV</li>
        <li>To improve the app experience</li>
      </ul>

      <hr />

      <h2>4. Data Storage and Security</h2>
      <p>
        Your data is stored securely using{" "}
        <a href="https://supabase.com">Supabase</a>, which provides encrypted storage and
        row-level security. This means only you can access your own financial data — not other
        users, and not us.
      </p>
      <p>All data transmission between the app and our servers is encrypted using HTTPS.</p>

      <hr />

      <h2>5. Data Sharing</h2>
      <p>
        We do <strong>not</strong> sell, trade, or share your personal data with any third parties
        for marketing or advertising purposes.
      </p>
      <p>We use the following third-party services to operate the app:</p>
      <ul>
        <li><strong>Supabase</strong> — database and authentication</li>
        <li><strong>Vercel</strong> — web app hosting</li>
      </ul>
      <p>
        These services operate under their own privacy policies and handle data in accordance
        with industry standards.
      </p>

      <hr />

      <h2>6. Data Retention</h2>
      <p>
        Your data is retained as long as your account is active. You can request deletion of
        your account and all associated data at any time by contacting us at{" "}
        <a href="mailto:armaan.robotics@gmail.com">armaan.robotics@gmail.com</a>.
      </p>

      <hr />

      <h2>7. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access the data we store about you</li>
        <li>Request correction of inaccurate data</li>
        <li>Request deletion of your account and data</li>
      </ul>
      <p>
        To exercise any of these rights, contact us at{" "}
        <a href="mailto:armaan.robotics@gmail.com">armaan.robotics@gmail.com</a>.
      </p>

      <hr />

      <h2>8. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of significant
        changes by updating the date at the top of this page. Continued use of the app after
        changes constitutes acceptance of the updated policy.
      </p>

      <hr />

      <h2>9. Contact Us</h2>
      <p>If you have any questions about this Privacy Policy, please contact:</p>
      <p>
        <strong>Armaan Gupta</strong>
        <br />
        <a href="mailto:armaan.robotics@gmail.com">armaan.robotics@gmail.com</a>
      </p>
    </div>
  );
}
